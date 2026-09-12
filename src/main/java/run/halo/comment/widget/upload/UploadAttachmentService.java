package run.halo.comment.widget.upload;

import static run.halo.comment.widget.upload.CommentUpload.State.*;
import static run.halo.comment.widget.upload.UploadLifecycleService.*;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.function.Consumer;
import org.springframework.http.HttpStatus;
import run.halo.app.core.extension.attachment.Attachment;
import run.halo.app.extension.ExtensionClient;
import run.halo.app.extension.MetadataUtil;

/** Tracks stored attachments, compacts upload records and performs delayed cleanup. */
final class UploadAttachmentService {

    private final ExtensionClient client;
    private final UploadReferenceIndex references;

    UploadAttachmentService(ExtensionClient client, UploadReferenceIndex references) {
        this.client = client;
        this.references = references;
    }

    private CommentUpload getUpload(String id) {
        return client
            .fetch(CommentUpload.class, id)
            .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Upload not found"));
    }

    public void attached(String id, Attachment attachment) {
        UploadRetries.run(5, () -> attachOnce(id, attachment));
    }

    public void uploaded(String id, Attachment attachment, String url) {
        var upload = getUpload(id);
        if (upload.getSpec().getState() != UPLOADING && upload.getSpec().getState() != TEMPORARY) {
            return;
        }
        upload.getSpec().setAttachmentName(attachment.getMetadata().getName());
        upload.getSpec().setUrl(url);
        upload.getSpec().setState(TEMPORARY);
        client.update(upload);
        updateAttachment(attachment.getMetadata().getName(), latest -> {
            MetadataUtil.nullSafeAnnotations(latest).put(UploadMetadata.URL, url);
            MetadataUtil.nullSafeLabels(latest).put(
                UploadMetadata.URL_KEY,
                UploadMetadata.urlKey(url)
            );
        });
    }

    public void updateAttachment(String name, Consumer<Attachment> change) {
        UploadRetries.run(4, () -> {
            var attachment = client.fetch(Attachment.class, name).orElseThrow();
            change.accept(attachment);
            client.update(attachment);
        });
    }

    public void compact(CommentUpload upload) {
        var spec = upload.getSpec();
        if (spec.getSubmissionId() != null) {
            var submission = client.fetch(CommentSubmission.class, spec.getSubmissionId());
            if (
                submission.isPresent() &&
                submission.get().getSpec().getState() != CommentSubmission.State.BOUND
            ) {
                return;
            }
        }
        var found = client.fetch(Attachment.class, spec.getAttachmentName());
        if (found.isEmpty()) {
            client.delete(upload);
            return;
        }
        if (
            !upload
                .getMetadata()
                .getName()
                .equals(UploadMetadata.label(found.get(), CommentUpload.LABEL))
        ) {
            throw new IllegalStateException("Attachment ownership marker mismatch");
        }
        updateAttachment(spec.getAttachmentName(), attachment -> {
            var annotations = MetadataUtil.nullSafeAnnotations(attachment);
            annotations.put(UploadMetadata.URL, spec.getUrl());
            if (spec.isRetained()) {
                annotations.put(UploadMetadata.RETAINED, "true");
            }
            if (spec.getTargetName() != null) {
                annotations.put(UploadMetadata.TARGET_KIND, spec.getTargetKind());
                annotations.put(UploadMetadata.TARGET_NAME, spec.getTargetName());
                MetadataUtil.nullSafeLabels(attachment).put(
                    UploadMetadata.TARGET_KEY,
                    UploadMetadata.key(spec.getTargetKind() + "/" + spec.getTargetName())
                );
            }
            MetadataUtil.nullSafeLabels(attachment).put(
                UploadMetadata.URL_KEY,
                UploadMetadata.urlKey(spec.getUrl())
            );
        });
        client.delete(upload);
    }

    public Optional<Duration> reconcileAttachment(String name) {
        var found = client.fetch(Attachment.class, name);
        if (found.isEmpty()) {
            return Optional.empty();
        }
        var attachment = found.get();
        if (UploadMetadata.label(attachment, CommentUpload.LABEL) == null) {
            return Optional.empty();
        }
        if ("true".equals(UploadMetadata.annotation(attachment, UploadMetadata.RETAINED))) {
            return Optional.empty();
        }
        if (attachment.getMetadata().getDeletionTimestamp() != null) {
            return Optional.empty();
        }
        String kind = UploadMetadata.annotation(attachment, UploadMetadata.TARGET_KIND);
        String target = UploadMetadata.annotation(attachment, UploadMetadata.TARGET_NAME);
        if (target == null) {
            var upload = client.fetch(
                CommentUpload.class,
                UploadMetadata.label(attachment, CommentUpload.LABEL)
            );
            if (canRecoverPermalink(upload, attachment)) {
                uploaded(
                    upload.get().getMetadata().getName(),
                    attachment,
                    attachment.getStatus().getPermalink()
                );
            }
            return Optional.empty();
        }
        if (references.targetContent(kind, target).isPresent()) {
            return Optional.empty();
        }
        String after = UploadMetadata.annotation(attachment, UploadMetadata.DELETE_AFTER);
        if (after == null) {
            updateAttachment(name, latest -> {
                MetadataUtil.nullSafeAnnotations(latest).put(
                    UploadMetadata.DELETE_AFTER,
                    Instant.now().plus(DELETE_DELAY).toString()
                );
                MetadataUtil.nullSafeLabels(latest).put(UploadMetadata.GC_PENDING, "true");
            });
            return Optional.of(DELETE_DELAY);
        }
        if (!"true".equals(UploadMetadata.label(attachment, UploadMetadata.GC_PENDING))) {
            updateAttachment(name, latest ->
                MetadataUtil.nullSafeLabels(latest).put(UploadMetadata.GC_PENDING, "true")
            );
            return Optional.of(Duration.ofSeconds(1));
        }
        var delay = Duration.between(Instant.now(), Instant.parse(after));
        if (!delay.isNegative() && !delay.isZero()) {
            return Optional.of(delay);
        }
        String url = UploadMetadata.annotation(attachment, UploadMetadata.URL);
        if (url == null) {
            return Optional.of(Duration.ofMinutes(15));
        }
        if (references.referencedElsewhere(url)) {
            return Optional.of(Duration.ofMinutes(15));
        }
        client.delete(attachment); // CAS and Halo's finalizer own the physical deletion.
        return Optional.empty();
    }

    private void attachOnce(String id, Attachment attachment) {
        var upload = getUpload(id);
        String existingName = upload.getSpec().getAttachmentName();
        if (existingName != null) {
            if (!attachment.getMetadata().getName().equals(existingName)) {
                throw new IllegalStateException("Upload already has an attachment");
            }
            return;
        }
        upload.getSpec().setAttachmentName(attachment.getMetadata().getName());
        client.update(upload);
    }

    private boolean canRecoverPermalink(Optional<CommentUpload> upload, Attachment attachment) {
        if (upload.isEmpty()) {
            return false;
        }
        var spec = upload.get().getSpec();
        if (spec.getState() != UPLOADING) {
            return false;
        }
        if (
            !spec
                .getExpiresAt()
                .minus(TEMP_TTL)
                .plus(Duration.ofMinutes(10))
                .isBefore(Instant.now())
        ) {
            return false;
        }
        if (attachment.getStatus() == null) {
            return false;
        }
        return attachment.getStatus().getPermalink() != null;
    }
}
