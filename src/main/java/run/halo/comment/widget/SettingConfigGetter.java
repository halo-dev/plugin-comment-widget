package run.halo.comment.widget;

import reactor.core.publisher.Mono;

public interface SettingConfigGetter {

    Mono<SecurityConfig> getSecurityConfig();

    record SecurityConfig(CaptchaConfig captcha) {
        public static SecurityConfig empty() {
            return new SecurityConfig(new CaptchaConfig(false));
        }
    }

    record CaptchaConfig(boolean anonymousCommentCaptcha) {
    }
}
