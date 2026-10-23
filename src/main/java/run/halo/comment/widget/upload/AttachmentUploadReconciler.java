package run.halo.comment.widget.upload;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import run.halo.app.core.extension.attachment.Attachment;
import run.halo.app.extension.controller.Controller;
import run.halo.app.extension.controller.ControllerBuilder;
import run.halo.app.extension.controller.Reconciler;

@Component
@RequiredArgsConstructor
public class AttachmentUploadReconciler implements Reconciler<Reconciler.Request> {

    private final UploadLifecycleService lifecycle;

    @Override
    public Result reconcile(Request request) {
        return lifecycle
            .reconcileAttachment(request.name())
            .map(delay -> new Result(true, delay))
            .orElseGet(Result::doNotRetry);
    }

    @Override
    public Controller setupWith(ControllerBuilder builder) {
        return builder
            .extension(new Attachment())
            .syncAllOnStart(true)
            .syncAllListOptions(UploadMetadata.matching(UploadMetadata.GC_PENDING, "true"))
            .build();
    }
}
