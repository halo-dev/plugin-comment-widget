package run.halo.comment.widget;

import reactor.core.publisher.Mono;

public interface SettingConfigGetter {

    Mono<SecurityConfig> getSecurityConfig();

    record SecurityConfig(boolean anonymousCommentCaptcha) {
        public static SecurityConfig empty() {
            return new SecurityConfig(false);
        }
    }
}
