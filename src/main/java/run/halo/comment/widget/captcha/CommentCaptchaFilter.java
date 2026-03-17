package run.halo.comment.widget.captcha;

import static org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers.pathMatchers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.http.converter.json.ProblemDetailJacksonMixin;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.lang.NonNull;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.web.server.context.ServerSecurityContextRepository;
import org.springframework.security.web.server.util.matcher.OrServerWebExchangeMatcher;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import run.halo.app.infra.AnonymousUserConst;
import run.halo.app.security.AdditionalWebFilter;
import run.halo.comment.widget.SettingConfigGetter;

@Component
@RequiredArgsConstructor
public class CommentCaptchaFilter implements AdditionalWebFilter {
    static final String CAPTCHA_INVALID_TYPE = "https://www.halo.run/probs/captcha-invalid";
    static final String CAPTCHA_REQUIRED_TYPE = "https://www.halo.run/probs/captcha-required";
    private final static String CAPTCHA_CODE_HEADER = "X-Captcha-Code";
    private final static String CAPTCHA_REQUIRED_HEADER = "X-Require-Captcha";
    private static final String CONTENT_TYPE = "application/problem+json";

    private final ServerWebExchangeMatcher pathMatcher = createPathMatcher();
    private final ObjectMapper objectMapper = createObjectMapper();

    private final SettingConfigGetter settingConfigGetter;
    private final CaptchaManager captchaManager;
    private final CaptchaCookieResolverImpl captchaCookieResolver;
    private final ServerSecurityContextRepository contextRepository;

    private final Cache<String, Boolean> submissionCache = CacheBuilder.newBuilder()
        .expireAfterWrite(5, TimeUnit.SECONDS)
        .maximumSize(1000)
        .build();

    @Override
    @NonNull
    public Mono<Void> filter(@NonNull ServerWebExchange exchange, @NonNull WebFilterChain chain) {
        return pathMatcher.matches(exchange)
            .filter(ServerWebExchangeMatcher.MatchResult::isMatch)
            .switchIfEmpty(chain.filter(exchange).then(Mono.empty()))
            .flatMap(match -> processDuplicateAndCaptcha(exchange, chain));
    }

    private Mono<Void> processDuplicateAndCaptcha(ServerWebExchange exchange, WebFilterChain chain) {
        return DataBufferUtils.join(exchange.getRequest().getBody())
            .map(dataBuffer -> {
                byte[] bytes = new byte[dataBuffer.readableByteCount()];
                dataBuffer.read(bytes);
                DataBufferUtils.release(dataBuffer);
                return bytes;
            })
            .defaultIfEmpty(new byte[0])
            .flatMap(bytes -> {
                if (bytes.length > 0) {
                    String ip = resolveIp(exchange);
                    String content = new String(bytes, StandardCharsets.UTF_8);
                    String fingerprint = ip + "::" + md5(content);

                    if (submissionCache.getIfPresent(fingerprint) != null) {
                        return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "您提交得太快了，请勿重复发送相同内容。"));
                    }
                    submissionCache.put(fingerprint, true);
                }

                ServerHttpRequest mutatedRequest = new ServerHttpRequestDecorator(exchange.getRequest()) {
                    @Override
                    @NonNull
                    public Flux<DataBuffer> getBody() {
                        return bytes.length > 0 ?
                            Flux.just(exchange.getResponse().bufferFactory().wrap(bytes)) :
                            Flux.empty();
                    }
                };
                ServerWebExchange mutatedExchange = exchange.mutate().request(mutatedRequest).build();

                return handleCaptchaVerification(mutatedExchange, chain);
            });
    }

    private Mono<Void> handleCaptchaVerification(ServerWebExchange exchange, WebFilterChain chain) {
        return settingConfigGetter.getSecurityConfig()
            .map(SettingConfigGetter.SecurityConfig::getCaptcha)
            .filterWhen(captchaConfig -> isAnonymousCommenter(exchange))
            .switchIfEmpty(chain.filter(exchange).then(Mono.empty()))
            .flatMap(captchaConfig -> {
                if (!captchaConfig.isAnonymousCommentCaptcha()) {
                    return chain.filter(exchange);
                }
                return validateCaptcha(exchange, chain, captchaConfig);
            });
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
        if (captchaCodeOpt.isEmpty() || cookie == null) {
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

    private static String resolveIp(ServerWebExchange exchange) {
        var request = exchange.getRequest();
        String ip = request.getHeaders().getFirst("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            if (request.getRemoteAddress() != null) {
                ip = request.getRemoteAddress().getAddress().getHostAddress();
            }
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0];
        }
        return ip == null ? "unknown" : ip;
    }

    private static String md5(String content) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(content.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return String.valueOf(content.hashCode());
        }
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

    Mono<Boolean> isAnonymousCommenter(ServerWebExchange exchange) {
        return contextRepository.load(exchange)
            .map(context -> AnonymousUserConst.isAnonymousUser(context.getAuthentication().getName()))
            .defaultIfEmpty(true);
    }

    @Override
    public int getOrder() {
        return SecurityWebFiltersOrder.AUTHORIZATION.getOrder();
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
