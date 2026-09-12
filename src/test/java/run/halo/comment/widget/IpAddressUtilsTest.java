package run.halo.comment.widget;

import static org.assertj.core.api.Assertions.*;

import java.net.InetSocketAddress;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.reactive.function.server.MockServerRequest;

class IpAddressUtilsTest {

    @Test
    void usesTheAddressResolvedByHaloInsteadOfParsingRequestHeaders() {
        var request = MockServerRequest.builder()
            .remoteAddress(new InetSocketAddress("192.0.2.1", 1234))
            .header("X-Forwarded-For", "198.51.100.1")
            .header("Proxy-Client-IP", "203.0.113.1")
            .build();
        assertThat(IpAddressUtils.getClientIp(request)).isEqualTo("192.0.2.1");
    }

    @Test
    void doesNotFallBackToHeadersWhenTheAddressIsUnavailable() {
        var request = MockServerRequest.builder()
            .remoteAddress(InetSocketAddress.createUnresolved("unresolved.invalid", 1234))
            .header("X-Forwarded-For", "198.51.100.1")
            .build();
        assertThat(IpAddressUtils.getClientIp(request)).isEqualTo(IpAddressUtils.UNKNOWN);
    }
}
