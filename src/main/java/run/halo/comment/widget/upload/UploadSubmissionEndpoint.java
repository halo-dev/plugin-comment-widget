package run.halo.comment.widget.upload;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.fn.builders.apiresponse.Builder;
import org.springdoc.webflux.core.fn.SpringdocRouteBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import run.halo.app.core.extension.endpoint.CustomEndpoint;
import run.halo.app.extension.GroupVersion;

/** Issues submission tickets and exposes their recovery status; no attachment management. */
@Component
@RequiredArgsConstructor
public class UploadSubmissionEndpoint implements CustomEndpoint {

    private final UploadLifecycleService lifecycle;

    public record SubmissionStatus(String state) {}

    public record SubmissionTicket(String id, Instant expiresAt) {}

    @Override
    public GroupVersion groupVersion() {
        return GroupVersion.parseAPIVersion("api.commentwidget.halo.run/v1alpha1");
    }

    @Override
    public RouterFunction<ServerResponse> endpoint() {
        return SpringdocRouteBuilder.route()
            .POST("submissions", this::issue, builder ->
                builder
                    .operationId("issueUploadSubmission")
                    .tag("UploadSubmissions")
                    .response(Builder.responseBuilder().implementation(SubmissionTicket.class))
            )
            .GET("submissions/{name}", this::status, builder ->
                builder
                    .operationId("getUploadSubmissionStatus")
                    .tag("UploadSubmissions")
                    .parameter(
                        org.springdoc.core.fn.builders.parameter.Builder.parameterBuilder()
                            .name("name")
                            .in(io.swagger.v3.oas.annotations.enums.ParameterIn.PATH)
                            .required(true)
                    )
                    .response(Builder.responseBuilder().implementation(SubmissionStatus.class))
            )
            .DELETE("submissions/{name}", this::cancel, builder ->
                builder
                    .operationId("cancelUnusedUploadSubmission")
                    .tag("UploadSubmissions")
                    .parameter(
                        org.springdoc.core.fn.builders.parameter.Builder.parameterBuilder()
                            .name("name")
                            .in(io.swagger.v3.oas.annotations.enums.ParameterIn.PATH)
                            .required(true)
                    )
                    .response(Builder.responseBuilder().responseCode("204"))
            )
            .build();
    }

    private Mono<ServerResponse> issue(ServerRequest request) {
        return UploadIdentity.currentOwner()
            .flatMap(owner ->
                Mono.fromCallable(() -> issueTicket(request, owner)).subscribeOn(
                    Schedulers.boundedElastic()
                )
            )
            .flatMap(value -> ServerResponse.ok().bodyValue(value));
    }

    private SubmissionTicket issueTicket(ServerRequest request, String owner) {
        var submission = lifecycle.issue(credential(request), owner);
        return new SubmissionTicket(
            submission.getMetadata().getName(),
            submission.getSpec().getExpiresAt()
        );
    }

    private Mono<ServerResponse> status(ServerRequest request) {
        return UploadIdentity.currentOwner()
            .flatMap(owner ->
                Mono.fromCallable(() -> readStatus(request, owner)).subscribeOn(
                    Schedulers.boundedElastic()
                )
            )
            .flatMap(value -> ServerResponse.ok().bodyValue(value));
    }

    private SubmissionStatus readStatus(ServerRequest request, String owner) {
        var submission = lifecycle.getSubmission(
            request.pathVariable("name"),
            credential(request),
            owner
        );
        return new SubmissionStatus(submission.getSpec().getState().name());
    }

    private Mono<ServerResponse> cancel(ServerRequest request) {
        return UploadIdentity.currentOwner()
            .flatMap(owner ->
                Mono.fromRunnable(() -> lifecycle.cancelIssued(
                    request.pathVariable("name"), credential(request), owner
                )).subscribeOn(Schedulers.boundedElastic())
            )
            .then(ServerResponse.noContent().build());
    }

    private String credential(ServerRequest request) {
        return UploadIdentity.credential(
            request.headers().firstHeader(UploadIdentity.TOKEN_HEADER)
        );
    }
}
