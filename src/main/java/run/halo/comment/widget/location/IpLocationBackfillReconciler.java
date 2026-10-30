package run.halo.comment.widget.location;

import static run.halo.app.extension.index.query.Queries.equal;
import static run.halo.app.extension.index.query.Queries.greaterThan;

import java.time.Duration;
import java.util.Objects;
import java.util.function.Consumer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import run.halo.app.core.extension.content.Comment;
import run.halo.app.core.extension.content.Reply;
import run.halo.app.extension.ConfigMap;
import run.halo.app.extension.Extension;
import run.halo.app.extension.ExtensionClient;
import run.halo.app.extension.ListOptions;
import run.halo.app.extension.PageRequestImpl;
import run.halo.app.extension.controller.Controller;
import run.halo.app.extension.controller.ControllerBuilder;
import run.halo.app.extension.controller.Reconciler;
import run.halo.app.plugin.PluginContext;

/** A settings change or plugin restart starts a bounded, resumable history scan. */
@Component
@RequiredArgsConstructor
public class IpLocationBackfillReconciler implements Reconciler<Reconciler.Request> {

    static final int BATCH_SIZE = 100;
    private final ExtensionClient client;
    private final PluginContext context;
    private final IpLocationService locations;
    private String cursor;
    private boolean scanningReplies;
    private Long settingsVersion;

    @Override
    public Result reconcile(Request request) {
        if (!context.getConfigMapName().equals(request.name())) {
            return Result.doNotRetry();
        }
        var version = client.fetch(ConfigMap.class, request.name())
            .map(config -> config.getMetadata().getVersion()).orElse(null);
        if (!Objects.equals(settingsVersion, version)) {
            // A quick off/on toggle can be coalesced into one event. Rescan records
            // skipped while disabled instead of continuing past them with the old cursor.
            reset();
            settingsVersion = version;
        }
        if (!locations.isEnabled()) {
            reset();
            return Result.doNotRetry();
        }
        if (!scanningReplies) {
            if (page(Comment.class, locations::reconcileComment)) {
                scanningReplies = true;
                cursor = null;
            }
        } else if (page(Reply.class, locations::reconcileReply)) {
            reset();
            return Result.doNotRetry();
        }
        return Result.requeue(Duration.ofSeconds(1));
    }

    private <E extends Extension> boolean page(Class<E> type, Consumer<String> reconcile) {
        var options = ListOptions.builder();
        if (cursor != null) {
            options.andQuery(greaterThan("metadata.name", cursor));
        }
        var names = client.listNamesBy(type, options.build(),
            PageRequestImpl.ofSize(BATCH_SIZE).withSort(Sort.by("metadata.name"))).getItems();
        for (var name : names) {
            reconcile.accept(name);
            cursor = name;
        }
        return names.size() < BATCH_SIZE;
    }

    private void reset() {
        cursor = null;
        scanningReplies = false;
    }

    @Override
    public Controller setupWith(ControllerBuilder builder) {
        var name = context.getConfigMapName();
        return builder.extension(new ConfigMap())
            .onAddMatcher(config -> name.equals(config.getMetadata().getName()))
            .onUpdateMatcher(config -> name.equals(config.getMetadata().getName()))
            .onDeleteMatcher(config -> name.equals(config.getMetadata().getName()))
            .syncAllListOptions(ListOptions.builder().andQuery(equal("metadata.name", name)).build())
            .build();
    }
}
