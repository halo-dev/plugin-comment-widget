package run.halo.comment.widget;

import static org.springdoc.core.fn.builders.apiresponse.Builder.responseBuilder;
import static org.springdoc.core.fn.builders.content.Builder.contentBuilder;
import static org.springdoc.core.fn.builders.requestbody.Builder.requestBodyBuilder;
import static org.springframework.web.reactive.function.server.RequestPredicates.contentType;
import static run.halo.app.infra.utils.FileTypeDetectUtils.getFileExtension;

import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import io.github.resilience4j.reactor.ratelimiter.operator.RateLimiterOperator;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springdoc.core.fn.builders.schema.Builder;
import org.springdoc.webflux.core.fn.SpringdocRouteBuilder;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.codec.multipart.Part;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyExtractors;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebInputException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import run.halo.app.core.extension.attachment.Attachment;
import run.halo.app.core.extension.endpoint.CustomEndpoint;
import run.halo.app.core.extension.service.AttachmentService;
import run.halo.app.extension.GroupVersion;
import run.halo.app.extension.ReactiveExtensionClient;
import run.halo.app.infra.AnonymousUserConst;

@Slf4j
@Component
@RequiredArgsConstructor
public class UploadMediaEndpoint implements CustomEndpoint {

    private final ReactiveExtensionClient client;
    private final SettingConfigGetter settingConfigGetter;
    private final AttachmentService attachmentService;
    private final RateLimiterRegistry rateLimiterRegistry;
    private final RateLimiterKeyRegistry rateLimiterKeyRegistry;

    @Override
    public RouterFunction<ServerResponse> endpoint() {
        final var tag = "Comment Widget Media Upload";
        return SpringdocRouteBuilder.route().POST("upload",
            contentType(MediaType.MULTIPART_FORM_DATA), request -> request.body(
                    BodyExtractors.toMultipartData())
                .map(UploadRequest::new)
                .flatMap(uploadReq -> {
                    var files = uploadReq.getFiles();
                    return uploadAttachments(files);
                })
                .flatMap(
                    attachments -> ServerResponse.ok().bodyValue(attachments))
                .transformDeferred(createIpBasedRateLimiter(request))
                .onErrorMap(RequestNotPermitted.class,
                    RateLimitExceededException::new
                ), builder -> builder.operationId("UploadAttachment")
                .tag(tag)
                .requestBody(requestBodyBuilder().required(true)
                    .content(contentBuilder().mediaType(
                            MediaType.MULTIPART_FORM_DATA_VALUE)
                        .schema(Builder.schemaBuilder()
                            .implementation(IUploadRequest.class))))
                .response(responseBuilder().implementation(Attachment.class))
                .build()
        ).build();
    }

    @Override
    public GroupVersion groupVersion() {
        return GroupVersion.parseAPIVersion(
            "api.commentwidget.halo.run/v1alpha1");
    }

    private Mono<List<Attachment>> uploadAttachments(List<FilePart> fileParts) {
        return validateUploadRequest(fileParts)
            .flatMap(editorConfig -> validateUploadPermission(editorConfig)
                .then(Mono.just(editorConfig))
            )
            .flatMap(editorConfig -> {
                var uploadConfig = editorConfig.getUpload();
                return uploadAttachmentsToStorage(fileParts,
                    uploadConfig.getAttachment()
                );
            });
    }

