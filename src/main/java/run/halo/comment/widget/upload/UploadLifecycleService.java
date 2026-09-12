package run.halo.comment.widget.upload;

import static run.halo.app.extension.index.query.Queries.equal;
import static run.halo.comment.widget.upload.CommentUpload.State.*;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.IntStream;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import run.halo.app.core.extension.attachment.Attachment;
import run.halo.app.extension.Extension;
import run.halo.app.extension.ExtensionClient;
import run.halo.app.extension.ListOptions;
import run.halo.app.extension.ListResult;
import run.halo.app.extension.Metadata;
import run.halo.app.extension.PageRequestImpl;
import run.halo.app.extension.index.query.Queries;

/** Blocking persistence operations: callers must run on a worker, never the event loop. */
@Service
public class UploadLifecycleService {

    private final ExtensionClient client;
    // Fixed stripes serialize foreground binding and recovery for the same ticket without a growing lock map.
    private final Object[] bindingLocks = IntStream.range(0, 64)
        .mapToObj(i -> new Object())
        .toArray();
    private final UploadReferenceIndex references;
    private final UploadAttachmentService attachments;

    public UploadLifecycleService(ExtensionClient client) {
        this.client = client;
        this.references = new UploadReferenceIndex(client);
        this.attachments = new UploadAttachmentService(client, references);
    }

    boolean isReferenceIndexReady() {
        return references.ready;
    }

    void setReferenceIndexReady(boolean ready) {
        references.ready = ready;
    }

    public static final Duration TEMP_TTL = Duration.ofHours(24);
    public static final Duration SUBMISSION_TTL = Duration.ofHours(24);
    public static final Duration DELETE_DELAY = Duration.ofHours(1);

    public synchronized CommentUpload begin(String hash, String owner) {
        long count = byCredential(CommentUpload.class, hash).getTotal();
        if (count >= 20) {
            throw error(HttpStatus.TOO_MANY_REQUESTS, "Draft upload limit reached");
        }
        var upload = new CommentUpload();
        var metadata = new Metadata();
        metadata.setName(UUID.randomUUID().toString());
        upload.setMetadata(metadata);
        var spec = new CommentUpload.Spec();
        spec.setCredentialHash(hash);
        spec.setOwner(owner);
        spec.setState(UPLOADING);
        spec.setExpiresAt(Instant.now().plus(TEMP_TTL));
        upload.setSpec(spec);
        client.create(upload);
        return upload;
    }

    /** Only called for a storage policy rejection before an attachment was created. */
    public void discardRejectedUpload(String id) {
        UploadRetries.run(5, () -> discardRejectedUploadOnce(id));
    }

    private void discardRejectedUploadOnce(String id) {
        var found = client.fetch(CommentUpload.class, id);
        if (found.isEmpty()) {
            return;
        }
        var upload = found.get();
        if (upload.getSpec().getState() != UPLOADING) {
            return;
        }
        if (upload.getSpec().getAttachmentName() != null) {
            return;
        }
        var attachments = client.listBy(
            Attachment.class,
            UploadMetadata.matching(CommentUpload.LABEL, id),
            PageRequestImpl.ofSize(1)
        );
        if (attachments.getTotal() > 0) {
            return;
        }
        client.delete(upload);
    }

    private <E extends Extension> ListResult<E> byCredential(Class<E> type, String hash) {
        return client.listBy(
            type,
            ListOptions.builder().andQuery(equal("credentialHash", hash)).build(),
            PageRequestImpl.ofSize(20)
        );
    }

