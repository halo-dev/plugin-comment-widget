package run.halo.comment.widget;

import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import java.time.Clock;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

/** Bounded registry: never evict an active bucket to admit a fresh identity. */
@Component
public class RateLimiterKeyRegistry {

    static final int MAX_KEYS = 10_000;
    static final long IDLE_MILLIS = Duration.ofMinutes(10).toMillis();
    private final Map<String, Long> keys = new HashMap<>();
    private final Clock clock;
    private long nextCleanup;

    public RateLimiterKeyRegistry() {
        this(Clock.systemUTC());
    }

    RateLimiterKeyRegistry(Clock clock) {
        this.clock = clock;
    }

    public synchronized RateLimiter acquire(RateLimiterRegistry registry, String key) {
        long now = clock.millis();
        if (now >= nextCleanup) {
            removeIdleKeys(registry, now);
            nextCleanup = now + Duration.ofMinutes(1).toMillis();
        }
        if (!keys.containsKey(key) && keys.size() >= MAX_KEYS) {
            throw new RateLimitExceededException(null);
        }
        keys.put(key, now);
        return registry.rateLimiter(
            key,
            RateLimiterConfig.custom()
                .limitForPeriod(10)
                .limitRefreshPeriod(Duration.ofMinutes(1))
                .timeoutDuration(Duration.ZERO)
                .build()
        );
    }

    public synchronized Set<String> getAllKeys() {
        return Set.copyOf(keys.keySet());
    }

    public synchronized void clear() {
        keys.clear();
        nextCleanup = 0;
    }

    private void removeIdleKeys(RateLimiterRegistry registry, long now) {
        keys.entrySet().removeIf(entry -> removeIfIdle(registry, now, entry));
    }

    private boolean removeIfIdle(
        RateLimiterRegistry registry,
        long now,
        Map.Entry<String, Long> entry
    ) {
        if (now - entry.getValue() < IDLE_MILLIS) {
            return false;
        }
        registry.remove(entry.getKey());
        return true;
    }
}
