package run.halo.comment.widget.captcha;

import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import run.halo.comment.widget.SettingConfigGetter;

public interface CaptchaManager {
    Mono<Boolean> verify(String id, String captchaCode, boolean ignoreCase);

    Mono<Void> invalidate(String id);

    Mono<Captcha> generate(ServerWebExchange exchange, SettingConfigGetter.CaptchaConfig captchaConfig);

    record Captcha(String id, String code, String imageBase64) {
    }
}