    public synchronized CommentSubmission issue(String hash, String owner) {
        var uploads = byCredential(CommentUpload.class, hash).getItems();
        if (uploads.stream().noneMatch(u -> eligibleDraft(u, owner))) {
            throw error(HttpStatus.CONFLICT, "No eligible draft images");
        }
        if (byCredential(CommentSubmission.class, hash).getTotal() >= 20) {
            throw error(HttpStatus.TOO_MANY_REQUESTS, "Draft submission limit reached");
        }
        var submission = new CommentSubmission();
        var metadata = new Metadata();
        metadata.setName(UUID.randomUUID().toString());
        submission.setMetadata(metadata);
        var spec = new CommentSubmission.Spec();
        spec.setCredentialHash(hash);
        spec.setOwner(owner);
        spec.setState(CommentSubmission.State.ISSUED);
        spec.setUploadIds(List.of());
        spec.setStartedAt(Instant.now());
        spec.setExpiresAt(Instant.now().plus(SUBMISSION_TTL));
        submission.setSpec(spec);
        client.create(submission);
        return submission;
    }

    public CommentSubmission available(String id, String hash, String owner) {
        var submission = getSubmission(id, hash, owner);
        if (submission.getMetadata().getDeletionTimestamp() != null) {
            throw error(HttpStatus.GONE, "Submission expired; do not replay this request");
        }
        if (submission.getSpec().getExpiresAt() == null) {
            throw error(HttpStatus.GONE, "Submission expired; do not replay this request");
        }
        if (!submission.getSpec().getExpiresAt().isAfter(Instant.now())) {
            throw error(HttpStatus.GONE, "Submission expired; do not replay this request");
        }
        if (submission.getSpec().getState() != CommentSubmission.State.ISSUED) {
            throw error(
                HttpStatus.CONFLICT,
                "Submission already recorded; check submission status"
            );
        }
        return submission;
    }

    /** Persist the storage identity even when permalink generation subsequently fails. */
    public void attached(String id, Attachment attachment) {
        attachments.attached(id, attachment);
    }

    public void uploaded(String id, Attachment attachment, String url) {
        attachments.uploaded(id, attachment, url);
    }

    public CommentUpload getUpload(String id) {
        return client
            .fetch(CommentUpload.class, id)
            .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Upload not found"));
    }

    public CommentSubmission getSubmission(String id, String hash, String owner) {
        var submission = client
            .fetch(CommentSubmission.class, id)
            .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Submission not found"));
        UploadIdentity.authorize(
            hash,
            owner,
            submission.getSpec().getCredentialHash(),
            submission.getSpec().getOwner()
        );
        return submission;
    }

    /** Fence an unused ticket against a concurrent request before discarding its client state. */
    public void cancelIssued(String id, String hash, String owner) {
        var submission = getSubmission(id, hash, owner);
        if (submission.getMetadata().getDeletionTimestamp() != null
            || submission.getSpec().getState() != CommentSubmission.State.ISSUED) {
            throw error(HttpStatus.CONFLICT, "Submission already recorded; check submission status");
        }
        submission.getSpec().setState(CommentSubmission.State.FAILED);
        client.update(submission); // The same version check fences reserve() before forwarding.
    }

    public List<CommentUpload> referenced(String content) {
        var images = UploadReferences.images(content);
        if (images.isEmpty()) {
            return List.of();
        }
        return client
            .listAll(
                CommentUpload.class,
                ListOptions.builder().andQuery(Queries.in("uploadUrl", images)).build(),
                Sort.unsorted()
            )
            .stream()
            .filter(u -> !u.getSpec().isRetained())
            .toList();
    }

