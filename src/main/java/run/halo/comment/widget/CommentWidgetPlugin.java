package run.halo.comment.widget;

import lombok.RequiredArgsConstructor;
import org.pf4j.PluginWrapper;
import org.springframework.stereotype.Component;
import run.halo.app.extension.SchemeManager;
import run.halo.app.plugin.BasePlugin;

/**
 * @author ryanwang
 * @since 2.0.0
 */
@Component
public class CommentWidgetPlugin extends BasePlugin {

    public final SchemeManager schemeManager;

    public CommentWidgetPlugin(PluginWrapper wrapper, SchemeManager schemeManager) {
        super(wrapper);
        this.schemeManager = schemeManager;
    }

    @Override
    public void start() {
        schemeManager.register(CommentWidgetSetting.class);
    }

    @Override
    public void stop() {
        schemeManager.unregister(schemeManager.get(CommentWidgetSetting.class));
    }
}
