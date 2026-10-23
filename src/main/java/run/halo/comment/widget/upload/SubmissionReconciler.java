package run.halo.comment.widget.upload;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import run.halo.app.extension.ExtensionClient;
import run.halo.app.extension.controller.Controller;
import run.halo.app.extension.controller.ControllerBuilder;
import run.halo.app.extension.controller.Reconciler;

@Component
@RequiredArgsConstructor
public class SubmissionReconciler implements Reconciler<Reconciler.Request> {

    private final ExtensionClient client;
    private final UploadLifecycleService lifecycle;

    @Override
    public Result reconcile(Request request) {
        var found = client.fetch(CommentSubmission.class, request.name());
        if (found.isEmpty()) {
            return Result.doNotRetry();
        }
        if (found.get().getMetadata().getDeletionTimestamp() != null) {
            return Result.doNotRetry();
        }
        var submission = found.get();
        var spec = submission.getSpec();
        if (spec.getState() == CommentSubmission.State.BOUND) {
            // Upload events may run before the final submission state commits. This
            // second trigger closes that race without waiting for an upload timer.
            compactUploads(spec.getUploadIds());
        }
        var expiry = expiresAt(spec);
        var delay = Duration.between(Instant.now(), expiry.plus(Duration.ofHours(1)));
        if (!delay.isNegative() && !delay.isZero()) {
            return new Result(true, delay);
        }
        if (
            spec.getState() == CommentSubmission.State.ISSUED ||
            spec.getState() == CommentSubmission.State.BOUND ||
            spec.getState() == CommentSubmission.State.FAILED
        ) {
            // Never remove the recovery anchor while an upload still depends on it.
            if (hasDependentUploads(spec.getUploadIds())) {
                return new Result(true, Duration.ofMinutes(15));
            }
            client.delete(submission);
            return Result.doNotRetry();
        }
        // Ambiguous submissions are retained, without a per-record polling timer.
        return Result.doNotRetry();
    }

    @Override
    public Controller setupWith(ControllerBuilder builder) {
        return builder.extension(new CommentSubmission()).syncAllOnStart(true).build();
    }

    private void compactUploads(List<String> ids) {
        for (var id : ids) {
            client
                .fetch(CommentUpload.class, id)
                .filter(this::canCompact)
                .ifPresent(lifecycle::compact);
        }
    }

    private boolean canCompact(CommentUpload upload) {
        if (upload.getMetadata().getDeletionTimestamp() != null) {
            return false;
        }
        return upload.getSpec().getState() == CommentUpload.State.BOUND;
    }

    private boolean hasDependentUploads(List<String> ids) {
        return ids.stream().anyMatch(this::isDependentUpload);
    }

    private boolean isDependentUpload(String id) {
        return client
            .fetch(CommentUpload.class, id)
            .filter(upload -> dependsOnSubmission(upload.getSpec().getState()))
            .isPresent();
    }

    private boolean dependsOnSubmission(CommentUpload.State state) {
        if (state == CommentUpload.State.RESERVED) {
            return true;
        }
        return state == CommentUpload.State.BOUND;
    }

    private Instant expiresAt(CommentSubmission.Spec spec) {
        if (spec.getExpiresAt() == null) {
            return spec.getStartedAt().plus(UploadLifecycleService.SUBMISSION_TTL);
        }
        return spec.getExpiresAt();
    }
}
