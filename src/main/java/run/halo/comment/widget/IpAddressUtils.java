package run.halo.comment.widget;

import java.net.InetSocketAddress;
import org.springframework.web.reactive.function.server.ServerRequest;

/** Use the client address resolved by Halo's HTTP server and forwarding configuration. */
public final class IpAddressUtils {

    public static final String UNKNOWN = "unknown";

    private IpAddressUtils() {}

    public static String getClientIp(ServerRequest request) {
        return request
            .remoteAddress()
            .filter(address -> !address.isUnresolved())
            .map(InetSocketAddress::getAddress)
            .map(address -> address.getHostAddress())
            .orElse(UNKNOWN);
    }
}
