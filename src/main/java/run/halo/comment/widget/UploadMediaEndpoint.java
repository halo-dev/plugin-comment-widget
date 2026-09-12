package run.halo.comment.widget;

import static org.springdoc.core.fn.builders.apiresponse.Builder.responseBuilder;
import static org.springdoc.core.fn.builders.content.Builder.contentBuilder;
import static org.springdoc.core.fn.builders.requestbody.Builder.requestBodyBuilder;
import static org.springframework.web.reactive.function.server.RequestPredicates.contentType;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import io.github.resilience4j.reactor.ratelimiter.operator.RateLimiterOperator;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springdoc.core.fn.builders.schema.Builder;
import org.springdoc.webflux.core.fn.SpringdocRouteBuilder;
import org.springframework.core.io.buffer.DataBufferLimitException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.codec.multipart.Part;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.ErrorResponse;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebInputException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import run.halo.app.core.extension.attachment.Attachment;
import run.halo.app.core.extension.attachment.Constant;
import run.halo.app.core.extension.endpoint.CustomEndpoint;
import run.halo.app.core.extension.service.AttachmentService;
import run.halo.app.extension.ExtensionUtil;
import run.halo.app.extension.GroupVersion;
import run.halo.app.extension.MetadataUtil;
import run.halo.app.infra.AnonymousUserConst;
import run.halo.comment.widget.upload.CommentUpload;
import run.halo.comment.widget.upload.UploadIdentity;
import run.halo.comment.widget.upload.UploadLifecycleService;

@Slf4j
@Component
@RequiredArgsConstructor
public class UploadMediaEndpoint implements CustomEndpoint {

    private final UploadLifecycleService lifecycle;
    private final SettingConfigGetter settingConfigGetter;
    private final AttachmentService attachmentService;
    private final RateLimiterRegistry rateLimiterRegistry;
    private final RateLimiterKeyRegistry rateLimiterKeyRegistry;

    @Override
    public RouterFunction<ServerResponse> endpoint() {
        final var tag = "Comment Widget Media Upload";
        return SpringdocRouteBuilder.route()
            .POST("upload", contentType(MediaType.MULTIPART_FORM_DATA), this::upload, builder ->
                builder
                    .operationId("UploadAttachment")
                    .tag(tag)
                    .requestBody(
                        requestBodyBuilder()
                            .required(true)
                            .content(
                                contentBuilder()
                                    .mediaType(MediaType.MULTIPART_FORM_DATA_VALUE)
                                    .schema(
                                        Builder.schemaBuilder().implementation(IUploadRequest.class)
                                    )
                            )
                    )
                    .response(responseBuilder().implementationArray(UploadedImage.class))
                    .build()
            )
            .build();
    }

    private Mono<ServerResponse> upload(ServerRequest request) {
        return settingConfigGetter
            .getEditorConfig()
            .flatMap(config ->
                Mono.defer(() -> uploadWithConfig(request, config)).transformDeferred(
                    createIpBasedRateLimiter(request)
                )
            )
            .flatMap(attachments -> ServerResponse.ok().bodyValue(attachments))
            .onErrorMap(RequestNotPermitted.class, RateLimitExceededException::new);
    }

