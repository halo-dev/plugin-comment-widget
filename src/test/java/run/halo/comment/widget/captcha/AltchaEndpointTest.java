package run.halo.comment.widget.captcha;

import static org.mockito.Mockito.*;

import java.net.InetSocketAddress;
import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.reactive.function.server.HandlerStrategies;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import org.springframework.web.reactive.function.server.RouterFunction;
import static org.assertj.core.api.Assertions.assertThat;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;
import run.halo.comment.widget.SettingConfigGetter;

class AltchaEndpointTest {
    @Test
    void servesUncachedChallengesOnlyWhenAltchaIsEnabled() {
        var settings = mock(SettingConfigGetter.class);
        var config = new SettingConfigGetter.CaptchaConfig().setEnable(true).setType(CaptchaType.ALTCHA);
        when(settings.getSecurityConfig()).thenReturn(Mono.just(
            new SettingConfigGetter.SecurityConfig().setCaptcha(config)));
        var client = WebTestClient.bindToRouterFunction(
            new AltchaEndpoint(new AltchaService(), settings).endpoint()).build();
        client.get().uri("/captcha/-/altcha").exchange().expectStatus().isOk()
            .expectHeader().valueEquals("Cache-Control", "no-store")
            .expectBody().jsonPath("$.parameters.algorithm").isEqualTo("PBKDF2/SHA-256")
            .jsonPath("$.parameters.expiresAt").isNumber()
            .jsonPath("$.parameters.keySignature").doesNotExist()
            .jsonPath("$.signature").isNotEmpty();
        config.setEnable(false);
        client.get().uri("/captcha/-/altcha").exchange().expectStatus().isNotFound();
        config.setEnable(true).setType(CaptchaType.TURNSTILE);
        client.get().uri("/captcha/-/altcha").exchange().expectStatus().isNotFound();
    }

    @Test
    void exhaustedClientDoesNotBlockAnotherAddress() {
        var settings = mock(SettingConfigGetter.class);
        when(settings.getSecurityConfig()).thenReturn(Mono.just(
            new SettingConfigGetter.SecurityConfig().setCaptcha(
                new SettingConfigGetter.CaptchaConfig().setEnable(true).setType(CaptchaType.ALTCHA))));
        var router = new AltchaEndpoint(new AltchaService(), settings).endpoint();
        for (int i = 0; i < 5; i++) {
            assertThat(request(router, "192.0.2.1", i).statusCode().value()).isEqualTo(200);
        }
        var rejected = request(router, "192.0.2.1", 99);
        assertThat(rejected.statusCode().value()).isEqualTo(429);
        assertThat(rejected.headers().getFirst("Retry-After")).isEqualTo("1");
        assertThat(request(router, "192.0.2.2", 99).statusCode().value()).isEqualTo(200);
    }

    private ServerResponse request(RouterFunction<ServerResponse> router, String ip, int port) {
        var exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/captcha/-/altcha")
            .remoteAddress(new InetSocketAddress(ip, port))
            .header("X-Forwarded-For", "198.51.100." + port).build());
        var request = ServerRequest.create(exchange, HandlerStrategies.withDefaults().messageReaders());
        return router.route(request).flatMap(handler -> handler.handle(request)).block();
    }
}
