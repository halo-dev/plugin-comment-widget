package run.halo.comment.widget;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import java.time.Clock;
import org.junit.jupiter.api.Test;

class RateLimiterKeyRegistryTest {

    @Test
    void doesNotResetAnActiveBucketAndPurgesIdleBuckets() {
        var clock = mock(Clock.class);
        when(clock.millis()).thenReturn(0L);
        var keys = new RateLimiterKeyRegistry(clock);
        var registry = RateLimiterRegistry.ofDefaults();
        var limiter = keys.acquire(registry, "a");
        for (int i = 0; i < 10; i++) {
            assertThat(limiter.acquirePermission()).isTrue();
        }
        assertThat(keys.acquire(registry, "a").acquirePermission()).isFalse();
        when(clock.millis()).thenReturn(RateLimiterKeyRegistry.IDLE_MILLIS + 1);
        keys.acquire(registry, "b");
        assertThat(registry.find("a")).isEmpty();
        assertThat(keys.getAllKeys()).containsExactly("b");
    }

    @Test
    void refusesNewIdentitiesAtCapacityWithoutEvictingActiveOnes() {
        var keys = new RateLimiterKeyRegistry();
        var registry = RateLimiterRegistry.ofDefaults();
        for (int i = 0; i < RateLimiterKeyRegistry.MAX_KEYS; i++) {
            keys.acquire(registry, "ip" + i);
        }
        assertThatThrownBy(() -> keys.acquire(registry, "extra")).isInstanceOf(
            RateLimitExceededException.class
        );
        assertThat(keys.getAllKeys()).hasSize(RateLimiterKeyRegistry.MAX_KEYS);
        assertThat(keys.acquire(registry, "ip0")).isSameAs(registry.find("ip0").orElseThrow());
    }
}
