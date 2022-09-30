package run.halo.comment.widget;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.ITemplateContext;
import org.thymeleaf.model.IAttribute;
import org.thymeleaf.model.IProcessableElementTag;
import org.thymeleaf.processor.element.IElementTagStructureHandler;
import run.halo.app.theme.dialect.CommentWidget;

/**
 * A default implementation of {@link CommentWidget}.
 *
 * @author guqing
 * @since 2.0.0
 */
@Slf4j
@Component
public class DefaultCommentWidget implements CommentWidget {

    @Override
    public void render(ITemplateContext context,
                       IProcessableElementTag tag,
                       IElementTagStructureHandler structureHandler) {
        IAttribute groupAttribute = tag.getAttribute("group");
        IAttribute kindAttribute = tag.getAttribute("kind");
        IAttribute nameAttribute = tag.getAttribute("name");

        structureHandler.replaceWith(commentHtml(groupAttribute, kindAttribute, nameAttribute),
            false);
    }

    private String commentHtml(IAttribute groupAttribute, IAttribute kindAttribute,
                               IAttribute nameAttribute) {
        if (kindAttribute == null || StringUtils.isBlank(kindAttribute.getValue())) {
            log.warn("Comment widget tag attributes 'kind' is missing.");
            return "<p style=\"color:red\">Comment widget attributes 'kind' is required but missing found.</p>";
        }
        if (nameAttribute == null || StringUtils.isBlank(nameAttribute.getValue())) {
            log.warn("Comment widget tag attributes 'name' is missing.");
            return "<p style=\"color:red\">Comment widget attributes 'name' is required but missing found.</p>";
        }
        String group = getGroup(groupAttribute);
        return """
            <div id="comment"></div>
            <script src="/assets/PluginCommentWidget/static/comment-widget.iife.js"></script>
            <script>
              CommentWidget.init(
                "#comment",
                "/assets/PluginCommentWidget/static/style.css",
                {
                  group: "%s",
                  kind: "%s",
                  name: "%s",
                }
              );
            </script>
            """.formatted(group, kindAttribute.getValue(), nameAttribute.getValue());
    }

    private String getGroup(IAttribute groupAttribute) {
        return groupAttribute.getValue() == null ? ""
            : StringUtils.defaultString(groupAttribute.getValue());
    }
}
