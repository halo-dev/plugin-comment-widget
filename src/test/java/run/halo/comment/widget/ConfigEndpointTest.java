package run.halo.comment.widget;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;
import run.halo.app.extension.ConfigMap;
import run.halo.app.extension.ReactiveExtensionClient;
import run.halo.app.plugin.PluginContext;
import run.halo.comment.widget.captcha.CaptchaRequirement;

class ConfigEndpointTest {
    @Test
    void exposesMigratedHiddenRoleRequirementWithoutCachingAcrossUsers() throws Exception {
        var migrated = CommentWidgetPlugin.migrateCaptchaSettings(
            """
            {
              "captcha": {
                "anonymousCommentCaptcha": false,
                "authenticatedCommentCaptcha": true
              }
            }
            """);
        var config = new ObjectMapper().readValue(migrated, SettingConfigGetter.SecurityConfig.class);
        assertThat(config.getCaptcha().getRoles()).containsExactly("authenticated");
        var client = mock(ReactiveExtensionClient.class);
        var context = mock(PluginContext.class);
        var settings = mock(SettingConfigGetter.class);
        var configMap = new ConfigMap();
        configMap.setData(Map.of("security", migrated));
        when(context.getConfigMapName()).thenReturn("test-config");
        when(client.fetch(ConfigMap.class, "test-config")).thenReturn(Mono.just(configMap));
        when(settings.getSecurityConfig()).thenReturn(Mono.just(config));
        var endpoint = new ConfigEndpoint(client, context, settings, new CaptchaRequirement());
        var authentication = UsernamePasswordAuthenticationToken.authenticated("reader", "",
            List.of(new SimpleGrantedAuthority("ROLE_authenticated")));
        var webClient = WebTestClient.bindToRouterFunction(endpoint.endpoint())
            .webFilter((exchange, chain) -> {
                var result = chain.filter(exchange);
                if (exchange.getRequest().getHeaders().getFirst("X-Test-Authenticated") != null) {
                    return result.contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication));
                }
                return result;
            }).build();
        webClient.get().uri("/config").header("X-Test-Authenticated", "true")
            .exchange().expectStatus().isOk()
            .expectHeader().value(HttpHeaders.CACHE_CONTROL,
                value -> assertThat(value).contains("no-store", "private"))
            .expectHeader().value(HttpHeaders.VARY,
                value -> assertThat(value).contains("Cookie", "Authorization"))
            .expectBody().jsonPath("$.captchaRequired").isEqualTo(true);
        webClient.get().uri("/config").exchange().expectStatus().isOk()
            .expectBody().jsonPath("$.captchaRequired").isEqualTo(false);
        config.getCaptcha().setEnable(false);
        webClient.get().uri("/config").header("X-Test-Authenticated", "true")
            .exchange().expectStatus().isOk()
            .expectBody().jsonPath("$.captchaRequired").isEqualTo(false);
    }
}
