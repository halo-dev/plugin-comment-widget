package run.halo.comment.widget.captcha;

import com.google.common.base.Ticker;
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import java.time.Duration;
import java.util.Base64;
import org.altcha.altcha.v2.Altcha;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/** Local, single-use ALTCHA challenges. Restarting the plugin invalidates outstanding challenges. */
@Component
public class AltchaService {
    private final String secret = Base64.getEncoder().encodeToString(Altcha.randomBytes(32));
    private final Cache<String, Altcha.Challenge> challenges;
    private final Altcha.KeyDerivationFunction verifier;

    public AltchaService() {
        this(Ticker.systemTicker());
    }

    AltchaService(Ticker ticker) {
        this(ticker, Altcha.kdf("PBKDF2/SHA-256"));
    }

    AltchaService(Ticker ticker, Altcha.KeyDerivationFunction verifier) {
        this.verifier = verifier;
        challenges = CacheBuilder.newBuilder().maximumSize(1000)
            .expireAfterWrite(Duration.ofMinutes(5)).ticker(ticker).build();
    }

    public Mono<Altcha.Challenge> createChallenge() {
        return Mono.fromCallable(() -> {
            var challenge = Altcha.createChallenge(new Altcha.CreateChallengeOptions()
                .algorithm("PBKDF2/SHA-256").cost(5000)
                .hmacSignatureSecret(secret).expiresInSeconds(300));
            challenges.put(challenge.signature(), challenge);
            return challenge;
        }).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<Boolean> verify(String token) {
        if (token == null || token.isBlank()) {
            return Mono.just(false);
        }
        if (token.length() > 8192) {
            return Mono.just(false);
        }
        return Mono.fromCallable(() -> verifyPayload(token))
            .subscribeOn(Schedulers.boundedElastic());
    }

    private boolean verifyPayload(String token) {
        try {
            var payload = Altcha.parsePayload(token);
            var submitted = payload.challenge();
            if (submitted.signature() == null) {
                return false;
            }
            var issued = challenges.getIfPresent(submitted.signature());
            if (issued == null) {
                return false;
            }
            // Check against our issued parameters before allowing any client-controlled KDF work.
            if (!issued.equals(submitted)) {
                return false;
            }
            // Claim the single attempt before expensive work, including invalid solutions.
            if (!challenges.asMap().remove(issued.signature(), issued)) {
                return false;
            }
            var result = Altcha.verifySolution(issued, payload.solution(), secret,
                verifier);
            return result.verified();
        } catch (Exception invalidPayload) {
            // Malformed payloads fail closed; never log submitted tokens.
            return false;
        }
    }
}
