package run.halo.comment.widget.upload;

import static run.halo.comment.widget.upload.CommentUpload.State.*;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import run.halo.app.core.extension.attachment.Attachment;
import run.halo.app.extension.ExtensionClient;
import run.halo.app.extension.PageRequestImpl;
import run.halo.app.extension.controller.Controller;
import run.halo.app.extension.controller.ControllerBuilder;
import run.halo.app.extension.controller.Reconciler;

@Component
@RequiredArgsConstructor
public class UploadReconciler implements Reconciler<Reconciler.Request> {

    private final ExtensionClient client;
    private final UploadLifecycleService lifecycle;

    @Override
    public Result reconcile(Request request) {
        var optional = client.fetch(CommentUpload.class, request.name());
        if (optional.isEmpty()) {
            return Result.doNotRetry();
        }
        var upload = optional.get();
        var spec = upload.getSpec();
        if (upload.getMetadata().getDeletionTimestamp() != null) {
            return Result.doNotRetry();
        }
        if (spec.getState() == DELETED) {
            client.delete(upload);
            return Result.doNotRetry();
        }
        try {
            process(upload);
            var remaining = client.fetch(CommentUpload.class, request.name());
            if (remaining.isEmpty()) {
                return Result.doNotRetry();
            }
            if (remaining.get().getMetadata().getDeletionTimestamp() != null) {
                return Result.doNotRetry();
            }
            var latest = remaining.get();
            if (hasUnknownSubmission(latest)) {
                return Result.doNotRetry();
            }
            if (latest.getSpec().getLastError() != null) {
                latest.getSpec().setLastError(null);
                latest.getSpec().setAttempts(0);
                client.update(latest);
            }
        } catch (RuntimeException error) {
            // Refetch to avoid overwriting a successful concurrent reservation/retain operation.
            var latest = lifecycle.getUpload(request.name());
            latest.getSpec().setAttempts(latest.getSpec().getAttempts() + 1);
            latest.getSpec().setLastError(error.getClass().getSimpleName());
            client.update(latest);
        }
        return new Result(true, Duration.ofMinutes(15));
    }

    private boolean hasUnknownSubmission(CommentUpload upload) {
        if (upload.getSpec().getState() != RESERVED) {
            return false;
        }
        var submission = client.fetch(CommentSubmission.class, upload.getSpec().getSubmissionId());
        if (submission.isEmpty()) {
            return false;
        }
        var spec = submission.get().getSpec();
        if (spec.getState() != CommentSubmission.State.UNKNOWN) {
            return false;
        }
        return spec.getTargetName() == null;
    }

    private void process(CommentUpload upload) {
        var spec = upload.getSpec();
        var now = Instant.now();
        if (spec.isRetained()) {
            lifecycle.compact(upload);
            return;
        }
        if (spec.getState() == UPLOADING) {
            processUploading(upload, now);
            return;
        }
        if (spec.getState() == RESERVED) {
            processReserved(upload, now);
            return;
        }
        if (spec.getState() == BOUND) {
            lifecycle.compact(upload);
            return;
        }
        if (spec.getState() == TEMPORARY && !spec.getExpiresAt().isAfter(now)) {
            spec.setState(GC_PENDING);
            spec.setDeleteAfter(now);
            client.update(upload);
            return;
        }
        if (!canDelete(spec, now)) {
            return;
        }
        var storedAttachment = client.fetch(Attachment.class, spec.getAttachmentName());
        if (storedAttachment.isEmpty()) {
            client.delete(upload);
            return;
        }
        if (!lifecycle.isReferenceIndexReady()) {
            return;
        }
        if (spec.getUrl() != null && lifecycle.referencedElsewhere(spec.getUrl())) {
            return;
        }
        var attachment = storedAttachment.get();
        if (hasReferencedPermalink(spec, attachment)) {
            return;
        }
        if (attachment.getMetadata().getLabels() == null) {
            throw new IllegalStateException("Attachment ownership marker mismatch");
        }
        if (
            !Objects.equals(
                upload.getMetadata().getName(),
                attachment.getMetadata().getLabels().get(CommentUpload.LABEL)
            )
        ) {
            throw new IllegalStateException("Attachment ownership marker mismatch");
        }
        if (spec.getState() != DELETING) {
            spec.setState(DELETING);
            client.update(upload); // CAS fences concurrent retain and reserve requests
        }
        if (attachment.getMetadata().getDeletionTimestamp() == null) {
            client.delete(attachment); // Halo's attachment finalizer removes the storage object
        }
    }