    private Mono<SettingConfigGetter.EditorConfig> validateUploadRequest(
        List<FilePart> fileParts) {
        if (fileParts.isEmpty()) {
            return Mono.error(
                new ServerWebInputException("At least one file is required"));
        }

        return settingConfigGetter.getEditorConfig().flatMap(editorConfig -> {
            if (!editorConfig.isEnableUpload()) {
                return Mono.error(
                    new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "File upload feature is not enabled"
                    ));
            }
            return Mono.just(editorConfig);
        });
    }

    /**
     * Validate upload permission (anonymous user permission check).
     */
    private Mono<Void> validateUploadPermission(
        SettingConfigGetter.EditorConfig editorConfig) {
        var uploadConfig = editorConfig.getUpload();

        if (uploadConfig.isAllowAnonymous()) {
            return Mono.empty();
        }

        // Anonymous upload is not allowed, check if the current user is an anonymous user
        return isAnonymousCommenter().flatMap(isAnonymous -> {
            if (isAnonymous) {
                return Mono.error(
                    new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Anonymous users are not allowed to upload files"
                    ));
            }
            return Mono.empty();
        });
    }

    /**
     * Upload attachments to storage service. If any attachment upload fails, all successfully uploaded attachments will be rolled back and deleted.
     */
    private Mono<List<Attachment>> uploadAttachmentsToStorage(
        List<FilePart> fileParts,
        SettingConfigGetter.UploadConfig.UploadAttachment uploadAttachment) {
        var policyName = uploadAttachment.getAttachmentPolicy();
        var groupName = uploadAttachment.getAttachmentGroup();
        if (StringUtils.isBlank(policyName)) {
            return Mono.error(
                new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Please configure the upload policy"
                ));
        }
        List<Attachment> uploadedAttachments = new CopyOnWriteArrayList<>();

        return authenticationConsumerNullable(
            authentication -> Flux.fromIterable(fileParts)
                // Ensure sequential upload
                .concatMap(filePart -> {
                    String fileName = UUID.randomUUID().toString();
                    String extension = getFileExtension(filePart.filename());
                    return attachmentService.upload(policyName, groupName,
                        fileName + extension, filePart.content(),
                        filePart.headers().getContentType()
                    );
                })
                .flatMap(this::setPermalinkToAttachment)
                .doOnNext(uploadedAttachments::add)
                .collectList()
                .onErrorResume(error -> rollbackUploadedAttachments(
                    uploadedAttachments).then(Mono.error(error))));
    }

    /**
     * Rollback and delete uploaded attachments.
     */
    private Mono<Void> rollbackUploadedAttachments(
        List<Attachment> attachments) {
        if (attachments.isEmpty()) {
            return Mono.empty();
        }

        return Flux.fromIterable(attachments).flatMap(attachment -> {
            String attachmentName = attachment.getMetadata().getName();
            return attachmentService.delete(attachment)
                .flatMap(client::delete)
                .onErrorResume(deleteError -> {
                    log.error(
                        "Failed to delete attachment {}, please manually clean up",
                        attachmentName, deleteError
                    );
                    return Mono.empty();
                });
        }).then();
    }

    /**
     * Set the permanent link of the attachment.
     */
    private Mono<Attachment> setPermalinkToAttachment(Attachment attachment) {
        return attachmentService.getPermalink(attachment).doOnNext(
            permalink -> {
                var status = attachment.getStatus();
                if (status == null) {
                    status = new Attachment.AttachmentStatus();
                    attachment.setStatus(status);
                }
                status.setPermalink(permalink.toString());
            }).thenReturn(attachment);
    }

    private <T> RateLimiterOperator<T> createIpBasedRateLimiter(
        ServerRequest request) {
        var clientIp = IpAddressUtils.getClientIp(request);
        if (IpAddressUtils.UNKNOWN.equalsIgnoreCase(clientIp)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        var rateLimiterKey = "upload-ip-" + clientIp;
        var rateLimiter = rateLimiterRegistry.rateLimiter(rateLimiterKey,
            new RateLimiterConfig.Builder().limitForPeriod(10)
                .limitRefreshPeriod(Duration.ofSeconds(60))
                .build()
        );
        rateLimiterKeyRegistry.register(rateLimiterKey);
        if (log.isDebugEnabled()) {
            var metrics = rateLimiter.getMetrics();
            log.debug(
                "Upload with Rate Limiter: {}, available permissions: {}, number of " +
                    "waiting threads: {}", rateLimiter,
                metrics.getAvailablePermissions(),
                metrics.getNumberOfWaitingThreads()
            );
        }
        return RateLimiterOperator.of(rateLimiter);
    }

    <T> Mono<T> authenticationConsumerNullable(
        Function<Authentication, Mono<T>> func) {
        return ReactiveSecurityContextHolder.getContext().map(
            SecurityContext::getAuthentication).flatMap(func);
    }

    Mono<Boolean> isAnonymousCommenter() {
        return ReactiveSecurityContextHolder.getContext().map(
                context -> AnonymousUserConst.isAnonymousUser(
                    context.getAuthentication().getName())
            )
            .defaultIfEmpty(true);
    }

    @Schema(types = "object")
    public interface IUploadRequest {

        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "Attachment files, support multiple files")
        List<FilePart> getFiles();
    }

    public record UploadRequest(MultiValueMap<String, Part> formData)
        implements IUploadRequest {

        @Override
        public List<FilePart> getFiles() {
            List<Part> parts = formData.get("files");
            if (CollectionUtils.isEmpty(parts)) {
                throw new ServerWebInputException("No files found");
            }

            return parts.stream().filter(part -> part instanceof FilePart)
                .map(part -> (FilePart) part)
                .collect(Collectors.toList());
        }
    }

}
