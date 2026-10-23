package run.halo.comment.widget.captcha;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContextImpl;
import reactor.core.publisher.Mono;
import run.halo.comment.widget.SettingConfigGetter.CaptchaConfig;
import run.halo.comment.widget.SettingConfigGetter.CaptchaConfig.CaptchaAudience;

class CaptchaRequirementTest {
    @ParameterizedTest
    @CsvSource({
        "true, ALL, false, true",
        "true, ANONYMOUS, false, true",
        "true, ROLES, true, true",
        "true, ROLES, false, false",
        "false, ALL, true, false"
    })
    void treatsAnEmptySecurityContextAsAnonymous(boolean enabled, CaptchaAudience audience,
                                                boolean includeAnonymous, boolean expected) {
        var config = new CaptchaConfig().setEnable(enabled).setAudience(audience)
            .setIncludeAnonymous(includeAnonymous);
        var requirement = new CaptchaRequirement();
        assertThat(requirement.isRequired(config).block()).isEqualTo(expected);
        assertThat(requirement.isRequired(config)
            .contextWrite(ReactiveSecurityContextHolder.withSecurityContext(
                Mono.just(new SecurityContextImpl())))
            .block()).isEqualTo(expected);
    }
}
