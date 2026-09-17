package run.halo.comment.widget.captcha;

import static org.assertj.core.api.Assertions.assertThat;

import com.google.common.base.Ticker;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.Test;

class AltchaRequestLimiterTest {
    @Test
    void isolatesClientsAndRetainsAGlobalCap() {
        var nanos = new AtomicLong();
        var limiter = new AltchaRequestLimiter(new Ticker() {
            @Override
            public long read() {
                return nanos.get();
            }
        });
        for (int i = 0; i < 5; i++) {
            assertThat(limiter.tryAcquire("client-a")).isTrue();
        }
        for (int i = 0; i < 100; i++) {
            assertThat(limiter.tryAcquire("client-a")).isFalse();
        }
        for (int i = 0; i < 45; i++) {
            assertThat(limiter.tryAcquire("client-" + i)).isTrue();
        }
        assertThat(limiter.tryAcquire("another-client")).isFalse();
        nanos.set(Duration.ofSeconds(1).toNanos());
        assertThat(limiter.tryAcquire("client-a")).isTrue();
        assertThat(limiter.tryAcquire("another-client")).isTrue();
    }
}
