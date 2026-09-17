package run.halo.comment.widget.upload;

import java.net.URI;
import java.util.HashSet;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import org.jsoup.Jsoup;

public final class UploadReferences {

    private UploadReferences() {}

    public static Set<String> images(String html) {
        var result = new HashSet<String>();
        for (var image : Jsoup.parseBodyFragment(Objects.requireNonNullElse(html, "")).select(
            "img[src]"
        )) {
            String src = image.attr("src");
            result.add(canonical(src));
            addAbsolutePath(src, result);
        }
        return result;
    }

    public static String canonical(String value) {
        if (value == null) {
            return "";
        }
        try {
            var uri = URI.create(value).normalize();
            var host = uri.getHost();
            // Keep encoded delimiters intact when urlKey parses this reference again.
            return authority(host, uri.getPort()) + uri.getRawPath();
        } catch (IllegalArgumentException e) {
            return value;
        }
    }

    private static void addAbsolutePath(String src, Set<String> result) {
        try {
            var uri = URI.create(src).normalize();
            // Halo may return root-relative permalinks. Also recognize an absolute
            // spelling of that path, conservatively protecting the managed image.
            if (uri.getHost() != null && uri.getRawPath() != null) {
                result.add(uri.getRawPath());
            }
        } catch (IllegalArgumentException ignored) {}
    }

    private static String authority(String host, int port) {
        if (host == null) {
            return "";
        }
        String normalizedHost = host.toLowerCase(Locale.ROOT);
        if (port < 0) {
            return normalizedHost;
        }
        return normalizedHost + ":" + port;
    }
}
