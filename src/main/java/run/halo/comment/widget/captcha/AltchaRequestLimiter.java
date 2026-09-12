package run.halo.comment.widget.captcha;

import com.google.common.base.Ticker;
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import java.time.Duration;

/** Bounded per-client budgets, checked before the shared safety budget. */
final class AltchaRequestLimiter {
    private static final int CLIENT_LIMIT = 5;
    private static final int GLOBAL_LIMIT = 50;
    private static final long WINDOW_NANOS = Duration.ofSeconds(1).toNanos();
    private final Ticker ticker;
    private final int clientLimit;
    private final int globalLimit;
    private final Cache<String, Window> clients;
    private final Window global = new Window();

    AltchaRequestLimiter(Ticker ticker) {
        this(ticker, CLIENT_LIMIT, GLOBAL_LIMIT);
    }

    AltchaRequestLimiter(Ticker ticker, int clientLimit, int globalLimit) {
        this.ticker = ticker;
        this.clientLimit = clientLimit;
        this.globalLimit = globalLimit;
        clients = CacheBuilder.newBuilder().maximumSize(10_000)
            .expireAfterAccess(Duration.ofSeconds(10)).ticker(ticker).build();
    }

    synchronized boolean tryAcquire(String client) {
        long now = ticker.read();
        var window = clients.getIfPresent(client);
        if (window == null) {
            window = new Window();
            clients.put(client, window);
        }
        window.refresh(now);
        if (window.count >= clientLimit) {
            return false;
        }
        global.refresh(now);
        if (global.count >= globalLimit) {
            return false;
        }
        window.count++;
        global.count++;
        return true;
    }

    private static final class Window {
        private long started;
        private int count;

        void refresh(long now) {
            if (count == 0 || now - started >= WINDOW_NANOS) {
                started = now;
                count = 0;
            }
        }
    }
}
