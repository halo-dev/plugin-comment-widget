package run.halo.comment.widget;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/**
 * Throttler Key Registry, used for recording and managing all created throttler keys.
 */
@Component
public class RateLimiterKeyRegistry {
    
    /**
     * Store all created throttler keys.
     */
    private final Set<String> rateLimiterKeys = ConcurrentHashMap.newKeySet();
    
    /**
     * Register throttler key.
     *
     * @param key throttler key
     */
    public void register(String key) {
        rateLimiterKeys.add(key);
    }
    
    /**
     * Get all registered throttler keys.
     *
     * @return throttler keys
     */
    public Set<String> getAllKeys() {
        return rateLimiterKeys;
    }
    
    /**
     * Clear all registered throttler keys.
     */
    public void clear() {
        rateLimiterKeys.clear();
    }
}

