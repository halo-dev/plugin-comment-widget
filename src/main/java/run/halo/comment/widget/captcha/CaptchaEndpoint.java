package run.halo.comment.widget.captcha;

import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import run.halo.app.core.extension.endpoint.CustomEndpoint;
import run.halo.app.extension.GroupVersion;
import run.halo.comment.widget.SettingConfigGetter;

@Component
@RequiredArgsConstructor
public class CaptchaEndpoint implements CustomEndpoint {

    private final CaptchaManager captchaManager;
    private final SettingConfigGetter settingConfigGetter;

    @Override
    public RouterFunction<ServerResponse> endpoint() {
        return RouterFunctions.route()
            .GET("captcha/-/generate", this::generateCaptcha)
            .build();
    }

    private Mono<ServerResponse> generateCaptcha(ServerRequest request) {
        return settingConfigGetter.getSecurityConfig()
            .map(SettingConfigGetter.SecurityConfig::getCaptcha)
            .flatMap(captchaConfig -> {
                if (!captchaConfig.isEnable()
                    || captchaConfig.getType() == CaptchaType.TURNSTILE
                    || captchaConfig.getType() == CaptchaType.ALTCHA) {
                    return ServerResponse.noContent().build();
                }
                return captchaManager.generate(request.exchange(), captchaConfig)
                    .flatMap(captcha -> ServerResponse.ok()
                        .cacheControl(CacheControl.noStore())
                        .bodyValue(captcha.imageBase64()))
                    .onErrorResume(this::tooManyRequests);
            });
    }

    private Mono<ServerResponse> tooManyRequests(Throwable error) {
        if (!(error instanceof ResponseStatusException status)
            || status.getStatusCode() != HttpStatus.TOO_MANY_REQUESTS) {
            return Mono.error(error);
        }
        return ServerResponse.status(HttpStatus.TOO_MANY_REQUESTS)
            .header("Retry-After", "1")
            .cacheControl(CacheControl.noStore())
            .build();
    }

    @Override
    public GroupVersion groupVersion() {
        return GroupVersion.parseAPIVersion("api.commentwidget.halo.run/v1alpha1");
    }
}
