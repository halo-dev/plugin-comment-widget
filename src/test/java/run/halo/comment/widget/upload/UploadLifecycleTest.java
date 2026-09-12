package run.halo.comment.widget.upload;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Predicate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.web.server.ResponseStatusException;
import run.halo.app.core.extension.attachment.Attachment;
import run.halo.app.core.extension.content.Comment;
import run.halo.app.extension.Extension;
import run.halo.app.extension.ExtensionClient;
import run.halo.app.extension.ListOptions;
import run.halo.app.extension.ListResult;
import run.halo.app.extension.Metadata;
import run.halo.app.extension.MetadataUtil;
import run.halo.app.extension.controller.Reconciler;
import run.halo.app.extension.index.query.Queries;

class UploadLifecycleTest {

    final ExtensionClient client = mock(ExtensionClient.class);
    final Map<String, Extension> records = new HashMap<>();
    final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();
    final UploadLifecycleService service = new UploadLifecycleService(client);
    final String token = "a".repeat(64);
    final String hash = UploadIdentity.credential(token);
    final String owner = "anonymousUser";

    @BeforeEach
    void setup() {
        service.setReferenceIndexReady(true);
        when(client.listBy(any(Class.class), any(), any())).thenAnswer(call -> {
            Class<?> type = call.getArgument(0);
            ListOptions options = call.getArgument(1);
            var rows = records
                .values()
                .stream()
                .filter(type::isInstance)
                .filter(e -> matches(e, options))
                .map(this::copy)
                .toList();
            return new ListResult<>(rows);
        });
        when(client.fetch(any(Class.class), anyString())).thenAnswer(call -> {
            var value = records.get(
                ((Class<?>) call.getArgument(0)).getName() + call.getArgument(1)
            );
            return Optional.ofNullable(value == null ? null : copy(value));
        });
        when(client.list(any(Class.class), any(), any())).thenAnswer(call ->
            records
                .values()
                .stream()
                .filter(v -> ((Class<?>) call.getArgument(0)).isInstance(v))
                .filter(
                    v -> call.getArgument(1) == null || ((Predicate) call.getArgument(1)).test(v)
                )
                .map(this::copy)
                .toList()
        );
        doAnswer(call -> {
            Extension e = call.getArgument(0);
            save(e);
            return null;
        })
            .when(client)
            .create(any());
        doAnswer(call -> {
            Extension e = call.getArgument(0);
            save(e);
            return null;
        })
            .when(client)
            .update(any());
        doAnswer(call -> {
            Extension e = call.getArgument(0);
            records.remove(key(e));
            return null;
        })
            .when(client)
            .delete(any());
    }

