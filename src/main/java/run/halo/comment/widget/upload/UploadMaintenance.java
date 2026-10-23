package run.halo.comment.widget.upload;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.SmartLifecycle;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import run.halo.app.core.extension.attachment.Attachment;
import run.halo.app.core.extension.content.Comment;
import run.halo.app.core.extension.content.Reply;
import run.halo.app.extension.Extension;
import run.halo.app.extension.ExtensionClient;
import run.halo.app.extension.ListOptions;
import run.halo.app.extension.PageRequestImpl;
import run.halo.app.extension.index.query.Queries;

/** Bounded, keyset-paginated recovery. No timer per healthy image, no full list reads. */
@Component
@RequiredArgsConstructor
@Slf4j
public class UploadMaintenance implements SmartLifecycle {

    static final int BATCH = 100;
    private final ExtensionClient client;
    private final UploadLifecycleService lifecycle;
    private final Map<Class<?>, String> cursors = new HashMap<>();
    private ScheduledExecutorService executor;
    private volatile boolean running;
    private boolean commentsReady;
    private boolean repliesReady;
    private long nextAttachmentSweep;

    @Override
    public synchronized void start() {
        if (running) {
            return;
        }
        running = true;
        lifecycle.setReferenceIndexReady(false);
        commentsReady = false;
        repliesReady = false;
        cursors.clear();
        nextAttachmentSweep = 0;
        executor = Executors.newSingleThreadScheduledExecutor(r -> {
            var t = new Thread(r, "comment-upload-maintenance");
            t.setDaemon(true);
            return t;
        });
        executor.scheduleWithFixedDelay(
            () -> {
                try {
                    tick();
                } catch (RuntimeException e) {
                    log.warn("Comment upload maintenance will retry", e);
                }
            },
            5,
            1,
            TimeUnit.SECONDS
        );
    }

    synchronized void tick() {
        if (!commentsReady) {
            commentsReady = page(
                Comment.class,
                c -> lifecycle.indexReferences("Comment", c.getMetadata().getName()),
                false
            );
        }
        if (!repliesReady) {
            repliesReady = page(
                Reply.class,
                r -> lifecycle.indexReferences("Reply", r.getMetadata().getName()),
                false
            );
        }
        lifecycle.setReferenceIndexReady(commentsReady && repliesReady);
        sweepAttachments();
    }

    private <E extends Extension> boolean page(
        Class<E> type,
        Consumer<E> action,
        boolean managedOnly
    ) {
        var builder = ListOptions.builder();
        String cursor = cursors.get(type);
        if (cursor != null) {
            builder.andQuery(Queries.greaterThan("metadata.name", cursor));
        }
        if (managedOnly) {
            builder.andQuery(Queries.labelExists(CommentUpload.LABEL));
        }
        var rows = client
            .listBy(
                type,
                builder.build(),
                PageRequestImpl.ofSize(BATCH).withSort(Sort.by("metadata.name"))
            )
            .getItems();
        for (var row : rows) {
            action.accept(row);
            cursors.put(type, row.getMetadata().getName());
        }
        if (rows.size() < BATCH) {
            cursors.remove(type);
            return true;
        }
        return false;
    }

    @Override
    public synchronized void stop() {
        running = false;
        if (executor != null) {
            executor.shutdownNow();
        }
    }

    @Override
    public boolean isRunning() {
        return running;
    }

    private void sweepAttachments() {
        if (System.currentTimeMillis() < nextAttachmentSweep) {
            return;
        }
        if (page(Attachment.class, this::reconcileAttachment, true)) {
            nextAttachmentSweep = System.currentTimeMillis() + TimeUnit.HOURS.toMillis(24);
        }
    }

    private void reconcileAttachment(Attachment attachment) {
        lifecycle.reconcileAttachment(attachment.getMetadata().getName());
    }
}