    public CommentSubmission reserve(
        String id,
        String hash,
        String owner,
        String path,
        JsonNode body,
        List<CommentUpload> uploads
    ) {
        if (id == null) {
            throw error(HttpStatus.BAD_REQUEST, "Invalid submission ID");
        }
        if (!id.matches("[a-f0-9-]{36}")) {
            throw error(HttpStatus.BAD_REQUEST, "Invalid submission ID");
        }
        var submission = available(id, hash, owner);
        var requestHash = UploadIdentity.hash(path + "\n" + body.toString());
        for (var upload : uploads) {
            var spec = upload.getSpec();
            UploadIdentity.authorize(hash, owner, spec.getCredentialHash(), spec.getOwner());
            if (spec.getState() != TEMPORARY) {
                throw error(HttpStatus.CONFLICT, "Image is unavailable or already submitted");
            }
            if (!spec.getExpiresAt().isAfter(Instant.now())) {
                throw error(HttpStatus.CONFLICT, "Image is unavailable or already submitted");
            }
        }
        var spec = submission.getSpec();
        spec.setRequestHash(requestHash);
        spec.setUploadIds(
            uploads
                .stream()
                .map(u -> u.getMetadata().getName())
                .toList()
        );
        spec.setState(CommentSubmission.State.PREPARING);
        spec.setStartedAt(Instant.now());
        client.update(submission); // CAS: only one request can claim the issued ticket.
        try {
            for (var upload : uploads) {
                upload.getSpec().setState(RESERVED);
                upload.getSpec().setSubmissionId(id);
                client.update(upload); // version check arbitrates against the collector
            }
            var prepared = client.fetch(CommentSubmission.class, id).orElseThrow();
            prepared.getSpec().setState(CommentSubmission.State.PROCESSING);
            client.update(prepared);
            return prepared;
        } catch (RuntimeException e) {
            fail(id);
            throw e;
        }
    }

    public void fail(String id) {
        var submission = client.fetch(CommentSubmission.class, id).orElseThrow();
        if (submission.getSpec().getTargetName() != null) {
            return;
        }
        submission.getSpec().setState(CommentSubmission.State.FAILED);
        client.update(submission);
        for (var uploadId : submission.getSpec().getUploadIds()) {
            release(uploadId, id);
        }
    }

    public void release(String uploadId, String id) {
        var upload = getUpload(uploadId);
        if (
            upload.getSpec().getState() == RESERVED && id.equals(upload.getSpec().getSubmissionId())
        ) {
            upload.getSpec().setState(TEMPORARY);
            upload.getSpec().setSubmissionId(null);
            client.update(upload);
        }
    }

    public void unknown(String id) {
        var submission = client.fetch(CommentSubmission.class, id).orElseThrow();
        if (
            submission.getSpec().getState() == CommentSubmission.State.PROCESSING ||
            submission.getSpec().getState() == CommentSubmission.State.PREPARING
        ) {
            submission.getSpec().setState(CommentSubmission.State.UNKNOWN);
            client.update(submission);
        }
    }

    public void bind(String id, String kind, String name) {
        synchronized (bindingLocks[Math.floorMod(id.hashCode(), bindingLocks.length)]) {
            UploadRetries.run(5, () -> bindOnce(id, kind, name));
        }
    }

    private void bindOnce(String id, String kind, String name) {
        var existing = client.fetch(CommentSubmission.class, id).orElseThrow();
        if (existing.getSpec().getState() == CommentSubmission.State.BOUND) {
            if (!kind.equals(existing.getSpec().getTargetKind())) {
                throw error(HttpStatus.CONFLICT, "Submission belongs to another target");
            }
            if (!name.equals(existing.getSpec().getTargetName())) {
                throw error(HttpStatus.CONFLICT, "Submission belongs to another target");
            }
            return;
        }
        String content = targetContent(kind, name).orElseThrow(() ->
            error(HttpStatus.CONFLICT, "Created comment is unavailable")
        );
        var submission = client.fetch(CommentSubmission.class, id).orElseThrow();
        // Persist the recovery anchor before changing any individual upload.
        submission.getSpec().setTargetKind(kind);
        submission.getSpec().setTargetName(name);
        client.update(submission);
        var references = UploadReferences.images(content);
        for (var uploadId : submission.getSpec().getUploadIds()) {
            bindUpload(uploadId, id, kind, name, references);
        }
        var completed = client.fetch(CommentSubmission.class, id).orElseThrow();
        completed.getSpec().setState(CommentSubmission.State.BOUND);
        client.update(completed);
    }

    public Optional<String> targetContent(String kind, String name) {
        return references.targetContent(kind, name);
    }

    public boolean referencedElsewhere(String url) {
        return references.referencedElsewhere(url);
    }