    @Test
    void cancelIssuedTicketThroughEndpointChecksOwnershipAndPreservesImages() {
        var upload = uploaded();
        var ticket = service.issue(hash, owner);
        var web = org.springframework.test.web.reactive.server.WebTestClient
            .bindToRouterFunction(new UploadSubmissionEndpoint(service).endpoint()).build();
        var path = "/submissions/" + ticket.getMetadata().getName();
        web.delete().uri(path).header(UploadIdentity.TOKEN_HEADER, "b".repeat(64))
            .exchange().expectStatus().isForbidden();
        web.delete().uri(path).header(UploadIdentity.TOKEN_HEADER, token)
            .exchange().expectStatus().isNoContent();
        assertThat(service.getSubmission(ticket.getMetadata().getName(), hash, owner)
            .getSpec().getState()).isEqualTo(CommentSubmission.State.FAILED);
        assertThat(service.getUpload(upload.getMetadata().getName()).getSpec().getState())
            .isEqualTo(CommentUpload.State.TEMPORARY);
        assertThatThrownBy(() -> service.available(ticket.getMetadata().getName(), hash, owner))
            .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void onlyUnusedTicketsCanBeCancelled() {
        uploaded();
        for (var state : CommentSubmission.State.values()) {
            if (state == CommentSubmission.State.ISSUED) continue;
            var ticket = service.issue(hash, owner);
            ticket.getSpec().setState(state);
            save(ticket);
            assertThatThrownBy(() -> service.cancelIssued(ticket.getMetadata().getName(), hash, owner))
                .isInstanceOf(ResponseStatusException.class);
            assertThat(service.getSubmission(ticket.getMetadata().getName(), hash, owner)
                .getSpec().getState()).isEqualTo(state);
        }
    }

    @Test
    void cancellationCannotOverwriteAConcurrentReservation() {
        uploaded();
        var ticket = service.issue(hash, owner);
        doAnswer(call -> {
            CommentSubmission candidate = call.getArgument(0);
            var concurrent = service.getSubmission(candidate.getMetadata().getName(), hash, owner);
            concurrent.getSpec().setState(CommentSubmission.State.PREPARING);
            save(concurrent);
            throw new OptimisticLockingFailureException("Concurrent ticket reservation");
        }).when(client).update(any(CommentSubmission.class));
        assertThatThrownBy(() -> service.cancelIssued(ticket.getMetadata().getName(), hash, owner))
            .isInstanceOf(OptimisticLockingFailureException.class);
        assertThat(service.getSubmission(ticket.getMetadata().getName(), hash, owner)
            .getSpec().getState()).isEqualTo(CommentSubmission.State.PREPARING);
    }

    @Test
    void cancellationWinsAgainstADelayedReservation() throws Exception {
        var upload = uploaded();
        var ticket = service.issue(hash, owner);
        doAnswer(call -> {
            CommentSubmission candidate = call.getArgument(0);
            if (candidate.getSpec().getState() == CommentSubmission.State.PREPARING) {
                service.cancelIssued(candidate.getMetadata().getName(), hash, owner);
                throw new OptimisticLockingFailureException("Concurrent ticket cancellation");
            }
            save(candidate);
            return null;
        }).when(client).update(any(CommentSubmission.class));
        assertThatThrownBy(() -> service.reserve(
            ticket.getMetadata().getName(), hash, owner, "/comments",
            mapper.readTree("{}"), List.of(upload)
        )).isInstanceOf(OptimisticLockingFailureException.class);
        assertThat(service.getSubmission(ticket.getMetadata().getName(), hash, owner)
            .getSpec().getState()).isEqualTo(CommentSubmission.State.FAILED);
        assertThat(service.getUpload(upload.getMetadata().getName()).getSpec().getState())
            .isEqualTo(CommentUpload.State.TEMPORARY);
    }

    private boolean matches(Extension e, ListOptions options) {
        if (!matchesLabels(e, options)) {
            return false;
        }
        if (
            options.getFieldSelector() != null &&
            options.getFieldSelector().toString().contains("credentialHash")
        ) {
            String value =
                e instanceof CommentUpload u
                    ? u.getSpec().getCredentialHash()
                    : ((CommentSubmission) e).getSpec().getCredentialHash();
            return options.getFieldSelector().toString().contains(value);
        }
        return true;
    }

    Extension copy(Extension e) {
        return (Extension) mapper.convertValue(e, e.getClass());
    }

    String key(Extension e) {
        return e.getClass().getName() + e.getMetadata().getName();
    }

    void save(Extension e) {
        records.put(key(e), copy(e));
    }

    CommentUpload uploaded() {
        var u = service.begin(hash, owner);
        var a = new Attachment();
        var m = new Metadata();
        m.setName("attachment-" + u.getMetadata().getName());
        m.setLabels(Map.of(CommentUpload.LABEL, u.getMetadata().getName()));
        a.setMetadata(m);
        save(a);
        service.uploaded(u.getMetadata().getName(), a, "https://example.com/a.png");
        return service.getUpload(u.getMetadata().getName());
    }

    CommentSubmission reserve(CommentUpload u) throws Exception {
        return service.reserve(
            service.issue(hash, owner).getMetadata().getName(),
            hash,
            owner,
            "/comments",
            mapper.readTree("{\"content\":\"<img src='https://example.com/a.png'>\"}"),
            List.of(u)
        );
    }

    Comment comment(String name) {
        var c = new Comment();
        var m = new Metadata();
        m.setName(name);
        c.setMetadata(m);
        var s = new Comment.CommentSpec();
        s.setApproved(false);
        s.setContent("<img src='https://example.com/a.png'>");
        c.setSpec(s);
        save(c);
        service.indexReferences("Comment", name);
        return c;
    }

    @Test
    void rejectedUploadsReleaseTheirDraftQuota() {
        for (int i = 0; i < 25; i++) {
            var upload = service.begin(hash, owner);
            service.discardRejectedUpload(upload.getMetadata().getName());
            assertThat(client.fetch(CommentUpload.class, upload.getMetadata().getName())).isEmpty();
        }
        assertThat(service.begin(hash, owner)).isNotNull();
    }

    @Test
    void rejectionCleanupKeepsAnyCreatedAttachmentAnchor() {
        var upload = service.begin(hash, owner);
        var attachment = new Attachment();
        var metadata = new Metadata();
        metadata.setName("already-created");
        metadata.setLabels(Map.of(CommentUpload.LABEL, upload.getMetadata().getName()));
        attachment.setMetadata(metadata);
        save(attachment);
        service.discardRejectedUpload(upload.getMetadata().getName());
        assertThat(client.fetch(CommentUpload.class, upload.getMetadata().getName())).isPresent();
    }

    @Test
    void bindingRetriesAnOptimisticConflictWithoutDuplicatingTheComment() throws Exception {
        var u = uploaded();
        var submission = reserve(u);
        comment("comment");
        var conflict = new AtomicBoolean(true);
        doAnswer(call -> {
            Extension e = call.getArgument(0);
            if (
                e instanceof CommentUpload upload &&
                upload.getSpec().getState() == CommentUpload.State.BOUND &&
                conflict.getAndSet(false)
            ) {
                throw new OptimisticLockingFailureException("race");
            }
            save(e);
            return null;
        })
            .when(client)
            .update(any());
        service.bind(submission.getMetadata().getName(), "Comment", "comment");
        service.bind(submission.getMetadata().getName(), "Comment", "comment");
        assertThat(
            service
                .getSubmission(submission.getMetadata().getName(), hash, owner)
                .getSpec()
                .getState()
        ).isEqualTo(CommentSubmission.State.BOUND);
        assertThatThrownBy(() ->
            service.bind(submission.getMetadata().getName(), "Comment", "other")
        ).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void foregroundAndRecoveryCanBindTheSameSubmissionConcurrently() throws Exception {
        var u = uploaded();
        var submission = reserve(u);
        comment("comment");
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() ->
                service.bind(submission.getMetadata().getName(), "Comment", "comment")
            );
            var second = executor.submit(() ->
                service.bind(submission.getMetadata().getName(), "Comment", "comment")
            );
            first.get(5, TimeUnit.SECONDS);
            second.get(5, TimeUnit.SECONDS);
        }
        assertThat(
            service
                .getSubmission(submission.getMetadata().getName(), hash, owner)
                .getSpec()
                .getState()
        ).isEqualTo(CommentSubmission.State.BOUND);
    }

