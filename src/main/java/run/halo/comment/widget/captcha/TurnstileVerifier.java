package run.halo.comment.widget.captcha;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import run.halo.app.extension.ReactiveExtensionClient;
import run.halo.app.extension.Secret;
import run.halo.comment.widget.SettingConfigGetter;

@Slf4j
@Component
public class TurnstileVerifier {
    private static final String TEST_SECRET = "1x0000000000000000000000000000000AA";
    private static final Set<String> KNOWN_ERROR_CODES = Set.of("missing-input-secret",
        "invalid-input-secret", "missing-input-response", "invalid-input-response",
        "bad-request", "timeout-or-duplicate", "internal-error");
    private final ReactiveExtensionClient client;
    private final WebClient webClient;

    public enum Result {
        VALID, INVALID, CONFIGURATION_ERROR, UNAVAILABLE
    }

    @Autowired
    public TurnstileVerifier(ReactiveExtensionClient client) {
        this(client, WebClient.builder().baseUrl("https://challenges.cloudflare.com")
            .codecs(codecs -> codecs.defaultCodecs().maxInMemorySize(16 * 1024)).build());
    }

    TurnstileVerifier(ReactiveExtensionClient client, WebClient webClient) {
        this.client = client;
        this.webClient = webClient;
    }

    record VerificationResponse(Boolean success, String action,
                                @JsonProperty("error-codes") List<String> errorCodes) {}

    private String secretKey(Secret secret) {
        if (secret.getStringData() != null) {
            var value = secret.getStringData().get("secretKey");
            if (StringUtils.isNotBlank(value)) {
                return value;
            }
        }
        if (secret.getData() == null) {
            return null;
        }
        var bytes = secret.getData().get("secretKey");
        if (bytes == null) {
            return null;
        }
        return new String(bytes, StandardCharsets.UTF_8);
    }

    public Mono<Result> verify(String token, SettingConfigGetter.CaptchaConfig config) {
        if (StringUtils.isBlank(token)) {
            return Mono.just(Result.INVALID);
        }
        if (token.length() > 2048) {
            return Mono.just(Result.INVALID);
        }
        if (StringUtils.isBlank(config.getTurnstileSiteKey())) {
            return Mono.just(configurationError("Site Key is missing"));
        }
        if (StringUtils.isBlank(config.getTurnstileSecretRef())) {
            return Mono.just(configurationError("Secret reference is missing"));
        }
        return client.fetch(Secret.class, config.getTurnstileSecretRef())
            .mapNotNull(this::secretKey)
            .filter(StringUtils::isNotBlank)
            .flatMap(secret -> verifyWithCloudflare(token, secret))
            .switchIfEmpty(Mono.fromSupplier(() -> configurationError("Secret or secretKey is missing")))
            .timeout(Duration.ofSeconds(10))
            .onErrorResume(error -> {
                // Never log exception messages or bodies: they may contain credentials or tokens.
                log.warn("Turnstile verification unavailable ({})", error.getClass().getSimpleName());
                return Mono.just(Result.UNAVAILABLE);
            });
    }

    private Result configurationError(String reason) {
        log.warn("Turnstile configuration error: {}", reason);
        return Result.CONFIGURATION_ERROR;
    }

    private Mono<Result> verifyWithCloudflare(String token, String secret) {
        return webClient.post().uri("/turnstile/v0/siteverify")
            .bodyValue(Map.of("secret", secret, "response", token))
            .retrieve().bodyToMono(VerificationResponse.class)
            .map(body -> verificationResult(body, secret))
            .switchIfEmpty(Mono.fromSupplier(() -> {
                log.warn("Turnstile verification returned an empty response");
                return Result.UNAVAILABLE;
            }));
    }

    private Result verificationResult(VerificationResponse body, String secret) {
        if (body.success() == null) {
            log.warn("Turnstile verification response is missing success");
            return Result.UNAVAILABLE;
        }
        if (!body.success()) {
            var codes = Set.<String>of();
            if (body.errorCodes() != null) {
                codes = body.errorCodes().stream().filter(KNOWN_ERROR_CODES::contains)
                    .collect(java.util.stream.Collectors.toSet());
            }
            // Only log known protocol codes, never arbitrary upstream response content.
            log.warn("Turnstile verification rejected; error codes: {}", codes);
            if (codes.contains("invalid-input-secret")) {
                return Result.CONFIGURATION_ERROR;
            }
            if (codes.contains("missing-input-secret")) {
                return Result.CONFIGURATION_ERROR;
            }
            if (codes.contains("internal-error")) {
                return Result.UNAVAILABLE;
            }
            return Result.INVALID;
        }
        if ("comment".equals(body.action())) {
            return Result.VALID;
        }
        // Official test keys may return a different action or omit it entirely.
        if (TEST_SECRET.equals(secret)) {
            return Result.VALID;
        }
        log.warn("Turnstile verification rejected: action mismatch");
        return Result.INVALID;
    }
}
