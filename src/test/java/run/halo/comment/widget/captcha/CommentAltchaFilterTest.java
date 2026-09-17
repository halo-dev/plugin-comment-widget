package run.halo.comment.widget.captcha;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import run.halo.comment.widget.SettingConfigGetter;

class CommentAltchaFilterTest {
    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void validatesCommentsAndReplies(boolean valid) {
        var settings = mock(SettingConfigGetter.class);
        var altcha = mock(AltchaService.class);
        var config = new SettingConfigGetter.CaptchaConfig().setEnable(true).setType(CaptchaType.ALTCHA);
        when(settings.getSecurityConfig()).thenReturn(Mono.just(
            new SettingConfigGetter.SecurityConfig().setCaptcha(config)));
        when(altcha.verify("payload")).thenReturn(Mono.just(valid));
        for (var path : new String[]{"/apis/api.halo.run/v1alpha1/comments",
            "/apis/api.halo.run/v1alpha1/comments/example/reply"}) {
            var chain = mock(WebFilterChain.class);
            when(chain.filter(any())).thenReturn(Mono.empty());
            var exchange = MockServerWebExchange.from(MockServerHttpRequest.post(path)
                .header("X-Altcha-Payload", "payload"));
            var filter = new CommentCaptchaFilter(settings, mock(CaptchaManager.class),
                mock(TurnstileVerifier.class), altcha, mock(CaptchaCookieResolverImpl.class),
                new CaptchaRequirement());
            filter.filter(exchange, chain).block();
            if (valid) {
                verify(chain).filter(exchange);
                continue;
            }
            verifyNoInteractions(chain);
            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(exchange.getResponse().getBodyAsString().block()).contains("captcha-invalid", "人机验证未通过");
        }
    }
}
