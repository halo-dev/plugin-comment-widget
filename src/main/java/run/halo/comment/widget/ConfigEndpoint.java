package run.halo.comment.widget;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
import run.halo.comment.widget.captcha.CaptchaRequirement;

@Component
@RequiredArgsConstructor
public class ConfigEndpoint implements CustomEndpoint {

    private final ReactiveExtensionClient client;

    private final PluginContext context;

    private final SettingConfigGetter settingConfigGetter;

    private final CaptchaRequirement captchaRequirement;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public RouterFunction<ServerResponse> endpoint() {
        return RouterFunctions.route()
                .GET("config", this::getConfig)
                .build();
    }

    private Mono<ServerResponse> getConfig(ServerRequest request) {
        var required = settingConfigGetter.getSecurityConfig()
            .flatMap(config -> captchaRequirement.isRequired(config.getCaptcha()));
        return client.fetch(ConfigMap.class, context.getConfigMapName())
            .map(this::toConfigData)
            .zipWith(required, (rootNode, captchaRequired) -> {
                rootNode.put("captchaRequired", captchaRequired);
                return rootNode;
            })
            .flatMap(this::createConfigResponse);
    }

    private Mono<ServerResponse> createConfigResponse(ObjectNode rootNode) {
        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .cacheControl(CacheControl.noStore().cachePrivate())
            .headers(headers -> headers.setVary(
                List.of(HttpHeaders.COOKIE, HttpHeaders.AUTHORIZATION)))
            .bodyValue(rootNode.toString());
    }

    private ObjectNode toConfigData(ConfigMap configMap) {
        ObjectNode rootNode = objectMapper.createObjectNode();
        Map<String, String> data = configMap.getData();
        if (data == null) {
            return rootNode;
        }
        data.forEach((key, value) -> {
            try {
                JsonNode jsonNode = objectMapper.readTree(value);
                rootNode.set(key, jsonNode);
            } catch (Exception e) {
                rootNode.put(key, value);
            }
        });
        return rootNode;
    }

    @Override
    public GroupVersion groupVersion() {
        return GroupVersion.parseAPIVersion("api.commentwidget.halo.run/v1alpha1");
    }
}
