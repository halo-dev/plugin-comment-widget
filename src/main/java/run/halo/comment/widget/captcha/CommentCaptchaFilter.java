package run.halo.comment.widget.captcha;

import static org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers.pathMatchers;

import java.net.URI;
import java.util.Locale;
import java.util.Optional;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.http.converter.json.ProblemDetailJacksonMixin;
import org.springframework.lang.NonNull;
import org.springframework.security.web.server.util.matcher.OrServerWebExchangeMatcher;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import run.halo.app.security.AfterSecurityWebFilter;
import run.halo.comment.widget.SettingConfigGetter;

@Component
@RequiredArgsConstructor
public class CommentCaptchaFilter implements AfterSecurityWebFilter {
    static final String CAPTCHA_INVALID_TYPE = "https://www.halo.run/probs/captcha-invalid";
    static final String CAPTCHA_REQUIRED_TYPE = "https://www.halo.run/probs/captcha-required";
    private final static String CAPTCHA_CODE_HEADER = "X-Captcha-Code";
    private final static String CAPTCHA_REQUIRED_HEADER = "X-Require-Captcha";
    private static final String CONTENT_TYPE = "application/problem+json";

    private final ServerWebExchangeMatcher pathMatcher = createPathMatcher();
    private final ObjectMapper objectMapper = createObjectMapper();

    private final SettingConfigGetter settingConfigGetter;
    private final CaptchaManager captchaManager;
    private final TurnstileVerifier turnstileVerifier;
    private final AltchaService altchaService;
    private final CaptchaCookieResolverImpl captchaCookieResolver;
    private final CaptchaRequirement captchaRequirement;

    @Override
    @NonNull
    public Mono<Void> filter(@NonNull ServerWebExchange exchange, @NonNull WebFilterChain chain) {
        return pathMatcher.matches(exchange)
            .flatMap(match -> {
                if (!match.isMatch()) {
                    return chain.filter(exchange);
                }
                return filterCommentSubmission(exchange, chain);
            });
    }

    private Mono<Void> filterCommentSubmission(ServerWebExchange exchange, WebFilterChain chain) {
        return settingConfigGetter.getSecurityConfig()
            .map(SettingConfigGetter.SecurityConfig::getCaptcha)
            .flatMap(config -> captchaRequirement.isRequired(config)
                .flatMap(required -> {
                    if (!required) {
                        return chain.filter(exchange);
                    }
                    if (config.getType() == CaptchaType.ALTCHA) {
                        return altchaService.verify(exchange.getRequest().getHeaders().getFirst("X-Altcha-Payload"))
                            .flatMap(valid -> {
                                if (valid) {
                                    return chain.filter(exchange);
                                }
                                return sendAltchaRequiredResponse(exchange);
                            });
                    }
                    if (config.getType() == CaptchaType.TURNSTILE) {
                        return validateTurnstile(exchange, chain, config);
                    }
                    return validateCaptcha(exchange, chain, config);
                }));
    }

    private Mono<Void> validateTurnstile(ServerWebExchange exchange, WebFilterChain chain,
                                          SettingConfigGetter.CaptchaConfig config) {
        return turnstileVerifier.verify(
                exchange.getRequest().getHeaders().getFirst("X-Turnstile-Token"), config)
            .flatMap(result -> {
                if (result == TurnstileVerifier.Result.VALID) {
                    return chain.filter(exchange);
                }
                return sendTurnstileRequiredResponse(exchange, result);
            });
    }

