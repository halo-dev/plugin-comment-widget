package run.halo.comment.widget.upload;

import java.net.URI;
import run.halo.app.extension.Extension;
import run.halo.app.extension.ListOptions;
import run.halo.app.extension.router.selector.LabelSelector;

/** Indexed labels locate records; annotations retain the complete values for verification. */
public final class UploadMetadata {

    public static final String PREFIX = "commentwidget.halo.run/";
    public static final String URL_KEY = PREFIX + "url-key";
    public static final String TARGET_KEY = PREFIX + "target-key";
    public static final String TARGET_KIND = PREFIX + "target-kind";
    public static final String TARGET_NAME = PREFIX + "target-name";
    public static final String URL = PREFIX + "url";
    public static final String GC_PENDING = PREFIX + "gc-pending";
    public static final String DELETE_AFTER = PREFIX + "delete-after";
    public static final String RETAINED = PREFIX + "retained";
    public static final String REF_PREFIX = PREFIX + "ref-";

    private UploadMetadata() {}

    public static String key(String value) {
        return UploadIdentity.hash(value).substring(0, 40);
    }

    public static String urlKey(String url) {
        try {
            return key(URI.create(url).normalize().getPath());
        } catch (RuntimeException e) {
            return key(url);
        }
    }

    public static String annotation(Extension e, String key) {
        if (e.getMetadata().getAnnotations() == null) {
            return null;
        }
        return e.getMetadata().getAnnotations().get(key);
    }

    public static String label(Extension e, String key) {
        if (e.getMetadata().getLabels() == null) {
            return null;
        }
        return e.getMetadata().getLabels().get(key);
    }

    public static ListOptions matching(String key, String value) {
        return new ListOptions().setLabelSelector(LabelSelector.builder().eq(key, value).build());
    }
}
