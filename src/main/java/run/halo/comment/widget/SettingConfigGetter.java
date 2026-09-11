package run.halo.comment.widget;

import java.util.Set;
import lombok.Data;
import lombok.Getter;
import lombok.experimental.Accessors;
import org.springframework.lang.NonNull;
import reactor.core.publisher.Mono;
import run.halo.comment.widget.captcha.CaptchaType;

public interface SettingConfigGetter {

    /**
     * Never {@link Mono#empty()}.
     */
    Mono<BasicConfig> getBasicConfig();

    /**
     * Never {@link Mono#empty()}.
     */
    Mono<AvatarConfig> getAvatarConfig();

    /**
     * Never {@link Mono#empty()}.
     */
    Mono<SecurityConfig> getSecurityConfig();

    @Data
    @Accessors(chain = true)
    class SecurityConfig {
        public static final String GROUP = "security";

        @Getter(onMethod_ = @NonNull)
        private CaptchaConfig captcha = CaptchaConfig.empty();

        public SecurityConfig setCaptcha(CaptchaConfig captcha) {
            if (captcha == null) {
                this.captcha = CaptchaConfig.empty();
                return this;
            }
            this.captcha = captcha;
            return this;
        }

        public static SecurityConfig empty() {
            return new SecurityConfig()
                .setCaptcha(CaptchaConfig.empty());
        }
    }

    @Data
    @Accessors(chain = true)
    class CaptchaConfig {

        private boolean enable;

        private CaptchaAudience audience = CaptchaAudience.ANONYMOUS;

        private Set<String> roles = Set.of();

        private boolean includeAnonymous;

        public enum CaptchaAudience {
            ALL, ANONYMOUS, ROLES
        }

        @Getter(onMethod_ = @NonNull)
        private CaptchaType type = CaptchaType.ALPHANUMERIC;

        private boolean ignoreCase = true;

        private int captchaLength = 4;

        private int arithmeticRange = 90;

        public CaptchaConfig setType(CaptchaType type) {
            if (type == null) {
                this.type = CaptchaType.ALPHANUMERIC;
                return this;
            }
            this.type = type;
            return this;
        }

        public static CaptchaConfig empty() {
            return new CaptchaConfig();
        }
    }

    @Data
    class BasicConfig {
        public static final String GROUP = "basic";
        private int size;
        private int replySize;
        private boolean withReplies;
        private int withReplySize;
    }

    @Data
    class AvatarConfig {
        public static final String GROUP = "avatar";
        private boolean enable;
        private String provider;
        private String providerMirror;
        private String policy;
    }
}
