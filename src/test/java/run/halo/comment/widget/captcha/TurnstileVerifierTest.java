package run.halo.comment.widget.captcha;

import static run.halo.comment.widget.captcha.TurnstileVerifier.Result.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import run.halo.app.extension.ReactiveExtensionClient;
import run.halo.app.extension.Secret;
import run.halo.comment.widget.SettingConfigGetter;

@ExtendWith(OutputCaptureExtension.class)
class TurnstileVerifierTest {
    private final ReactiveExtensionClient client = mock(ReactiveExtensionClient.class);
    private final SettingConfigGetter.CaptchaConfig config = new SettingConfigGetter.CaptchaConfig()
        .setTurnstileSiteKey("site-key").setTurnstileSecretRef("turnstile");

    private TurnstileVerifier verifier(String response) {
        return new TurnstileVerifier(client, WebClient.builder().exchangeFunction(request -> {
            assertThat(request.url().getPath()).isEqualTo("/turnstile/v0/siteverify");
            return Mono.just(ClientResponse.create(HttpStatus.OK)
                .header("Content-Type", "application/json").body(response).build());
        }).build());
    }

    private void secret() {
        var secret = new Secret();
        secret.setStringData(Map.of("secretKey", "test-secret"));
        when(client.fetch(Secret.class, "turnstile")).thenReturn(Mono.just(secret));
    }

    @Test
    void requiresSuccessfulVerificationAndMatchingAction() {
        secret();
        assertThat(verifier("{\"success\":true,\"action\":\"comment\"}").verify("token", config).block()).isEqualTo(VALID);
        assertThat(verifier("{\"success\":false}").verify("token", config).block()).isEqualTo(INVALID);
        assertThat(verifier("{\"success\":true,\"action\":\"login\"}").verify("token", config).block()).isEqualTo(INVALID);
    }

    @Test
    void acceptsOfficialTestResponseOnlyWithOfficialTestSecret() {
        secret();
        assertThat(verifier("{\"success\":true,\"action\":\"test\"}").verify("token", config).block()).isEqualTo(INVALID);
        var secret = new Secret();
        secret.setData(Map.of("secretKey", "1x0000000000000000000000000000000AA".getBytes(StandardCharsets.UTF_8)));
        when(client.fetch(Secret.class, "turnstile")).thenReturn(Mono.just(secret));
        assertThat(verifier("{\"success\":true}").verify("token", config).block()).isEqualTo(VALID);
    }

    @Test
    void rejectsMissingAndOversizedTokensBeforeCallingCloudflare() {
        var verifier = verifier("{}");
        assertThat(verifier.verify(null, config).block()).isEqualTo(INVALID);
        assertThat(verifier.verify(" ", config).block()).isEqualTo(INVALID);
        assertThat(verifier.verify("x".repeat(2049), config).block()).isEqualTo(INVALID);
        verifyNoInteractions(client);
    }

    @Test
    void rejectsMissingSecretAndInvalidResponses() {
        when(client.fetch(Secret.class, "turnstile")).thenReturn(Mono.empty());
        assertThat(verifier("{}").verify("token", config).block()).isEqualTo(CONFIGURATION_ERROR);
        secret();
        assertThat(verifier("{}").verify("token", config).block()).isEqualTo(UNAVAILABLE);
        assertThat(verifier("invalid-json").verify("token", config).block()).isEqualTo(UNAVAILABLE);
    }

    @Test
    void failsClosedWhenCloudflareIsUnavailable() {
        secret();
        var verifier = new TurnstileVerifier(client, WebClient.builder()
            .exchangeFunction(request -> Mono.error(new IllegalStateException("offline"))).build());
        assertThat(verifier.verify("token", config).block()).isEqualTo(UNAVAILABLE);
    }

    @Test
    void distinguishesConfigurationAndServiceFailures() {
        secret();
        assertThat(verifier("{\"success\":false,\"error-codes\":[\"invalid-input-secret\"]}")
            .verify("token", config).block()).isEqualTo(CONFIGURATION_ERROR);
        assertThat(verifier("{\"success\":false,\"error-codes\":[\"internal-error\"]}")
            .verify("token", config).block()).isEqualTo(UNAVAILABLE);
        assertThat(verifier("{\"success\":false,\"error-codes\":[\"timeout-or-duplicate\"]}")
            .verify("token", config).block()).isEqualTo(INVALID);
        var missingKey = new Secret();
        missingKey.setStringData(Map.of("wrongKey", "private-value"));
        when(client.fetch(Secret.class, "turnstile")).thenReturn(Mono.just(missingKey));
        assertThat(verifier("{}").verify("token", config).block()).isEqualTo(CONFIGURATION_ERROR);
    }

    @Test
    void logsDiagnosticCodesWithoutSensitiveResponseContent(CapturedOutput output) {
        secret();
        verifier("{\"success\":false,\"error-codes\":[\"timeout-or-duplicate\",\"sensitive-upstream-value\"]}")
            .verify("private-token", config).block();
        var unavailable = new TurnstileVerifier(client, WebClient.builder()
            .exchangeFunction(request -> Mono.error(new IllegalStateException("private-token private-secret")))
            .build());
        unavailable.verify("private-token", config).block();
        assertThat(output.getAll()).contains("timeout-or-duplicate", "IllegalStateException")
            .doesNotContain("private-token", "private-secret", "sensitive-upstream-value", "test-secret");
    }

    @Test
    void rejectsIncompleteConfigurationBeforeLoadingSecret() {
        var verifier = verifier("{}");
        var missingSiteKey = new SettingConfigGetter.CaptchaConfig().setTurnstileSecretRef("turnstile");
        var missingSecretRef = new SettingConfigGetter.CaptchaConfig().setTurnstileSiteKey("site-key");
        assertThat(verifier.verify("token", missingSiteKey).block()).isEqualTo(CONFIGURATION_ERROR);
        assertThat(verifier.verify("token", missingSecretRef).block()).isEqualTo(CONFIGURATION_ERROR);
        verifyNoInteractions(client);
    }
}
