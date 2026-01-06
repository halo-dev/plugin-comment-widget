package run.halo.comment.widget;

import java.net.InetSocketAddress;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.server.ServerRequest;

/**
 * Ip address utils.
 * Code from internet.
 */
@Slf4j
public class IpAddressUtils {
    public static final String UNKNOWN = "unknown";

    private static final String[] IP_HEADER_NAMES = {
        "X-Forwarded-For", "X-Real-IP", "Proxy-Client-IP", "WL-Proxy-Client-IP",
        "CF-Connecting-IP", "HTTP_X_FORWARDED_FOR", "HTTP_X_FORWARDED",
        "HTTP_X_CLUSTER_CLIENT_IP", "HTTP_CLIENT_IP", "HTTP_FORWARDED_FOR",
        "HTTP_FORWARDED", "HTTP_VIA", "REMOTE_ADDR",
    };

    /**
     * Gets the IP address from request.
     *
     * @param request is server request
     * @return IP address if found, otherwise {@link #UNKNOWN}.
     */
    public static String getClientIp(ServerRequest request) {
        for (String header : IP_HEADER_NAMES) {
            String ipList = request.headers().firstHeader(header);
            if (StringUtils.hasText(ipList) && !UNKNOWN.equalsIgnoreCase(
                ipList)) {
                String[] ips = ipList.trim().split("[,;]");
                for (String ip : ips) {
                    if (StringUtils.hasText(ip) && !UNKNOWN.equalsIgnoreCase(
                        ip)) {
                        return ip;
                    }
                }
            }
        }
        var remoteAddress = request.remoteAddress();
        if (remoteAddress.isEmpty()) {
            return UNKNOWN;
        }
        InetSocketAddress inetSocketAddress = remoteAddress.get();
        if (inetSocketAddress.isUnresolved()) {
            return UNKNOWN;
        }
        return inetSocketAddress.getAddress().getHostAddress();
    }
}
