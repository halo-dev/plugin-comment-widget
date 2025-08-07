package run.halo.comment.widget;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;
import run.halo.app.core.extension.endpoint.CustomEndpoint;
import run.halo.app.extension.ConfigMap;
import run.halo.app.extension.GroupVersion;
import run.halo.app.extension.ReactiveExtensionClient;
import run.halo.app.plugin.PluginContext;

@Component
@RequiredArgsConstructor
public class ConfigEndpoint implements CustomEndpoint {

    private final ReactiveExtensionClient client;

    private final PluginContext context;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public RouterFunction<ServerResponse> endpoint() {
        return RouterFunctions.route()
                .GET("config", this::getConfig)
                .build();
    }


    private Mono<ServerResponse> getConfig(ServerRequest request) {
        return client.fetch(ConfigMap.class, context.getConfigMapName())
                .flatMap(configMap -> {
                    Map<String, String> data = configMap.getData();
                    ObjectNode rootNode = objectMapper.createObjectNode();

                    data.forEach((key, value) -> {
                        try {
                            JsonNode jsonNode = objectMapper.readTree(value);
                            rootNode.set(key, jsonNode);
                        } catch (Exception e) {
                            rootNode.put(key, value);
                        }
                    });

                    return ServerResponse.ok().bodyValue(rootNode);
                });
    }

    @Override
    public GroupVersion groupVersion() {
        return GroupVersion.parseAPIVersion("api.commentwidget.halo.run/v1alpha1");
    }
}