    private Mono<Void> sendAltchaRequiredResponse(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
        addHeaderIfAbsent(exchange.getResponse().getHeaders(), CAPTCHA_REQUIRED_HEADER, "true");
        addHeaderIfAbsent(exchange.getResponse().getHeaders(), HttpHeaders.CONTENT_TYPE, CONTENT_TYPE);
        var problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN,
            "人机验证未通过，请重新验证后提交");
        problem.setType(URI.create(CAPTCHA_INVALID_TYPE));
        problem.setTitle("ALTCHA Verification");
        return exchange.getResponse().writeWith(Mono.just(
            exchange.getResponse().bufferFactory().wrap(getResponseData(problem))));
    }

    private Mono<Void> sendTurnstileRequiredResponse(ServerWebExchange exchange,
                                                       TurnstileVerifier.Result result) {
        var status = HttpStatus.FORBIDDEN;
        var detail = "人机验证未通过，请重新验证后提交";
        var problemType = CAPTCHA_INVALID_TYPE;
        if (result == TurnstileVerifier.Result.CONFIGURATION_ERROR) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            detail = "人机验证配置异常，请联系站点管理员";
            problemType = "https://www.halo.run/probs/captcha-configuration-error";
        } else if (result == TurnstileVerifier.Result.UNAVAILABLE) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            detail = "人机验证服务暂不可用，请稍后重试";
            problemType = "https://www.halo.run/probs/captcha-unavailable";
        }
        exchange.getResponse().setStatusCode(status);
        addHeaderIfAbsent(exchange.getResponse().getHeaders(), CAPTCHA_REQUIRED_HEADER, "true");
        addHeaderIfAbsent(exchange.getResponse().getHeaders(), HttpHeaders.CONTENT_TYPE, CONTENT_TYPE);
        var problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setType(URI.create(problemType));
        problem.setTitle("Turnstile Verification");
        var bytes = getResponseData(problem);
        return exchange.getResponse().writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(bytes)));
    }

    private Mono<Void> sendCaptchaRequiredResponse(ServerWebExchange exchange,
                                                   SettingConfigGetter.CaptchaConfig captchaConfig,
                                                   ResponseStatusException e) {
        addHeaderIfAbsent(exchange.getResponse().getHeaders(), CAPTCHA_REQUIRED_HEADER, Boolean.TRUE.toString());
        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
        return captchaManager.generate(exchange, captchaConfig)
            .flatMap(captcha -> {
                var problemDetail = toProblemDetail(e);
                problemDetail.setProperty("captcha", captcha.imageBase64());
                var responseData = getResponseData(problemDetail);
                addHeaderIfAbsent(exchange.getResponse().getHeaders(), HttpHeaders.CONTENT_TYPE, CONTENT_TYPE);
                return exchange.getResponse()
                    .writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(responseData)));
            });
    }

    private byte[] getResponseData(ProblemDetail problemDetail) {
        try {
            return objectMapper.writeValueAsBytes(problemDetail);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    private Mono<Void> validateCaptcha(ServerWebExchange exchange, WebFilterChain chain,
                                       SettingConfigGetter.CaptchaConfig captchaConfig) {
        var captchaCodeOpt = getCaptchaCode(exchange);
        var cookie = captchaCookieResolver.resolveCookie(exchange);
        if (captchaCodeOpt.isEmpty()) {
            return sendCaptchaRequiredResponse(exchange, captchaConfig, new CaptchaCodeMissingException());
        }
        if (cookie == null) {
            return sendCaptchaRequiredResponse(exchange, captchaConfig, new CaptchaCodeMissingException());
        }
        return captchaManager.verify(cookie.getValue(), captchaCodeOpt.get(), captchaConfig.isIgnoreCase())
            .flatMap(valid -> {
                if (valid) {
                    captchaCookieResolver.expireCookie(exchange);
                    return chain.filter(exchange);
                }
                return sendCaptchaRequiredResponse(exchange, captchaConfig, new InvalidCaptchaCodeException());
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

    static class InvalidCaptchaCodeException extends ResponseStatusException {
        public InvalidCaptchaCodeException() {
            super(HttpStatus.FORBIDDEN, "验证码错误，请重新输入");
            setType(URI.create(CAPTCHA_INVALID_TYPE));
        }
    }

    static class CaptchaCodeMissingException extends ResponseStatusException {
        public CaptchaCodeMissingException() {
            super(HttpStatus.FORBIDDEN, "请先输入验证码");
            setType(URI.create(CAPTCHA_REQUIRED_TYPE));
        }
    }

    ProblemDetail toProblemDetail(ResponseStatusException e) {
        var problemDetail = e.updateAndGetBody(null, Locale.getDefault());
        problemDetail.setTitle("Captcha Verification");
        return problemDetail;
    }

    static ObjectMapper createObjectMapper() {
        return Jackson2ObjectMapperBuilder.json()
            .mixIn(ProblemDetail.class, ProblemDetailJacksonMixin.class)
            .build();
    }

    /**
     * Adds a header to the HttpHeaders if it is not already present. Only for forward-compatibility with Spring Framework 7.
     *
     * @param headers     the HttpHeaders to add the header to
     * @param headerName  the name of the header
     * @param headerValue the value of the header
     */
    private static void addHeaderIfAbsent(HttpHeaders headers, String headerName, String headerValue) {
        if (headers.getFirst(headerName) == null) {
            headers.add(headerName, headerValue);
        }
    }
}
