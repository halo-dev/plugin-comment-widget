package run.halo.comment.widget.captcha;

import java.awt.image.BufferedImage;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import com.google.common.base.Ticker;
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import run.halo.comment.widget.IpAddressUtils;
import run.halo.comment.widget.SettingConfigGetter;

@Component
public class CaptchaManagerImpl implements CaptchaManager {
    public static final long CODE_EXPIRATION_MINUTES = 1;
    static final int MAX_CAPTCHAS = 10_000;

    private final Cache<String, String> captchaCache =
        CacheBuilder.newBuilder()
            .expireAfterWrite(CODE_EXPIRATION_MINUTES, TimeUnit.MINUTES)
            .maximumSize(MAX_CAPTCHAS)
            .build();

    private final CaptchaCookieResolver captchaCookieResolver;
    private final AltchaRequestLimiter limiter;

    @Autowired
    public CaptchaManagerImpl(CaptchaCookieResolver captchaCookieResolver) {
        this(captchaCookieResolver, new AltchaRequestLimiter(Ticker.systemTicker()));
    }

    CaptchaManagerImpl(CaptchaCookieResolver captchaCookieResolver, AltchaRequestLimiter limiter) {
        this.captchaCookieResolver = captchaCookieResolver;
        this.limiter = limiter;
    }

    @Override
    public Mono<Boolean> verify(String key, String captchaCode, boolean ignoreCase) {
        return Mono.fromCallable(() -> {
            var code = captchaCache.asMap().remove(key);
            if (code == null || captchaCode == null) {
                return false;
            }
            return ignoreCase ? code.equalsIgnoreCase(captchaCode) : code.equals(captchaCode);
        });
    }

    @Override
    public Mono<Void> invalidate(String id) {
        captchaCache.invalidate(id);
        return Mono.empty();
    }

    @Override
    public Mono<Captcha> generate(ServerWebExchange exchange, SettingConfigGetter.CaptchaConfig captchaConfig) {
        if (!limiter.tryAcquire(clientIp(exchange))) {
            return Mono.error(new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS));
        }
        return doGenerate(captchaConfig)
            .doOnNext(captcha -> captchaCookieResolver.setCookie(exchange, captcha.id()));
    }

    private static String clientIp(ServerWebExchange exchange) {
        var remote = exchange.getRequest().getRemoteAddress();
        if (remote == null || remote.isUnresolved()) {
            return IpAddressUtils.UNKNOWN;
        }
        if (remote.getAddress() == null) {
            return remote.getHostString();
        }
        return remote.getAddress().getHostAddress();
    }

    private Mono<Captcha> doGenerate(SettingConfigGetter.CaptchaConfig captchaConfig) {
        return Mono.fromSupplier(() -> {
                var captcha = switch (captchaConfig.getType()) {
                    case ALPHANUMERIC -> CaptchaGenerator.generateSimpleCaptcha(captchaConfig.getCaptchaLength());
                    case ALTCHA, TURNSTILE -> throw new IllegalStateException("Selected captcha type does not use image captchas");
                    case ARITHMETIC -> CaptchaGenerator.generateMathCaptcha(captchaConfig.getArithmeticRange());
                };
                var imageBase64 = encodeBufferedImageToDataUri(captcha.image());
                var id = UUID.randomUUID().toString();
                return new Captcha(id, captcha.code(), imageBase64);
            })
            .subscribeOn(Schedulers.boundedElastic())
            .doOnNext(captcha -> captchaCache.put(captcha.id(), captcha.code()));
    }

    private static String encodeBufferedImageToDataUri(BufferedImage image) {
        var imageBase64 = CaptchaGenerator.encodeToBase64(image);
        return "data:image/png;base64," + imageBase64;
    }
}
