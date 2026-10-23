package run.halo.comment.widget.upload;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import run.halo.app.core.extension.content.Reply;
import run.halo.app.extension.controller.Controller;
import run.halo.app.extension.controller.ControllerBuilder;
import run.halo.app.extension.controller.Reconciler;

@Component
@RequiredArgsConstructor
public class ReplyUploadReconciler implements Reconciler<Reconciler.Request> {

    private final UploadLifecycleService lifecycle;

    @Override
    public Result reconcile(Request request) {
        lifecycle.targetChanged("Reply", request.name());
        return Result.doNotRetry();
    }

    @Override
    public Controller setupWith(ControllerBuilder builder) {
        return builder.extension(new Reply()).syncAllOnStart(false).build();
    }
}
