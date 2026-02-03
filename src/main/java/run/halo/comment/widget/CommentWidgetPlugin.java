package run.halo.comment.widget;

import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import org.springframework.stereotype.Component;
import run.halo.app.plugin.BasePlugin;
import run.halo.app.plugin.PluginContext;

/**
 * @author ryanwang
 * @since 2.0.0
 */
@Component
public class CommentWidgetPlugin extends BasePlugin {
    
    private final RateLimiterRegistry rateLimiterRegistry;
    private final RateLimiterKeyRegistry rateLimiterKeyRegistry;
    
    public CommentWidgetPlugin(PluginContext pluginContext,
        RateLimiterRegistry rateLimiterRegistry,
        RateLimiterKeyRegistry rateLimiterKeyRegistry) {
        super(pluginContext);
        this.rateLimiterRegistry = rateLimiterRegistry;
        this.rateLimiterKeyRegistry = rateLimiterKeyRegistry;
    }
    
    @Override
    public void stop() {
        rateLimiterKeyRegistry.getAllKeys().forEach(rateLimiterRegistry::remove);
        rateLimiterKeyRegistry.clear();
    }
}
