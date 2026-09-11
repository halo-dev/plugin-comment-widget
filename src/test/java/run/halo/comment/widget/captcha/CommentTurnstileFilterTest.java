package run.halo.comment.widget.captcha;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import run.halo.comment.widget.SettingConfigGetter;

class CommentTurnstileFilterTest {
    @ParameterizedTest
    @EnumSource(TurnstileVerifier.Result.class)
    void handlesVerificationResultsForCommentsAndReplies(TurnstileVerifier.Result result) throws Exception {
        for (var path : new String[]{"/apis/api.halo.run/v1alpha1/comments",
            "/apis/api.halo.run/v1alpha1/comments/example/reply"}) {
            var settings = mock(SettingConfigGetter.class);
            var verifier = mock(TurnstileVerifier.class);
            var chain = mock(WebFilterChain.class);
            var config = new SettingConfigGetter.CaptchaConfig()
                .setEnable(true).setType(CaptchaType.TURNSTILE);
            when(settings.getSecurityConfig()).thenReturn(Mono.just(new SettingConfigGetter.SecurityConfig().setCaptcha(config)));
            when(verifier.verify(isNull(), eq(config))).thenReturn(Mono.just(result));
            var handlerCalled = new java.util.concurrent.atomic.AtomicBoolean();
            when(chain.filter(any())).thenReturn(Mono.fromRunnable(() -> handlerCalled.set(true)));
            var filter = new CommentCaptchaFilter(settings, mock(CaptchaManager.class), verifier, mock(AltchaService.class),
                mock(CaptchaCookieResolverImpl.class), new CaptchaRequirement());
            var exchange = MockServerWebExchange.from(MockServerHttpRequest.post(path));
            filter.filter(exchange, chain).block();
            if (result == TurnstileVerifier.Result.VALID) {
                assertThat(handlerCalled).isTrue();
                continue;
            }
            assertThat(handlerCalled).isFalse();
            var expectedStatus = HttpStatus.SERVICE_UNAVAILABLE;
            var expectedDetail = "人机验证服务暂不可用";
            var expectedType = "https://www.halo.run/probs/captcha-unavailable";
            if (result == TurnstileVerifier.Result.INVALID) {
                expectedStatus = HttpStatus.FORBIDDEN;
                expectedDetail = "人机验证未通过";
                expectedType = "https://www.halo.run/probs/captcha-invalid";
            } else if (result == TurnstileVerifier.Result.CONFIGURATION_ERROR) {
                expectedDetail = "人机验证配置异常";
                expectedType = "https://www.halo.run/probs/captcha-configuration-error";
            }
            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(expectedStatus);
            var body = exchange.getResponse().getBodyAsString().block();
            assertThat(body).contains(expectedDetail);
            assertThat(CommentCaptchaFilter.createObjectMapper().readTree(body).get("type").asText())
                .isEqualTo(expectedType);
        }
    }

    @ParameterizedTest
    @org.junit.jupiter.params.provider.CsvSource({
        "ALL, false, true, reader, true",
        "ANONYMOUS, false, true, reader, false",
        "ROLES, false, true, reader, true",
        "ROLES, false, true, editor, false",
        "ROLES, true, true, anonymousUser, true",
        "ROLES, false, true, anonymousUser, false",
        "ALL, false, false, reader, false"
    })
    void appliesAudienceRulesBeforeTurnstile(
        SettingConfigGetter.CaptchaConfig.CaptchaAudience audience,
        boolean includeAnonymous, boolean enabled, String username, boolean required) {
        var settings = mock(SettingConfigGetter.class);
        var verifier = mock(TurnstileVerifier.class);
        var config = new SettingConfigGetter.CaptchaConfig().setEnable(enabled)
            .setType(CaptchaType.TURNSTILE).setAudience(audience)
            .setRoles(java.util.Set.of("reader")).setIncludeAnonymous(includeAnonymous);
        when(settings.getSecurityConfig()).thenReturn(Mono.just(
            new SettingConfigGetter.SecurityConfig().setCaptcha(config)));
        when(verifier.verify(any(), eq(config))).thenReturn(Mono.just(TurnstileVerifier.Result.VALID));
        var authentication = org.springframework.security.authentication.UsernamePasswordAuthenticationToken
            .authenticated(username, "", java.util.List.of(
                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + username)));
        for (var path : java.util.List.of("/apis/api.halo.run/v1alpha1/comments",
            "/apis/api.halo.run/v1alpha1/comments/example/reply")) {
            var filter = new CommentCaptchaFilter(settings, mock(CaptchaManager.class), verifier, mock(AltchaService.class),
                mock(CaptchaCookieResolverImpl.class), new CaptchaRequirement());
            var chain = mock(WebFilterChain.class);
            when(chain.filter(any())).thenReturn(Mono.empty());
            var exchange = MockServerWebExchange.from(MockServerHttpRequest.post(path)
                .header("X-Turnstile-Token", "token"));
            var result = filter.filter(exchange, chain);
            if (!username.equals("anonymousUser")) {
                result = result.contextWrite(
                    org.springframework.security.core.context.ReactiveSecurityContextHolder
                        .withAuthentication(authentication));
            }
            result.block();
            verify(chain).filter(exchange);
        }
        if (required) {
            verify(verifier, times(2)).verify("token", config);
            return;
        }
        verifyNoInteractions(verifier);
    }
}