    private void processUploading(CommentUpload upload, Instant now) {
        var spec = upload.getSpec();

        // Let the active upload finish before attempting crash recovery.
        if (
            spec
                .getExpiresAt()
                .minus(UploadLifecycleService.TEMP_TTL)
                .plus(Duration.ofMinutes(10))
                .isAfter(now)
        ) {
            return;
        }
        // Recover the gap between Attachment creation and writing its name into our record.
        var matches = client
            .listBy(
                Attachment.class,
                UploadMetadata.matching(CommentUpload.LABEL, upload.getMetadata().getName()),
                PageRequestImpl.ofSize(2)
            )
            .getItems();
        if (matches.size() == 1) {
            var attachment = matches.getFirst();
            lifecycle.attached(upload.getMetadata().getName(), attachment);
            if (attachment.getStatus() != null && attachment.getStatus().getPermalink() != null) {
                lifecycle.uploaded(
                    upload.getMetadata().getName(),
                    attachment,
                    attachment.getStatus().getPermalink()
                );
            }
        }
        var latest = lifecycle.getUpload(upload.getMetadata().getName());
        if (matches.isEmpty() && latest.getSpec().getState() == UPLOADING
            && !latest.getSpec().isRetained() && latest.getSpec().getAttachmentName() == null
            && !latest.getSpec().getExpiresAt().isAfter(now)) {
            client.delete(latest);
            return;
        }
        if (isExpiredAttachedUpload(latest, now)) {
            latest.getSpec().setState(GC_PENDING);
            latest.getSpec().setDeleteAfter(now);
            client.update(latest);
        }
    }

    private void processReserved(CommentUpload upload, Instant now) {
        var spec = upload.getSpec();
        var submission = client
            .fetch(CommentSubmission.class, spec.getSubmissionId())
            .orElseThrow();
        var submissionSpec = submission.getSpec();
        if (submissionSpec.getState() == CommentSubmission.State.FAILED) {
            lifecycle.release(upload.getMetadata().getName(), spec.getSubmissionId());
            return;
        }
        if (submissionSpec.getTargetName() != null) {
            recoverTarget(upload, submission);
            return;
        }
        if (!submissionSpec.getStartedAt().plus(Duration.ofMinutes(10)).isBefore(now)) {
            return;
        }
        markInterruptedSubmission(spec.getSubmissionId(), submissionSpec.getState());
    }

    private void markInterruptedSubmission(String id, CommentSubmission.State state) {
        if (state == CommentSubmission.State.PROCESSING) {
            lifecycle.unknown(id);
            return;
        }
        if (state == CommentSubmission.State.PREPARING) {
            lifecycle.unknown(id);
        }
    }

    private void recoverTarget(CommentUpload upload, CommentSubmission submission) {
        var spec = upload.getSpec();
        var target = submission.getSpec();
        if (lifecycle.targetContent(target.getTargetKind(), target.getTargetName()).isPresent()) {
            lifecycle.bind(spec.getSubmissionId(), target.getTargetKind(), target.getTargetName());
            return;
        }
        // Preserve the deletion anchor when the target disappeared before binding completed.
        spec.setTargetKind(target.getTargetKind());
        spec.setTargetName(target.getTargetName());
        spec.setState(BOUND);
        client.update(upload);
        if (target.getUploadIds().stream().allMatch(this::isBoundUpload)) {
            target.setState(CommentSubmission.State.BOUND);
            client.update(submission);
        }
    }

    private boolean isBoundUpload(String id) {
        return client
            .fetch(CommentUpload.class, id)
            .map(upload -> upload.getSpec().getState() == BOUND)
            .orElse(false);
    }

    @Override
    public Controller setupWith(ControllerBuilder builder) {
        return builder.extension(new CommentUpload()).syncAllOnStart(true).build();
    }

    private boolean canDelete(CommentUpload.Spec spec, Instant now) {
        if (spec.getState() == DELETING) {
            return true;
        }
        if (spec.getState() != GC_PENDING) {
            return false;
        }
        return !spec.getDeleteAfter().isAfter(now);
    }

    private boolean hasReferencedPermalink(CommentUpload.Spec spec, Attachment attachment) {
        if (spec.getUrl() != null) {
            return false;
        }
        if (attachment.getStatus() == null) {
            return false;
        }
        String permalink = attachment.getStatus().getPermalink();
        if (permalink == null) {
            return false;
        }
        return lifecycle.referencedElsewhere(permalink);
    }

    private boolean isExpiredAttachedUpload(CommentUpload upload, Instant now) {
        var spec = upload.getSpec();
        if (spec.getState() != UPLOADING) {
            return false;
        }
        if (spec.getExpiresAt().isAfter(now)) {
            return false;
        }
        return spec.getAttachmentName() != null;
    }
}
