package run.halo.comment.widget.captcha;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import run.halo.app.infra.AnonymousUserConst;
import run.halo.comment.widget.SettingConfigGetter.CaptchaConfig;
import run.halo.comment.widget.SettingConfigGetter.CaptchaConfig.CaptchaAudience;

/** Shared audience decision for the public configuration and submission validation. */
@Component
public class CaptchaRequirement {
    public Mono<Boolean> isRequired(CaptchaConfig config) {
        if (!config.isEnable()) {
            return Mono.just(false);
        }
        return ReactiveSecurityContextHolder.getContext()
            .mapNotNull(SecurityContext::getAuthentication)
            .map(authentication -> matches(config, authentication))
            .defaultIfEmpty(matches(config, null));
    }

    private boolean matches(CaptchaConfig config, Authentication authentication) {
        if (config.getAudience() == CaptchaAudience.ALL) {
            return true;
        }
        var anonymous = isAnonymous(authentication);
        if (config.getAudience() != CaptchaAudience.ROLES) {
            return anonymous;
        }
        if (anonymous) {
            return config.isIncludeAnonymous();
        }
        var selectedRoles = config.getRoles();
        if (selectedRoles == null) {
            return false;
        }
        if (selectedRoles.isEmpty()) {
            return false;
        }
        return authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .filter(authority -> authority.startsWith("ROLE_"))
            .map(authority -> authority.substring("ROLE_".length()))
            .anyMatch(selectedRoles::contains);
    }

    private boolean isAnonymous(Authentication authentication) {
        if (authentication == null) {
            return true;
        }
        if (!authentication.isAuthenticated()) {
            return true;
        }
        return AnonymousUserConst.isAnonymousUser(authentication.getName());
    }
}
