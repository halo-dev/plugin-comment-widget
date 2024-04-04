package run.halo.comment.widget;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import run.halo.app.extension.AbstractExtension;
import run.halo.app.extension.GVK;

/**
 * @author mashirot
 * 2024/4/4 16:44
 */
@Data
@EqualsAndHashCode(callSuper = true)
@GVK(kind = "CommentWidget", group = "widget.comment.halo.run",
        version = "v1alpha1", singular = "comment-widget-setting", plural = "comment-widget-settings")
public class CommentWidgetSetting extends AbstractExtension {

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private CommentWidgetSettingSpec spec;

    public static class CommentWidgetSettingSpec {
        public static final String ANONYMOUS_USER_POLICY = "AnonymousUserPolicy";
        public static final String ALL_USER_POLICY = "AllUserPolicy";
        public static final String NO_AVATAR_USER_POLICY = "NoAvatarUserPolicy";

        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, defaultValue = "false")
        private Boolean useAvatarProvider;
        @Schema(requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        private String avatarProvider;
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, defaultValue = ANONYMOUS_USER_POLICY)
        private String avatarPolicy;
    }
}
