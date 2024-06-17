package run.halo.comment.widget.captcha;

import static org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers.pathMatchers;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.web.server.util.matcher.OrServerWebExchangeMatcher;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import run.halo.app.security.AdditionalWebFilter;
import run.halo.comment.widget.SettingConfigGetter;

@Component
@RequiredArgsConstructor
public class CommentCaptchaFilter implements AdditionalWebFilter {
    private final static String CAPTCHA_CODE_HEADER = "X-Captcha-Code";
    private final static String CAPTCHA_REQUIRED_HEADER = "X-Require-Captcha";
    private final ServerWebExchangeMatcher pathMatcher = createPathMatcher();
    private final SettingConfigGetter settingConfigGetter;
    private final CaptchaManager captchaManager;
    private final CaptchaCookieResolverImpl captchaCookieResolver;

    @Override
    @NonNull
    public Mono<Void> filter(@NonNull ServerWebExchange exchange, @NonNull WebFilterChain chain) {
        return pathMatcher.matches(exchange)
                .filter(ServerWebExchangeMatcher.MatchResult::isMatch)
                .flatMap(result -> settingConfigGetter.getSecurityConfig())
                .flatMap(securityConfig -> handleCaptcha(exchange, securityConfig))
                .defaultIfEmpty(true)
                .flatMap(allowed -> allowed ? chain.filter(exchange) : Mono.empty());
    }

    private Mono<Boolean> handleCaptcha(ServerWebExchange exchange, SettingConfigGetter.SecurityConfig securityConfig) {
        var captchaRequired = securityConfig.anonymousCommentCaptcha();
        if (!captchaRequired) {
            return Mono.just(true);
        }
        var captchaCodeOpt = getCaptchaCode(exchange);
        var captchaId = captchaCookieResolver.resolveCookie(exchange);
        if (captchaCodeOpt.isEmpty() || captchaId == null) {
            return captchaRequiredResponse(exchange)
                    .thenReturn(false);
        }
        return captchaManager.verify(captchaId.getValue(), captchaCodeOpt.get())
                .flatMap(valid -> {
                    if (!valid) {
                        exchange.getResponse().getHeaders().add(CAPTCHA_REQUIRED_HEADER, "true");
                        captchaCookieResolver.expireCookie(exchange);
                        return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "验证码不正确"));
                    }
                    captchaCookieResolver.expireCookie(exchange);
                    return Mono.empty();
                })
                .thenReturn(true);
    }

    private Mono<Void> captchaRequiredResponse(ServerWebExchange exchange) {
        exchange.getResponse().getHeaders().add(CAPTCHA_REQUIRED_HEADER, "true");
        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
        return captchaManager.generate()
                .flatMap(captcha -> {
                    var id = captcha.id();
                    captchaCookieResolver.setCookie(exchange, id);
                    var bytes = captcha.imageBase64().getBytes(StandardCharsets.UTF_8);
                    return exchange.getResponse()
                            .writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(bytes)));
                });
    }

    private static Optional<String> getCaptchaCode(ServerWebExchange exchange) {
        var captchaCode = exchange.getRequest().getHeaders().getFirst(CAPTCHA_CODE_HEADER);
        return Optional.ofNullable(captchaCode)
                .filter(StringUtils::isNotBlank);
    }

    private OrServerWebExchangeMatcher createPathMatcher() {
        var commentMatcher = pathMatchers(HttpMethod.POST, "/apis/api.halo.run/v1alpha1/comments");
        var replyMatcher = pathMatchers(HttpMethod.POST, "/apis/api.halo.run/v1alpha1/comments/{name}/reply");
        return new OrServerWebExchangeMatcher(commentMatcher, replyMatcher);
    }
}
