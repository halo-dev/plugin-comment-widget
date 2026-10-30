package run.halo.comment.widget.location;

import com.google.common.net.InetAddresses;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.net.InetAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import org.lionsoul.ip2region.service.Config;
import org.lionsoul.ip2region.service.Ip2Region;
import org.lionsoul.ip2region.service.InvalidConfigException;
import org.lionsoul.ip2region.xdb.InetAddressException;
import org.lionsoul.ip2region.xdb.XdbException;
import org.springframework.stereotype.Component;

/** Offline lookups run only on controller workers. No IP is sent to a remote service. */
@Component
public class IpLocationResolver {

    private Ip2Region searcher;
    private Path directory;
    private boolean closed;

    public synchronized String resolve(String ip) {
        if (closed || ip == null || ip.isBlank()) {
            return "";
        }
        final InetAddress address;
        try {
            // ip2region's string overload accepts hostnames; use numeric bytes instead.
            address = InetAddresses.forString(ip.trim());
        } catch (IllegalArgumentException e) {
            return "";
        }
        try {
            var bytes = address.getAddress();
            if (address.isAnyLocalAddress() || address.isLoopbackAddress()
                || address.isLinkLocalAddress() || address.isSiteLocalAddress()
                || address.isMulticastAddress()
                || (bytes.length == 16 && (bytes[0] & 0xfe) == 0xfc)) {
                return "";
            }
            if (searcher == null) {
                initialize();
            }
            return displayLocation(searcher.search(bytes));
        } catch (InetAddressException e) {
            return "";
        } catch (IOException | XdbException | InvalidConfigException e) {
            throw new IllegalStateException("Cannot read the IP location database", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("IP location lookup interrupted", e);
        }
    }

    private void initialize() throws IOException, XdbException, InvalidConfigException {
        directory = Files.createTempDirectory("halo-comment-ip-location-");
        try {
            var v4 = Config.custom().setCachePolicy(Config.VIndexCache).setSearchers(1)
                .setXdbPath(extract("ip2region_v4.xdb").toString()).asV4();
            var v6 = Config.custom().setCachePolicy(Config.VIndexCache).setSearchers(1)
                .setXdbPath(extract("ip2region_v6.xdb").toString()).asV6();
            searcher = Ip2Region.create(v4, v6);
        } catch (IOException | XdbException | InvalidConfigException | RuntimeException e) {
            deleteFiles();
            throw e;
        }
    }

    private Path extract(String name) throws IOException {
        var file = directory.resolve(name);
        try (var input = getClass().getResourceAsStream("/ip-location/" + name)) {
            if (input == null) {
                throw new IOException("Missing IP location database: " + name);
            }
            Files.copy(input, file);
        }
        return file;
    }

    static String displayLocation(String region) {
        if (region == null) {
            return "";
        }
        // The pinned database contains country|province|city|ISP|countryCode.
        var fields = region.split("\\|", -1);
        if (fields.length != 5 || !fields[4].matches("[A-Z]{2}")) {
            return "";
        }
        if ("CN".equals(fields[4])) {
            return usable(fields[1]) ? fields[1] : "中国";
        }
        return usable(fields[0]) ? fields[0] : "";
    }

    private static boolean usable(String value) {
        return !value.isBlank() && !"0".equals(value) && !"Reserved".equals(value);
    }

    @PreDestroy
    public synchronized void close() throws IOException, InterruptedException {
        closed = true;
        if (searcher != null) {
            searcher.close();
            searcher = null;
        }
        deleteFiles();
    }

    private void deleteFiles() throws IOException {
        if (directory != null) {
            Files.deleteIfExists(directory.resolve("ip2region_v4.xdb"));
            Files.deleteIfExists(directory.resolve("ip2region_v6.xdb"));
            Files.deleteIfExists(directory);
            directory = null;
        }
    }
}
