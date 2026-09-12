package run.halo.comment.widget.upload;

import java.time.Instant;
import lombok.Data;
import lombok.EqualsAndHashCode;
import run.halo.app.extension.AbstractExtension;
import run.halo.app.extension.GVK;

@Data
@EqualsAndHashCode(callSuper = true)
@GVK(
    group = "commentwidget.halo.run",
    version = "v1alpha1",
    kind = "CommentUpload",
    plural = "commentuploads",
    singular = "commentupload"
)
public class CommentUpload extends AbstractExtension {

    public static final String LABEL = "commentwidget.halo.run/upload";
    private Spec spec;

    public enum State {
        UPLOADING,
        TEMPORARY,
        RESERVED,
        BOUND,
        GC_PENDING,
        DELETING,
        DELETED,
    }

    @Data
    public static class Spec {

        private String credentialHash;
        private String owner;
        private String attachmentName;
        private String url;
        private State state;
        private Instant expiresAt;
        private Instant deleteAfter;
        private String submissionId;
        private String targetKind;
        private String targetName;
        private boolean retained;
        private int attempts;
        private String lastError;
    }
}
