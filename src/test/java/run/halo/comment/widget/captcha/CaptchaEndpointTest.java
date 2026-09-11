package run.halo.comment.widget.captcha;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;
import run.halo.comment.widget.SettingConfigGetter;

class CaptchaEndpointTest {
    @ParameterizedTest
    @EnumSource(CaptchaType.class)
    void returnsAnExplicitResponseForEveryCaptchaType(CaptchaType type) {
        var settings = mock(SettingConfigGetter.class);
        var manager = mock(CaptchaManager.class);
        var config = new SettingConfigGetter.CaptchaConfig().setType(type);
        when(settings.getSecurityConfig()).thenReturn(Mono.just(
            new SettingConfigGetter.SecurityConfig().setCaptcha(config)));
        var client = WebTestClient.bindToRouterFunction(
            new CaptchaEndpoint(manager, settings).endpoint()).build();

        if (type == CaptchaType.TURNSTILE || type == CaptchaType.ALTCHA) {
            client.get().uri("/captcha/-/generate").exchange()
                .expectStatus().isNoContent().expectBody().isEmpty();
            verifyNoInteractions(manager);
            return;
        }

        var image = "data:image/png;base64,test";
        when(manager.generate(any(), eq(config))).thenReturn(Mono.just(
            new CaptchaManager.Captcha("id", "code", image)));
        client.get().uri("/captcha/-/generate").exchange()
            .expectStatus().isOk().expectBody(String.class).isEqualTo(image);
    }
}