    public void rejectBoundImages(String content) {
        references.rejectBoundImages(content);
    }

    public void updateAttachment(String name, Consumer<Attachment> change) {
        attachments.updateAttachment(name, change);
    }

    /** Write and verify the durable association before discarding the transaction record. */
    public void compact(CommentUpload upload) {
        attachments.compact(upload);
    }

    public void targetChanged(String kind, String name) {
        indexReferences(kind, name);
        if (targetContent(kind, name).isPresent()) {
            return;
        }
        var options = UploadMetadata.matching(
            UploadMetadata.TARGET_KEY,
            UploadMetadata.key(kind + "/" + name)
        );
        for (var attachment : client
            .listBy(Attachment.class, options, PageRequestImpl.ofSize(100))
            .getItems()) {
            reconcileAttachment(attachment.getMetadata().getName());
        }
    }

    public void indexReferences(String kind, String name) {
        references.indexReferences(kind, name);
    }

    /** Returns the next check only for pending deletion; healthy attachments have no timer. */
    public Optional<Duration> reconcileAttachment(String name) {
        return attachments.reconcileAttachment(name);
    }

    public void retain(String id) {
        var upload = getUpload(id);
        if (upload.getSpec().getState() == DELETING) {
            throw error(HttpStatus.CONFLICT, "Attachment deletion already started");
        }
        if (upload.getSpec().getState() == DELETED) {
            throw error(HttpStatus.CONFLICT, "Attachment deletion already started");
        }
        upload.getSpec().setRetained(true);
        client.update(upload);
    }

    static ResponseStatusException error(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }

    private void bindUpload(
        String uploadId,
        String id,
        String kind,
        String name,
        Set<String> references
    ) {
        var found = client.fetch(CommentUpload.class, uploadId);
        if (found.isEmpty()) {
            var attachments = client
                .listBy(
                    Attachment.class,
                    UploadMetadata.matching(CommentUpload.LABEL, uploadId),
                    PageRequestImpl.ofSize(2)
                )
                .getItems();
            if (hasMatchingAnchor(attachments, kind, name)) {
                return;
            }
            throw error(HttpStatus.CONFLICT, "Upload recovery anchor missing");
        }
        var upload = found.get();
        if (!id.equals(upload.getSpec().getSubmissionId())) {
            throw error(HttpStatus.CONFLICT, "Upload reservation changed");
        }
        if (!references.contains(UploadReferences.canonical(upload.getSpec().getUrl()))) {
            // A transformed response must never cause immediate cleanup.
            throw error(HttpStatus.CONFLICT, "Created content does not match uploaded images");
        }
        if (isBoundTo(upload, kind, name)) {
            return;
        }
        upload.getSpec().setTargetKind(kind);
        upload.getSpec().setTargetName(name);
        upload.getSpec().setState(BOUND);
        client.update(upload);
    }

    private boolean eligibleDraft(CommentUpload upload, String owner) {
        var spec = upload.getSpec();
        if (!owner.equals(spec.getOwner())) {
            return false;
        }
        if (spec.getState() != TEMPORARY) {
            return false;
        }
        return spec.getExpiresAt().isAfter(Instant.now());
    }

    private boolean hasMatchingAnchor(List<Attachment> attachments, String kind, String name) {
        if (attachments.size() != 1) {
            return false;
        }
        var attachment = attachments.getFirst();
        if (!kind.equals(UploadMetadata.annotation(attachment, UploadMetadata.TARGET_KIND))) {
            return false;
        }
        return name.equals(UploadMetadata.annotation(attachment, UploadMetadata.TARGET_NAME));
    }

    private boolean isBoundTo(CommentUpload upload, String kind, String name) {
        var spec = upload.getSpec();
        if (spec.getState() != BOUND) {
            return false;
        }
        if (!kind.equals(spec.getTargetKind())) {
            return false;
        }
        return name.equals(spec.getTargetName());
    }
}