    @Test
    void expiredKnownAttachmentWithoutPermalinkIsCollected() {
        var u = service.begin(hash, owner);
        var a = new Attachment();
        var m = new Metadata();
        m.setName("no-link");
        m.setLabels(Map.of(CommentUpload.LABEL, u.getMetadata().getName()));
        a.setMetadata(m);
        save(a);
        service.attached(u.getMetadata().getName(), a);
        u = service.getUpload(u.getMetadata().getName());
        u.getSpec().setExpiresAt(Instant.now().minusSeconds(1));
        save(u);
        var reconciler = new UploadReconciler(client, service);
        reconciler.reconcile(new Reconciler.Request(u.getMetadata().getName()));
        reconciler.reconcile(new Reconciler.Request(u.getMetadata().getName()));
        assertThat(client.fetch(Attachment.class, "no-link")).isEmpty();
    }

    @Test
    void rejectsForeignDraft() throws Exception {
        var u = uploaded();
        var ticket = service.issue(hash, owner);
        assertThatThrownBy(() ->
            service.reserve(
                ticket.getMetadata().getName(),
                UploadIdentity.credential("b".repeat(64)),
                owner,
                "/comments",
                mapper.readTree("{}"),
                List.of(u)
            )
        ).isInstanceOf(ResponseStatusException.class);
        assertThat(service.getUpload(u.getMetadata().getName()).getSpec().getState()).isEqualTo(
            CommentUpload.State.TEMPORARY
        );
    }

