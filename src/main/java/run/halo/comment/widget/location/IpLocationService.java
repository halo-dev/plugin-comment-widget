package run.halo.comment.widget.location;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import run.halo.app.core.extension.content.Comment;
import run.halo.app.core.extension.content.Reply;
import run.halo.app.extension.AbstractExtension;
import run.halo.app.extension.ConfigMap;
import run.halo.app.extension.ExtensionClient;
import run.halo.app.extension.MetadataUtil;
import run.halo.app.plugin.PluginContext;
import run.halo.comment.widget.SettingConfigGetter.BasicConfig;

@Component
@RequiredArgsConstructor
public class IpLocationService {

    public static final String ANNOTATION = "commentwidget.halo.run/ip-location";
    private final ExtensionClient client;
    private final PluginContext context;
    private final IpLocationResolver resolver;
    private final ObjectMapper mapper = new ObjectMapper();

    boolean isEnabled() {
        // Read the current ConfigMap: its controller may run before the settings cache refreshes.
        return client.fetch(ConfigMap.class, context.getConfigMapName())
            .map(ConfigMap::getData)
            .map(data -> data.get(BasicConfig.GROUP))
            .map(this::enabled)
            .orElse(false);
    }

    private boolean enabled(String basic) {
        try {
            return mapper.readTree(basic).path("showIpLocation").asBoolean(false);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Cannot read IP location settings", e);
        }
    }

    void reconcileComment(String name) {
        reconcile(Comment.class, name, comment -> comment.getSpec().getIpAddress());
    }

    void reconcileReply(String name) {
        reconcile(Reply.class, name, reply -> reply.getSpec().getIpAddress());
    }

    private <E extends AbstractExtension> void reconcile(Class<E> type, String name,
        Function<E, String> ipAddress) {
        if (!isEnabled()) {
            return;
        }
        client.fetch(type, name).ifPresent(target -> {
            if (target.getMetadata().getDeletionTimestamp() != null
                || target.getMetadata().getAnnotations() != null
                && target.getMetadata().getAnnotations().containsKey(ANNOTATION)) {
                return;
            }
            var location = resolver.resolve(ipAddress.apply(target));
            if (!location.isEmpty() && isEnabled()) {
                MetadataUtil.nullSafeAnnotations(target).put(ANNOTATION, location);
                // Version conflicts are retried by the controller with a fresh read.
                client.update(target);
            }
        });
    }
}
