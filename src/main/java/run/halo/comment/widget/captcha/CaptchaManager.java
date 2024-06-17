package run.halo.comment.widget.captcha;

import reactor.core.publisher.Mono;

public interface CaptchaManager {
    Mono<Boolean> verify(String id, String captchaCode);

    Mono<Void> invalidate(String id);

    Mono<Captcha> generate();

    record Captcha(String id, String code, String imageBase64) {
    }
}
