package run.halo.comment.widget.upload;

import static run.halo.comment.widget.upload.CommentUpload.State.*;
import static run.halo.comment.widget.upload.UploadLifecycleService.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import run.halo.app.core.extension.attachment.Attachment;
import run.halo.app.core.extension.content.Comment;
import run.halo.app.core.extension.content.Reply;
import run.halo.app.extension.Extension;
import run.halo.app.extension.ExtensionClient;
import run.halo.app.extension.PageRequestImpl;

/** Maintains and queries comment/reply image references used by deletion checks. */
final class UploadReferenceIndex {

    private final ExtensionClient client;
    volatile boolean ready;

    UploadReferenceIndex(ExtensionClient client) {
        this.client = client;
    }

    public Optional<String> targetContent(String kind, String name) {
        if ("Comment".equals(kind)) {
            return client
                .fetch(Comment.class, name)
                .filter(c -> c.getMetadata().getDeletionTimestamp() == null)
                .map(c -> c.getSpec().getContent());
        }
        if ("Reply".equals(kind)) {
            return client
                .fetch(Reply.class, name)
                .filter(c -> c.getMetadata().getDeletionTimestamp() == null)
                .map(c -> c.getSpec().getContent());
        }
        return Optional.empty();
    }

    public boolean referencedElsewhere(String url) {
        if (!ready) {
            return true;
        }
        var options = UploadMetadata.matching(
            UploadMetadata.REF_PREFIX + UploadMetadata.urlKey(url),
            "true"
        );
        if (client.listBy(Comment.class, options, PageRequestImpl.ofSize(1)).getTotal() > 0) {
            return true;
        }
        return client.listBy(Reply.class, options, PageRequestImpl.ofSize(1)).getTotal() > 0;
    }

    public void rejectBoundImages(String content) {
        for (var key : UploadReferences.images(content)
            .stream()
            .map(UploadMetadata::urlKey)
            .distinct()
            .toList()) {
            var attachments = client.listBy(
                Attachment.class,
                UploadMetadata.matching(UploadMetadata.URL_KEY, key),
                PageRequestImpl.ofSize(1)
            );
            if (attachments.getItems().stream().anyMatch(this::hasTarget)) {
                throw error(HttpStatus.CONFLICT, "Image already belongs to a submitted comment");
            }
        }
    }

    public void indexReferences(String kind, String name) {
        Extension resource = targetResource(kind, name);
        if (resource == null) {
            return;
        }
        var labels = new HashMap<>(labelsOf(resource));
        labels.keySet().removeIf(k -> k.startsWith(UploadMetadata.REF_PREFIX));
        if (resource.getMetadata().getDeletionTimestamp() == null) {
            String content = contentOf(resource);
            for (var url : UploadReferences.images(content)) {
                labels.put(UploadMetadata.REF_PREFIX + UploadMetadata.urlKey(url), "true");
            }
        }
        if (!labels.equals(labelsOf(resource))) {
            resource.getMetadata().setLabels(labels);
            client.update(resource);
        }
    }

    private boolean hasTarget(Attachment attachment) {
        return UploadMetadata.annotation(attachment, UploadMetadata.TARGET_NAME) != null;
    }

    private Extension targetResource(String kind, String name) {
        if ("Comment".equals(kind)) {
            return client.fetch(Comment.class, name).orElse(null);
        }
        return client.fetch(Reply.class, name).orElse(null);
    }

    private Map<String, String> labelsOf(Extension resource) {
        if (resource.getMetadata().getLabels() == null) {
            return Map.of();
        }
        return resource.getMetadata().getLabels();
    }

    private String contentOf(Extension resource) {
        if (resource instanceof Comment comment) {
            return comment.getSpec().getContent();
        }
        return ((Reply) resource).getSpec().getContent();
    }
}
