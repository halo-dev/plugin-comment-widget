package run.halo.comment.widget;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class CaptchaSettingsMigrationTest {
    @ParameterizedTest
    @CsvSource({
        "false,false,false,ANONYMOUS,",
        "true,false,true,ANONYMOUS,",
        "false,true,true,ROLES,authenticated",
        "true,true,true,ALL,"
    })
    void migratesLegacyFlags(boolean anonymous, boolean authenticated, boolean enabled,
                            String audience, String expectedRole) throws Exception {
        var original = """
            {
              "captcha": {
                "enable": false,
                "anonymousCommentCaptcha": %s,
                "authenticatedCommentCaptcha": %s,
                "type": "ARITHMETIC",
                "arithmeticRange": 50
              }
            }
            """.formatted(anonymous, authenticated);
        var migrated = CommentWidgetPlugin.migrateCaptchaSettings(original);
        var captcha = new ObjectMapper().readTree(migrated).path("captcha");
        assertThat(captcha.path("enable").asBoolean()).isEqualTo(enabled);
        assertThat(captcha.path("audience").asText()).isEqualTo(audience);
        assertThat(captcha.path("type").asText()).isEqualTo("ARITHMETIC");
        assertThat(captcha.path("arithmeticRange").asInt()).isEqualTo(50);
        assertThat(captcha.has("anonymousCommentCaptcha")).isFalse();
        var roles = captcha.path("roles");
        if (expectedRole == null) {
            assertThat(roles.isEmpty()).isTrue();
        } else {
            assertThat(roles.size()).isEqualTo(1);
            assertThat(roles.get(0).asText()).isEqualTo(expectedRole);
        }
        assertThat(CommentWidgetPlugin.migrateCaptchaSettings(migrated)).isEqualTo(migrated);
    }

    @Test
    void preservesNewSettingsAndAbsentCaptcha() {
        for (var json : java.util.List.of("{}",
            "{\"captcha\":{\"enable\":false,\"audience\":\"ROLES\",\"roles\":[\"editor\"]}}")) {
            assertThat(CommentWidgetPlugin.migrateCaptchaSettings(json)).isEqualTo(json);
        }
    }
}
