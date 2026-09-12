package run.halo.comment.widget.captcha;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;
import run.halo.comment.widget.SettingConfigGetter;

class CaptchaManagerImplTest {
    final CaptchaCookieResolverImpl cookies = new CaptchaCookieResolverImpl();
    final CaptchaManagerImpl manager = new CaptchaManagerImpl(cookies);

    CaptchaManager.Captcha generate(SettingConfigGetter.CaptchaConfig config) {
        return manager.generate(MockServerWebExchange.from(
            MockServerHttpRequest.get("/captcha/-/generate")), config).block();
    }

    @ParameterizedTest
    @EnumSource(value = CaptchaType.class, names = {"ALPHANUMERIC", "ARITHMETIC"})
    void rejectsReplayAcrossCommentAndReply(CaptchaType type) {
        var config = new SettingConfigGetter.CaptchaConfig().setEnable(true).setType(type)
            .setAudience(SettingConfigGetter.CaptchaConfig.CaptchaAudience.ALL);
        var settings = mock(SettingConfigGetter.class);
        when(settings.getSecurityConfig()).thenReturn(Mono.just(
            new SettingConfigGetter.SecurityConfig().setCaptcha(config)));
        var filter = new CommentCaptchaFilter(settings, manager,
            mock(TurnstileVerifier.class), mock(AltchaService.class), cookies, new CaptchaRequirement());
        var captcha = generate(config);
        var calls = new AtomicInteger();
        var paths = new String[]{"/apis/api.halo.run/v1alpha1/comments",
            "/apis/api.halo.run/v1alpha1/comments/parent/reply"};
        for (int i = 0; i < paths.length; i++) {
            var exchange = MockServerWebExchange.from(MockServerHttpRequest.post(paths[i])
                .cookie(new HttpCookie(CaptchaCookieResolverImpl.CAPTCHA_COOKIE_KEY, captcha.id()))
                .header("X-Captcha-Code", captcha.code()));
            filter.filter(exchange, e -> Mono.fromRunnable(calls::incrementAndGet)).block();
            assertThat(calls.get()).isEqualTo(1);
            if (i == 1) {
                assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            }
        }
    }

    @ParameterizedTest
    @EnumSource(value = CaptchaType.class, names = {"ALPHANUMERIC", "ARITHMETIC"})
    void concurrentSubscriptionsConsumeCaptchaOnlyOnce(CaptchaType type) throws Exception {
        var captcha = generate(new SettingConfigGetter.CaptchaConfig().setType(type));
        var verification = manager.verify(captcha.id(), captcha.code(), true);
        var start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> {
                assertThat(start.await(5, TimeUnit.SECONDS)).isTrue();
                return verification.block();
            });
            var second = executor.submit(() -> {
                assertThat(start.await(5, TimeUnit.SECONDS)).isTrue();
                return verification.block();
            });
            start.countDown();
            assertThat(new Boolean[]{first.get(5, TimeUnit.SECONDS), second.get(5, TimeUnit.SECONDS)})
                .containsExactlyInAnyOrder(true, false);
            assertThat(verification.block()).isFalse();
        }
    }
}
