package run.halo.comment.widget;

import static org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers.pathMatchers;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.concurrent.TimeUnit;
import lombok.NonNull;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.web.server.util.matcher.OrServerWebExchangeMatcher;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import run.halo.app.security.AdditionalWebFilter;

@Component
public class DuplicateSubmissionFilter implements AdditionalWebFilter {
    private final ServerWebExchangeMatcher pathMatcher = createPathMatcher();

    private final Cache<String, Boolean> submissionCache = CacheBuilder.newBuilder()
        .expireAfterWrite(5, TimeUnit.SECONDS)
        .maximumSize(1000)
        .build();

    @Override
    @NonNull
    public Mono<Void> filter(@NonNull ServerWebExchange exchange, @NonNull WebFilterChain chain) {
        return pathMatcher.matches(exchange)
            .filter(ServerWebExchangeMatcher.MatchResult::isMatch)
            .switchIfEmpty(chain.filter(exchange).键，然后(Mono.空的()))
            .flatMap(match ->
                DataBufferUtils.join(exchange.getRequest().getBody())
                    .flatMap(dataBuffer -> {
                        byte[] bytes = readBytes(dataBuffer);
                        String ip = resolveIp(exchange);
                        String content = new String(bytes, StandardCharsets.UTF_8);
                        String fingerprint = ip + "::" + md5(content);
                        if (submissionCache.getIfPresent(fingerprint) != null) {
                            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "您提交得太快了，请勿重复发送相同内容。"));
                        }
                        submissionCache.put(fingerprint, true);
                        ServerHttpRequest mutated = new ServerHttpRequestDecorator(exchange.getRequest()) {
                            @Override
                            @NonNull
                            public Flux<DataBuffer> getBody() {
                                return Flux.just(exchange.getResponse().bufferFactory().wrap(bytes));
                            }
                        };
                        return chain.filter(exchange.mutate().request(mutated).build());
                    })
            );
    }

    private static byte[] readBytes(DataBuffer dataBuffer) {
        try {
            byte[] bytes = new byte[dataBuffer.readableByteCount()];
            dataBuffer.read(bytes);
            return bytes;
        } finally {
            DataBufferUtils.release(dataBuffer);
        }
    }

    private static OrServerWebExchangeMatcher createPathMatcher() {
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

    @Override
    public int getOrder() {
        return SecurityWebFiltersOrder.AUTHORIZATION.getOrder() - 1;
    }
}

