package run.halo.comment.widget;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.pf4j.PluginWrapper;
import org.springframework.stereotype.Component;
import org.springframework.util.PropertyPlaceholderHelper;
import org.thymeleaf.context.ITemplateContext;
import org.thymeleaf.model.IAttribute;
import org.thymeleaf.model.IProcessableElementTag;
import org.thymeleaf.processor.element.IElementTagStructureHandler;
import run.halo.app.theme.dialect.CommentWidget;

import java.util.Properties;

/**
 * A default implementation of {@link CommentWidget}.
 *
 * @author guqing
 * @since 2.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DefaultCommentWidget implements CommentWidget {
    static final PropertyPlaceholderHelper PROPERTY_PLACEHOLDER_HELPER = new PropertyPlaceholderHelper("${", "}");

    private final PluginWrapper pluginWrapper;

    @Override
    public void render(ITemplateContext context,
                       IProcessableElementTag tag,
                       IElementTagStructureHandler structureHandler) {
        IAttribute groupAttribute = tag.getAttribute("group");
        IAttribute kindAttribute = tag.getAttribute("kind");
        IAttribute nameAttribute = tag.getAttribute("name");
        IAttribute colorSchemeAttribute = tag.getAttribute("colorScheme");

        structureHandler.replaceWith(commentHtml(groupAttribute, kindAttribute, nameAttribute, colorSchemeAttribute),
                false);
    }

    private String commentHtml(IAttribute groupAttribute, IAttribute kindAttribute,
                               IAttribute nameAttribute, IAttribute colorSchemeAttribute) {
        if (kindAttribute == null || StringUtils.isBlank(kindAttribute.getValue())) {
            log.warn("Comment widget tag attributes 'kind' is missing.");
            return "<p style=\"color:red\">Comment widget attributes 'kind' is required but missing found.</p>";
        }
        if (nameAttribute == null || StringUtils.isBlank(nameAttribute.getValue())) {
            log.warn("Comment widget tag attributes 'name' is missing.");
            return "<p style=\"color:red\">Comment widget attributes 'name' is required but missing found.</p>";
        }

        String group = getGroup(groupAttribute);

        final Properties properties = new Properties();

        properties.setProperty("version", pluginWrapper.getDescriptor().getVersion());
        properties.setProperty("group", group);
        properties.setProperty("kind", kindAttribute.getValue());
        properties.setProperty("name", nameAttribute.getValue());
        properties.setProperty("colorScheme", getColorScheme(colorSchemeAttribute));

        return PROPERTY_PLACEHOLDER_HELPER.replacePlaceholders("""
                <div id="comment"></div>
                <script src="/plugins/PluginCommentWidget/assets/static/comment-widget.iife.js?version=${version}"></script>
                <script>
                  CommentWidget.init(
                    "#comment",
                    "/plugins/PluginCommentWidget/assets/static/style.css?version=${version}",
                    {
                      group: "${group}",
                      kind: "${kind}",
                      name: "${name}",
                      colorScheme: ${colorScheme}
                    }
                  );
                </script>
                """, properties);
    }

    private String getGroup(IAttribute groupAttribute) {
        return groupAttribute.getValue() == null ? ""
                : StringUtils.defaultString(groupAttribute.getValue());
    }

    private String getColorScheme(IAttribute colorSchemeAttribute) {
        return colorSchemeAttribute == null ? "'light'"
                : StringUtils.defaultString(colorSchemeAttribute.getValue(), "'light'");
    }
}
