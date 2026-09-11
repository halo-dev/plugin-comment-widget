package run.halo.comment.widget.captcha;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import run.halo.comment.widget.SettingConfigGetter;
import run.halo.comment.widget.SettingConfigGetter.CaptchaConfig;
import run.halo.comment.widget.SettingConfigGetter.CaptchaConfig.CaptchaAudience;

class CommentCaptchaFilterTest {
    static final List<String> SUBMISSION_PATHS = List.of(
        "/apis/api.halo.run/v1alpha1/comments",
        "/apis/api.halo.run/v1alpha1/comments/parent/reply");
    final SettingConfigGetter settings = mock(SettingConfigGetter.class);
    final CaptchaManager manager = mock(CaptchaManager.class);
    final CaptchaCookieResolverImpl cookies = new CaptchaCookieResolverImpl();
    final CommentCaptchaFilter filter = new CommentCaptchaFilter(
        settings, manager, mock(TurnstileVerifier.class), mock(AltchaService.class), cookies, new CaptchaRequirement());

    void configure(CaptchaConfig config) {
        when(settings.getSecurityConfig()).thenReturn(Mono.just(
            new SettingConfigGetter.SecurityConfig().setCaptcha(config)));
        when(manager.generate(any(), any())).thenReturn(Mono.just(
            new CaptchaManager.Captcha("id", "code", "data:image/png;base64,test")));
    }

    static Authentication authenticated(String... roles) {
        var authorities = Arrays.stream(roles)
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role)).toList();
        return UsernamePasswordAuthenticationToken.authenticated("reader", "", authorities);
    }

    void submit(MockServerWebExchange exchange, Authentication authentication, WebFilterChain chain) {
        var result = filter.filter(exchange, chain);
        if (authentication != null) {
            result = result.contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication));
        }
        result.block();
    }

    @ParameterizedTest
    @CsvSource({
        "false,ALL,false,anonymous,false",
        "false,ALL,false,reader,false",
        "false,ROLES,true,anonymous,false",
        "false,ROLES,true,editor,false",
        "true,ALL,false,anonymous,true",
        "true,ALL,false,reader,true",
        "true,ANONYMOUS,false,anonymous,true",
        "true,ANONYMOUS,true,reader,false",
        "true,ROLES,false,anonymous,false",
        "true,ROLES,true,anonymous,true",
        "true,ROLES,false,editor,true",
        "true,ROLES,false,author,true",
        "true,ROLES,false,reader,false",
        "true,ROLES,true,reader,false",
        "true,ROLES,false,authenticated,true"
    })
    void enforcesAudienceForCommentsAndReplies(boolean enabled, CaptchaAudience audience,
                                               boolean includeAnonymous, String role,
                                               boolean required) {
        configure(new CaptchaConfig().setEnable(enabled).setAudience(audience)
            .setIncludeAnonymous(includeAnonymous)
            .setRoles(Set.of("editor", "author", "authenticated")));
        Authentication authentication = null;
        if (!role.equals("anonymous")) {
            authentication = authenticated(role);
        }
        for (var path : SUBMISSION_PATHS) {
            var exchange = MockServerWebExchange.from(MockServerHttpRequest.post(path));
            var calls = new AtomicInteger();
            submit(exchange, authentication, e -> Mono.fromRunnable(calls::incrementAndGet));
            if (!required) {
                assertThat(calls.get()).isEqualTo(1);
                continue;
            }
            assertThat(calls.get()).isZero();
            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(exchange.getResponse().getHeaders().getFirst("X-Require-Captcha"))
                .isEqualTo("true");
            assertThat(exchange.getResponse().getBodyAsString().block())
                .contains(CommentCaptchaFilter.CAPTCHA_REQUIRED_TYPE);
        }
    }

    @ParameterizedTest
    @CsvSource({"true", "false"})
    void verifiesCodeBeforeCallingDownstream(boolean valid) {
        configure(new CaptchaConfig().setEnable(true).setAudience(CaptchaAudience.ALL));
        when(manager.verify("id", "answer", true)).thenReturn(Mono.just(valid));
        for (var path : SUBMISSION_PATHS) {
            var exchange = MockServerWebExchange.from(MockServerHttpRequest.post(path)
                .header("X-Captcha-Code", "answer")
                .cookie(new HttpCookie(CaptchaCookieResolverImpl.CAPTCHA_COOKIE_KEY, "id")));
            var calls = new AtomicInteger();
            submit(exchange, authenticated("reader"), e -> Mono.fromRunnable(calls::incrementAndGet));
            if (valid) {
                assertThat(calls.get()).isEqualTo(1);
                assertThat(exchange.getResponse().getCookies()
                    .getFirst(CaptchaCookieResolverImpl.CAPTCHA_COOKIE_KEY).getMaxAge()).isZero();
                continue;
            }
            assertThat(calls.get()).isZero();
            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(exchange.getResponse().getBodyAsString().block())
                .contains(CommentCaptchaFilter.CAPTCHA_INVALID_TYPE);
        }
        verify(manager, times(2)).verify("id", "answer", true);
    }

    @Test
    void unrelatedRequestsPassThroughExactlyOnce() {
        var calls = new AtomicInteger();
        var exchange = MockServerWebExchange.from(MockServerHttpRequest.get(SUBMISSION_PATHS.getFirst()));
        submit(exchange, authenticated("reader"), e -> Mono.fromRunnable(calls::incrementAndGet));
        assertThat(calls.get()).isEqualTo(1);
        verifyNoInteractions(settings, manager);
    }
}
