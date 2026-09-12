package run.halo.comment.widget.captcha;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import run.halo.comment.widget.SettingConfigGetter;

class CaptchaEndpointTest {
    @ParameterizedTest
    @EnumSource(CaptchaType.class)
    void returnsAnExplicitResponseForEveryCaptchaType(CaptchaType type) {
        var settings = mock(SettingConfigGetter.class);
        var manager = mock(CaptchaManager.class);
        var config = new SettingConfigGetter.CaptchaConfig().setEnable(true).setType(type);
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
            .expectStatus().isOk()
            .expectHeader().valueEquals("Cache-Control", "no-store")
            .expectBody(String.class).isEqualTo(image);
    }

    @Test
    void doesNotGenerateWhenCaptchaIsDisabled() {
        var settings = mock(SettingConfigGetter.class);
        var manager = mock(CaptchaManager.class);
        when(settings.getSecurityConfig()).thenReturn(Mono.just(
            new SettingConfigGetter.SecurityConfig().setCaptcha(
                new SettingConfigGetter.CaptchaConfig().setEnable(false))));
        WebTestClient.bindToRouterFunction(new CaptchaEndpoint(manager, settings).endpoint())
            .build().get().uri("/captcha/-/generate").exchange()
            .expectStatus().isNoContent().expectBody().isEmpty();
        verifyNoInteractions(manager);
    }

    @Test
    void returnsTooManyRequestsWhenGenerationIsThrottled() {
        var settings = mock(SettingConfigGetter.class);
        var manager = mock(CaptchaManager.class);
        var config = new SettingConfigGetter.CaptchaConfig().setEnable(true);
        when(settings.getSecurityConfig()).thenReturn(Mono.just(
            new SettingConfigGetter.SecurityConfig().setCaptcha(config)));
        when(manager.generate(any(), eq(config))).thenReturn(
            Mono.error(new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS)));
        WebTestClient.bindToRouterFunction(new CaptchaEndpoint(manager, settings).endpoint())
            .build().get().uri("/captcha/-/generate").exchange()
            .expectStatus().isEqualTo(HttpStatus.TOO_MANY_REQUESTS)
            .expectHeader().valueEquals("Retry-After", "1")
            .expectHeader().valueEquals("Cache-Control", "no-store");
    }
}
