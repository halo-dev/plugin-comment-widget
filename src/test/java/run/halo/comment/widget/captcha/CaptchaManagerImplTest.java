package run.halo.comment.widget.captcha;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.google.common.base.Ticker;
import java.net.InetSocketAddress;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import run.halo.comment.widget.SettingConfigGetter;

class CaptchaManagerImplTest {
    final CaptchaCookieResolverImpl cookies = new CaptchaCookieResolverImpl();
    final CaptchaManagerImpl manager = new CaptchaManagerImpl(cookies);

    CaptchaManager.Captcha generate(SettingConfigGetter.CaptchaConfig config) {
        return generate(manager, "127.0.0.1", 1, config);
    }

    CaptchaManager.Captcha generate(
        CaptchaManagerImpl captchaManager,
        String ip,
        int port,
        SettingConfigGetter.CaptchaConfig config
    ) {
        return captchaManager.generate(MockServerWebExchange.from(
            MockServerHttpRequest.get("/captcha/-/generate")
                .remoteAddress(new InetSocketAddress(ip, port))), config).block();
    }

    @Test
    void wrongAnswerConsumesTheChallenge() {
        var captcha = generate(new SettingConfigGetter.CaptchaConfig());
        assertThat(manager.verify(captcha.id(), "not-the-code", true).block()).isFalse();
        assertThat(manager.verify(captcha.id(), captcha.code(), true).block()).isFalse();
    }

    @Test
    void earlierCaptchaSurvivesManySubsequentGenerations() {
        var captchaManager = new CaptchaManagerImpl(
            cookies, new AltchaRequestLimiter(Ticker.systemTicker(), 1_000_000, 1_000_000));
        var config = new SettingConfigGetter.CaptchaConfig();
        var first = generate(captchaManager, "192.0.2.1", 1, config);
        for (int i = 0; i < 100; i++) {
            generate(captchaManager, "192.0.2." + (i % 250 + 1), i + 2, config);
        }
        assertThat(captchaManager.verify(first.id(), first.code(), true).block()).isTrue();
    }

    @Test
    void springSelectsTheProductionConstructor() {
        try (var context = new AnnotationConfigApplicationContext()) {
            context.register(CaptchaCookieResolverImpl.class, CaptchaManagerImpl.class);
            context.refresh();
            assertThat(context.getBean(CaptchaManagerImpl.class)).isNotNull();
        }
    }

    @Test
    void exhaustedClientDoesNotBlockAnotherAddress() {
        var nanos = new AtomicLong();
        var captchaManager = new CaptchaManagerImpl(cookies, new AltchaRequestLimiter(new Ticker() {
            @Override
            public long read() {
                return nanos.get();
            }
        }));
        var config = new SettingConfigGetter.CaptchaConfig();
        for (int i = 0; i < 5; i++) {
            assertThat(generate(captchaManager, "192.0.2.1", i, config)).isNotNull();
        }
        assertThatThrownBy(() -> generate(captchaManager, "192.0.2.1", 99, config))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));
        assertThat(generate(captchaManager, "192.0.2.2", 99, config)).isNotNull();
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