    @Test
    void rejectsDifferentAuthenticatedOwner() {
        assertThatThrownBy(() ->
            UploadIdentity.authorize(hash, "other-user", hash, "user")
        ).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void failedSubmissionReleasesForRetry() throws Exception {
        var u = uploaded();
        var s = reserve(u);
        service.fail(s.getMetadata().getName());
        assertThat(service.getUpload(u.getMetadata().getName()).getSpec().getState()).isEqualTo(
            CommentUpload.State.TEMPORARY
        );
        assertThat(reserve(service.getUpload(u.getMetadata().getName()))).isNotNull();
    }

    @Test
    void unknownSubmissionStaysReservedAndCannotBeReplayed() throws Exception {
        var u = uploaded();
        var s = reserve(u);
        service.unknown(s.getMetadata().getName());
        assertThat(service.getUpload(u.getMetadata().getName()).getSpec().getState()).isEqualTo(
            CommentUpload.State.RESERVED
        );
        assertThatThrownBy(() ->
            reserve(service.getUpload(u.getMetadata().getName()))
        ).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void pendingReviewBindsAndSurvivesCollection() throws Exception {
        var u = uploaded();
        var s = reserve(u);
        comment("comment");
        service.bind(s.getMetadata().getName(), "Comment", "comment");
        new UploadReconciler(client, service).reconcile(
            new Reconciler.Request(u.getMetadata().getName())
        );
        assertThat(client.fetch(CommentUpload.class, u.getMetadata().getName())).isEmpty();
        assertThat(service.reconcileAttachment(u.getSpec().getAttachmentName())).isEmpty();
        assertThat(client.fetch(Attachment.class, u.getSpec().getAttachmentName())).isPresent();
        verify(client, never()).delete(any(Attachment.class));
    }

    @Test
    void bindingCanRecoverAfterPartialCompletion() throws Exception {
        var u = uploaded();
        var s = reserve(u);
        comment("comment");
        service.bind(s.getMetadata().getName(), "Comment", "comment");
        service.bind(s.getMetadata().getName(), "Comment", "comment");
        assertThat(
            service.getSubmission(s.getMetadata().getName(), hash, owner).getSpec().getState()
        ).isEqualTo(CommentSubmission.State.BOUND);
    }

    @Test
    void normalAttachmentCannotBeDeletedWithForgedMarker() {
        var u = uploaded();
        var s = u.getSpec();
        s.setState(CommentUpload.State.GC_PENDING);
        s.setDeleteAfter(Instant.now().minusSeconds(1));
        save(u);
        var a = client.fetch(Attachment.class, s.getAttachmentName()).orElseThrow();
        a.getMetadata().setLabels(Map.of());
        save(a);
        new UploadReconciler(client, service).reconcile(
            new Reconciler.Request(u.getMetadata().getName())
        );
        verify(client, never()).delete(any());
    }

    @Test
    void retainedImageSurvivesExpiry() {
        var u = uploaded();
        u.getSpec().setExpiresAt(Instant.now().minus(Duration.ofDays(2)));
        save(u);
        service.retain(u.getMetadata().getName());
        new UploadReconciler(client, service).reconcile(
            new Reconciler.Request(u.getMetadata().getName())
        );
        verify(client, never()).delete(any(Attachment.class));
    }

    @Test
    void deletionRequiresGracePeriodAndFinalizerCompletion() throws Exception {
        var u = uploaded();
        var s = reserve(u);
        var c = comment("comment");
        service.bind(s.getMetadata().getName(), "Comment", "comment");
        new UploadReconciler(client, service).reconcile(
            new Reconciler.Request(u.getMetadata().getName())
        );
        records.remove(key(c));
        String attachment = u.getSpec().getAttachmentName();
        assertThat(service.reconcileAttachment(attachment)).contains(
            UploadLifecycleService.DELETE_DELAY
        );
        verify(client, never()).delete(any(Attachment.class));
        service.updateAttachment(attachment, a ->
            MetadataUtil.nullSafeAnnotations(a).put(
                UploadMetadata.DELETE_AFTER,
                Instant.now().minusSeconds(1).toString()
            )
        );
        service.reconcileAttachment(attachment);
        assertThat(client.fetch(Attachment.class, attachment)).isEmpty();
        assertThat(client.fetch(CommentUpload.class, u.getMetadata().getName())).isEmpty();
    }

    @Test
    void failedStorageDeletionRemainsRetryable() {
        var u = uploaded();
        u.getSpec().setState(CommentUpload.State.GC_PENDING);
        u.getSpec().setDeleteAfter(Instant.now().minusSeconds(1));
        save(u);
        doThrow(new IllegalStateException("storage unavailable")).when(client).delete(any());
        var reconciler = new UploadReconciler(client, service);
        reconciler.reconcile(new Reconciler.Request(u.getMetadata().getName()));
        var failed = service.getUpload(u.getMetadata().getName());
        assertThat(failed.getSpec().getState()).isEqualTo(CommentUpload.State.DELETING);
        assertThat(failed.getSpec().getAttempts()).isEqualTo(1);
        assertThat(
            client.fetch(Attachment.class, failed.getSpec().getAttachmentName())
        ).isPresent();
        assertThatThrownBy(() -> service.retain(u.getMetadata().getName())).isInstanceOf(
            ResponseStatusException.class
        );
    }

    @Test
    void expiredUploadsWithoutAttachmentsReleaseTheirQuota() {
        for (int i = 0; i < 20; i++) {
            var upload = service.begin(hash, owner);
            upload.getSpec().setExpiresAt(Instant.now().minus(Duration.ofDays(7)));
            save(upload);
            new UploadReconciler(client, service).reconcile(
                new Reconciler.Request(upload.getMetadata().getName())
            );
            assertThat(client.fetch(CommentUpload.class, upload.getMetadata().getName())).isEmpty();
        }
        assertThatCode(() -> service.begin(hash, owner)).doesNotThrowAnyException();
        verify(client, never()).delete(any(Attachment.class));
    }

    @Test
    void recoveryDoesNotRaceAnActiveUpload() {
        var u = service.begin(hash, owner);
        new UploadReconciler(client, service).reconcile(
            new Reconciler.Request(u.getMetadata().getName())
        );
        assertThat(service.getUpload(u.getMetadata().getName()).getSpec().getState()).isEqualTo(
            CommentUpload.State.UPLOADING
        );
        verify(client, never()).list(eq(Attachment.class), any(), any());
    }

    @Test
    void otherCommentReferencePreventsDeletion() {
        var u = uploaded();
        u.getSpec().setState(CommentUpload.State.GC_PENDING);
        u.getSpec().setDeleteAfter(Instant.now().minusSeconds(1));
        save(u);
        comment("other");
        new UploadReconciler(client, service).reconcile(
            new Reconciler.Request(u.getMetadata().getName())
        );
        verify(client, never()).delete(any());
    }

    @Test
    void expiredAndPurgedTicketCannotBeRecreated() throws Exception {
        var u = uploaded();
        var ticket = service.issue(hash, owner);
        ticket.getSpec().setExpiresAt(Instant.now().minus(Duration.ofHours(2)));
        save(ticket);
        assertThatThrownBy(() ->
            service.available(ticket.getMetadata().getName(), hash, owner)
        ).isInstanceOf(ResponseStatusException.class);
        new SubmissionReconciler(client, service).reconcile(
            new Reconciler.Request(ticket.getMetadata().getName())
        );
        assertThat(client.fetch(CommentSubmission.class, ticket.getMetadata().getName())).isEmpty();
        assertThatThrownBy(() ->
            service.reserve(
                ticket.getMetadata().getName(),
                hash,
                owner,
                "/comments",
                mapper.readTree("{}"),
                List.of(u)
            )
        ).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void unknownTicketSurvivesExpiryWithoutPolling() throws Exception {
        var u = uploaded();
        var ticket = reserve(u);
        service.unknown(ticket.getMetadata().getName());
        ticket = service.getSubmission(ticket.getMetadata().getName(), hash, owner);
        ticket.getSpec().setExpiresAt(Instant.now().minus(Duration.ofDays(2)));
        save(ticket);
        var result = new SubmissionReconciler(client, service).reconcile(
            new Reconciler.Request(ticket.getMetadata().getName())
        );
        assertThat(result).isEqualTo(Reconciler.Result.doNotRetry());
        assertThat(
            client.fetch(CommentSubmission.class, ticket.getMetadata().getName())
        ).isPresent();
    }

    @Test
    void compactionFailurePreservesUploadRecoveryRecord() throws Exception {
        var u = uploaded();
        var ticket = reserve(u);
        comment("comment");
        service.bind(ticket.getMetadata().getName(), "Comment", "comment");
        doThrow(new IllegalStateException("write failed"))
            .when(client)
            .update(any(Attachment.class));
        new UploadReconciler(client, service).reconcile(
            new Reconciler.Request(u.getMetadata().getName())
        );
        assertThat(client.fetch(CommentUpload.class, u.getMetadata().getName())).isPresent();
    }

    @Test
    void incompleteReferenceIndexBlocksCleanup() {
        var u = uploaded();
        u.getSpec().setState(CommentUpload.State.GC_PENDING);
        u.getSpec().setDeleteAfter(Instant.now().minusSeconds(1));
        save(u);
        service.setReferenceIndexReady(false);
        new UploadReconciler(client, service).reconcile(
            new Reconciler.Request(u.getMetadata().getName())
        );
        verify(client, never()).delete(any(Attachment.class));
    }

    @Test
    void completedTicketIsPurgedAfterCompactionAndRetryWindow() throws Exception {
        var u = uploaded();
        var ticket = reserve(u);
        comment("comment");
        service.bind(ticket.getMetadata().getName(), "Comment", "comment");
        new UploadReconciler(client, service).reconcile(
            new Reconciler.Request(u.getMetadata().getName())
        );
        ticket = service.getSubmission(ticket.getMetadata().getName(), hash, owner);
        ticket.getSpec().setExpiresAt(Instant.now().minus(Duration.ofHours(2)));
        save(ticket);
        new SubmissionReconciler(client, service).reconcile(
            new Reconciler.Request(ticket.getMetadata().getName())
        );
        assertThat(client.fetch(CommentSubmission.class, ticket.getMetadata().getName())).isEmpty();
        assertThat(client.fetch(Attachment.class, u.getSpec().getAttachmentName())).isPresent();
    }

    @Test
    void compactedAttachmentHonorsOtherReferencesAndTheirRemoval() throws Exception {
        var u = uploaded();
        var ticket = reserve(u);
        var original = comment("original");
        service.bind(ticket.getMetadata().getName(), "Comment", "original");
        new UploadReconciler(client, service).reconcile(
            new Reconciler.Request(u.getMetadata().getName())
        );
        var other = comment("other");
        records.remove(key(original));
        String name = u.getSpec().getAttachmentName();
        service.reconcileAttachment(name);
        service.updateAttachment(name, a ->
            MetadataUtil.nullSafeAnnotations(a).put(
                UploadMetadata.DELETE_AFTER,
                Instant.now().minusSeconds(1).toString()
            )
        );
        service.reconcileAttachment(name);
        assertThat(client.fetch(Attachment.class, name)).isPresent();
        other.getSpec().setContent("text only");
        save(other);
        service.indexReferences("Comment", "other");
        service.reconcileAttachment(name);
        assertThat(client.fetch(Attachment.class, name)).isEmpty();
    }

    @Test
    void submissionCompletionCompactsWhenEarlierUploadEventCouldNot() throws Exception {
        var u = uploaded();
        var ticket = reserve(u);
        comment("comment");
        service.bind(ticket.getMetadata().getName(), "Comment", "comment");
        ticket = service.getSubmission(ticket.getMetadata().getName(), hash, owner);
        ticket.getSpec().setState(CommentSubmission.State.PROCESSING);
        save(ticket);
        new UploadReconciler(client, service).reconcile(
            new Reconciler.Request(u.getMetadata().getName())
        );
        assertThat(client.fetch(CommentUpload.class, u.getMetadata().getName())).isPresent();
        ticket.getSpec().setState(CommentSubmission.State.BOUND);
        save(ticket);
        new SubmissionReconciler(client, service).reconcile(
            new Reconciler.Request(ticket.getMetadata().getName())
        );
        assertThat(client.fetch(CommentUpload.class, u.getMetadata().getName())).isEmpty();
        assertThat(client.fetch(Attachment.class, u.getSpec().getAttachmentName())).isPresent();
    }

    @Test
    void canonicalReferencesIgnoreFragmentsAndQuery() {
        assertThat(
            UploadReferences.images("<img src='https://EXAMPLE.com/a.png?x=1#fragment'>")
        ).containsExactlyInAnyOrder("example.com/a.png", "/a.png");
    }

    private boolean matchesLabels(Extension resource, ListOptions options) {
        if (options.getLabelSelector() == null) {
            return true;
        }
        for (var condition : options.getLabelSelector().getConditions()) {
            String value = UploadMetadata.label(resource, condition.labelKey());
            if (value == null) {
                return false;
            }
            if (
                !condition
                    .toString()
                    .equals(Queries.labelEqual(condition.labelKey(), value).toString())
            ) {
                return false;
            }
        }
        return true;
    }
}