    private Mono<List<UploadedImage>> uploadWithConfig(
        ServerRequest request,
        SettingConfigGetter.EditorConfig config
    ) {
        if (!config.isEnableUpload()) {
            return Mono.error(
                new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "File upload feature is not enabled"
                )
            );
        }
        var hash = UploadIdentity.credential(
            request.headers().firstHeader(UploadIdentity.TOKEN_HEADER)
        );
        return validateUploadPermission(config).then(readAndUpload(request, hash, config));
    }

    private Mono<List<UploadedImage>> readAndUpload(
        ServerRequest request,
        String hash,
        SettingConfigGetter.EditorConfig config
    ) {
        return Mono.usingWhen(
            request
                .multipartData()
                .map(parts -> parts.values().stream().flatMap(List::stream).toList()),
            parts -> uploadParts(parts, config, hash),
            this::deleteParts,
            (parts, error) -> deleteParts(parts),
            this::deleteParts
        ).onErrorMap(DataBufferLimitException.class, e ->
            new ResponseStatusException(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "Upload exceeds multipart limits",
                e
            )
        );
    }

    private Mono<List<UploadedImage>> uploadParts(
        List<Part> parts,
        SettingConfigGetter.EditorConfig config,
        String hash
    ) {
        if (parts.isEmpty()) {
            return Mono.error(new ServerWebInputException("At least one file is required"));
        }
        if (parts.stream().anyMatch(this::isInvalidPart)) {
            return Mono.error(new ServerWebInputException("Only files parts are accepted"));
        }
        return uploadAttachmentsToStorage(
            parts.stream().map(FilePart.class::cast).toList(),
            config.getUpload().getAttachment(),
            hash
        );
    }

    private boolean isInvalidPart(Part part) {
        if (!(part instanceof FilePart)) {
            return true;
        }
        return !part.name().equals("files");
    }

    private Mono<Void> deleteParts(List<Part> parts) {
        return Flux.fromIterable(parts).concatMap(Part::delete).then();
    }

    @Override
    public GroupVersion groupVersion() {
        return GroupVersion.parseAPIVersion("api.commentwidget.halo.run/v1alpha1");
    }

    /**
     * Validate upload permission (anonymous user permission check).
     */
    private Mono<Void> validateUploadPermission(SettingConfigGetter.EditorConfig editorConfig) {
        var uploadConfig = editorConfig.getUpload();

        if (uploadConfig.isAllowAnonymous()) {
            return Mono.empty();
        }

        // Anonymous upload is not allowed, check if the current user is an anonymous user
        return isAnonymousCommenter().flatMap(isAnonymous -> {
            if (isAnonymous) {
                return Mono.error(
                    new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Anonymous users are not allowed to upload files"
                    )
                );
            }
            return Mono.empty();
        });
    }

    private Mono<List<UploadedImage>> uploadAttachmentsToStorage(
        List<FilePart> files,
        SettingConfigGetter.UploadConfig.UploadAttachment settings,
        String hash
    ) {
        if (StringUtils.isBlank(settings.getAttachmentPolicy())) {
            return Mono.error(new ServerWebInputException("Please configure the upload policy"));
        }
        return UploadIdentity.currentOwner().flatMap(owner ->
            Flux.fromIterable(files)
                .concatMap(file -> uploadOne(file, settings, hash, owner))
                .collectList()
        );
    }

    private Mono<UploadedImage> uploadOne(
        FilePart file,
        SettingConfigGetter.UploadConfig.UploadAttachment settings,
        String hash,
        String owner
    ) {
        return beginAndUpload(file, settings, hash, owner).onErrorResume(error ->
            Mono.just(UploadedImage.failed(error))
        );
    }

    private Mono<UploadedImage> beginAndUpload(
        FilePart file,
        SettingConfigGetter.UploadConfig.UploadAttachment settings,
        String hash,
        String owner
    ) {
        return Mono.fromCallable(() -> lifecycle.begin(hash, owner))
            .subscribeOn(Schedulers.boundedElastic())
            .flatMap(record -> storeFile(file, settings, owner, record));
    }

    private Mono<UploadedImage> storeFile(
        FilePart file,
        SettingConfigGetter.UploadConfig.UploadAttachment settings,
        String owner,
        CommentUpload record
    ) {
        return attachmentService
            .upload(
                owner,
                settings.getAttachmentPolicy(),
                settings.getAttachmentGroup(),
                file,
                attachment -> markAttachment(attachment, record.getMetadata().getName())
            )
            .onErrorResume(error -> handleStorageRejection(record, error))
            .flatMap(attachment -> recordAttachment(record.getMetadata().getName(), attachment))
            .flatMap(this::setPermalinkToAttachment)
            .flatMap(attachment -> completeUpload(record, attachment));
    }

    private Mono<Attachment> handleStorageRejection(CommentUpload record, Throwable error) {
        if (!isStorageRejection(error)) {
            return Mono.error(error);
        }
        return Mono.fromRunnable(() ->
            lifecycle.discardRejectedUpload(record.getMetadata().getName())
        )
            .subscribeOn(Schedulers.boundedElastic())
            .doOnError(cleanupError ->
                log.warn(
                    "Failed to reclaim rejected upload {}",
                    record.getMetadata().getName(),
                    cleanupError
                )
            )
            .onErrorComplete()
            .then(Mono.error(error));
    }

    private boolean isStorageRejection(Throwable error) {
        if (!(error instanceof ErrorResponse response)) {
            return false;
        }
        return Set.of(
            "problemDetail.attachment.upload.fileSizeExceeded",
            "problemDetail.attachment.upload.fileTypeNotMatch",
            "problemDetail.attachment.upload.fileTypeNotSupported"
        ).contains(response.getDetailMessageCode());
    }

    private void markAttachment(Attachment attachment, String uploadId) {
        MetadataUtil.nullSafeLabels(attachment).put(CommentUpload.LABEL, uploadId);
        ExtensionUtil.addFinalizers(attachment.getMetadata(), Set.of(Constant.FINALIZER_NAME));
    }

    private Mono<Attachment> recordAttachment(String uploadId, Attachment attachment) {
        return Mono.fromRunnable(() -> lifecycle.attached(uploadId, attachment))
            .subscribeOn(Schedulers.boundedElastic())
            .thenReturn(attachment);
    }

    private Mono<UploadedImage> completeUpload(CommentUpload record, Attachment attachment) {
        return Mono.fromCallable(() -> {
            var url = attachment.getStatus().getPermalink();
            lifecycle.uploaded(record.getMetadata().getName(), attachment, url);
            return new UploadedImage(
                record.getMetadata().getName(),
                url,
                record.getSpec().getExpiresAt()
            );
        }).subscribeOn(Schedulers.boundedElastic());
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record UploadedImage(String uploadId, String url, Instant expiresAt, UploadError error) {
        public UploadedImage(String uploadId, String url, Instant expiresAt) {
            this(uploadId, url, expiresAt, null);
        }

        static UploadedImage failed(Throwable error) {
            if (error instanceof ErrorResponse response) {
                return new UploadedImage(
                    null,
                    null,
                    null,
                    new UploadError(
                        response.getStatusCode().value(),
                        response.getBody().getDetail()
                    )
                );
            }
            return new UploadedImage(
                null,
                null,
                null,
                new UploadError(500, "Upload failed; please retry later")
            );
        }
    }

    public record UploadError(int status, String message) {}

    /**
     * Set the permanent link of the attachment.
     */
    private Mono<Attachment> setPermalinkToAttachment(Attachment attachment) {
        return attachmentService
            .getPermalink(attachment)
            .doOnNext(permalink -> {
                var status = attachment.getStatus();
                if (status == null) {
                    status = new Attachment.AttachmentStatus();
                    attachment.setStatus(status);
                }
                status.setPermalink(permalink.toString());
            })
            .thenReturn(attachment);
    }

    private <T> RateLimiterOperator<T> createIpBasedRateLimiter(ServerRequest request) {
        var clientIp = IpAddressUtils.getClientIp(request);
        if (IpAddressUtils.UNKNOWN.equalsIgnoreCase(clientIp)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        var rateLimiterKey = "upload-ip-" + clientIp;
        var rateLimiter = rateLimiterKeyRegistry.acquire(rateLimiterRegistry, rateLimiterKey);
        if (log.isDebugEnabled()) {
            var metrics = rateLimiter.getMetrics();
            log.debug(
                "Upload with Rate Limiter: {}, available permissions: {}, number of " +
                    "waiting threads: {}",
                rateLimiter,
                metrics.getAvailablePermissions(),
                metrics.getNumberOfWaitingThreads()
            );
        }
        return RateLimiterOperator.of(rateLimiter);
    }

    Mono<Boolean> isAnonymousCommenter() {
        return ReactiveSecurityContextHolder.getContext()
            .map(context ->
                AnonymousUserConst.isAnonymousUser(context.getAuthentication().getName())
            )
            .defaultIfEmpty(true);
    }

    @Schema(types = "object")
    public interface IUploadRequest {
        @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Attachment files, support multiple files"
        )
        List<FilePart> getFiles();
    }
}
