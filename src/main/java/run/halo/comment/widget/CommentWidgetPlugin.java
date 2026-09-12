package run.halo.comment.widget;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import org.springframework.stereotype.Component;
import run.halo.app.extension.ConfigMap;
import run.halo.app.extension.ExtensionClient;
import run.halo.app.extension.GroupVersionKind;
import run.halo.app.extension.SchemeManager;
import run.halo.app.extension.index.IndexSpecs;
import run.halo.app.plugin.BasePlugin;
import run.halo.app.plugin.PluginContext;
import run.halo.comment.widget.SettingConfigGetter.CaptchaConfig.CaptchaAudience;
import run.halo.comment.widget.upload.CommentSubmission;
import run.halo.comment.widget.upload.CommentUpload;
import run.halo.comment.widget.upload.UploadReferences;

/**
 * @author ryanwang
 * @since 2.0.0
 */
@Component
public class CommentWidgetPlugin extends BasePlugin {

    private final PluginContext context;
    private final ExtensionClient client;
    private final SchemeManager schemeManager;
    private final RateLimiterRegistry rateLimiterRegistry;
    private final RateLimiterKeyRegistry rateLimiterKeyRegistry;

    public CommentWidgetPlugin(
        PluginContext pluginContext,
        RateLimiterRegistry rateLimiterRegistry,
        RateLimiterKeyRegistry rateLimiterKeyRegistry,
        SchemeManager schemeManager,
        ExtensionClient client
    ) {
        super(pluginContext);
        this.context = pluginContext;
        this.client = client;
        this.schemeManager = schemeManager;
        this.rateLimiterRegistry = rateLimiterRegistry;
        this.rateLimiterKeyRegistry = rateLimiterKeyRegistry;
    }

    @Override
    public void start() {
        migrateSettings();
        // A hot reload may leave a scheme from an older plugin class loader.
        schemeManager
            .fetch(new GroupVersionKind("commentwidget.halo.run", "v1alpha1", "CommentUpload"))
            .filter(scheme -> scheme.type() != CommentUpload.class)
            .ifPresent(schemeManager::unregister);
        schemeManager
            .fetch(new GroupVersionKind("commentwidget.halo.run", "v1alpha1", "CommentSubmission"))
            .filter(scheme -> scheme.type() != CommentSubmission.class)
            .ifPresent(schemeManager::unregister);
        schemeManager.register(CommentUpload.class, specs -> {
            specs.add(
                IndexSpecs.<CommentUpload, String>single("credentialHash", String.class).indexFunc(
                    u -> u.getSpec().getCredentialHash()
                )
            );
            specs.add(
                IndexSpecs.<CommentUpload, String>single("uploadUrl", String.class).indexFunc(u ->
                    UploadReferences.canonical(u.getSpec().getUrl())
                )
            );
        });
        schemeManager.register(CommentSubmission.class, specs ->
            specs.add(
                IndexSpecs.<CommentSubmission, String>single(
                    "credentialHash",
                    String.class
                ).indexFunc(s -> s.getSpec().getCredentialHash())
            )
        );
    }

    @Override
    public void stop() {
        rateLimiterKeyRegistry.getAllKeys().forEach(rateLimiterRegistry::remove);
        rateLimiterKeyRegistry.clear();
        schemeManager
            .fetch(new GroupVersionKind("commentwidget.halo.run", "v1alpha1", "CommentUpload"))
            .ifPresent(schemeManager::unregister);
        schemeManager
            .fetch(new GroupVersionKind("commentwidget.halo.run", "v1alpha1", "CommentSubmission"))
            .ifPresent(schemeManager::unregister);
    }
    private void migrateSettings() {
        client.fetch(ConfigMap.class, context.getConfigMapName()).ifPresent(config -> {
            if (config.getData() == null) {
                return;
            }
            if (!config.getData().containsKey("security")) {
                return;
            }
            var security = config.getData().get("security");
            var migrated = migrateCaptchaSettings(security);
            if (security.equals(migrated)) {
                return;
            }
            config.getData().put("security", migrated);
            client.update(config);
        });
    }

    static String migrateCaptchaSettings(String security) {
        try {
            var mapper = new ObjectMapper();
            var root = mapper.readTree(security);
            if (!(root.path("captcha") instanceof ObjectNode captcha)) {
                return security;
            }
            if (captcha.has("audience")) {
                return security;
            }
            var anonymous = captcha.path("anonymousCommentCaptcha").asBoolean(false);
            var authenticated = captcha.path("authenticatedCommentCaptcha").asBoolean(false);
            captcha.put("enable", anonymous);
            if (authenticated) {
                captcha.put("enable", true);
            }
            var audience = resolveLegacyAudience(anonymous, authenticated);
            captcha.put("audience", audience.name());
            var roles = captcha.putArray("roles");
            if (audience == CaptchaAudience.ROLES) {
                roles.add("authenticated");
            }
            captcha.remove("anonymousCommentCaptcha");
            captcha.remove("authenticatedCommentCaptcha");
            return mapper.writeValueAsString(root);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("Cannot migrate captcha settings", e);
        }
    }

    private static CaptchaAudience resolveLegacyAudience(boolean anonymous, boolean authenticated) {
        if (!authenticated) {
            return CaptchaAudience.ANONYMOUS;
        }
        if (anonymous) {
            return CaptchaAudience.ALL;
        }
        return CaptchaAudience.ROLES;
    }

}
