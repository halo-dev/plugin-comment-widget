package run.halo.comment.widget.location;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import run.halo.app.core.extension.content.Reply;
import run.halo.app.extension.controller.Controller;
import run.halo.app.extension.controller.ControllerBuilder;
import run.halo.app.extension.controller.Reconciler;

@Component
@RequiredArgsConstructor
public class ReplyIpLocationReconciler implements Reconciler<Reconciler.Request> {

    private final IpLocationService locations;

    @Override
    public Result reconcile(Request request) {
        locations.reconcileReply(request.name());
        return Result.doNotRetry();
    }

    @Override
    public Controller setupWith(ControllerBuilder builder) {
        return builder.extension(new Reply()).syncAllOnStart(false).build();
    }
}
