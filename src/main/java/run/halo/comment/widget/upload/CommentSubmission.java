package run.halo.comment.widget.upload;

import java.time.Instant;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;
import run.halo.app.extension.AbstractExtension;
import run.halo.app.extension.GVK;

@Data
@EqualsAndHashCode(callSuper = true)
@GVK(
    group = "commentwidget.halo.run",
    version = "v1alpha1",
    kind = "CommentSubmission",
    plural = "commentsubmissions",
    singular = "commentsubmission"
)
public class CommentSubmission extends AbstractExtension {

    private Spec spec;

    public enum State {
        ISSUED,
        PREPARING,
        PROCESSING,
        UNKNOWN,
        BOUND,
        FAILED,
    }

    @Data
    public static class Spec {

        private String credentialHash;
        private String owner;
        private String requestHash;
        private List<String> uploadIds;
        private State state;
        private String targetKind;
        private String targetName;
        private Instant startedAt;
        private Instant expiresAt;
    }
}
