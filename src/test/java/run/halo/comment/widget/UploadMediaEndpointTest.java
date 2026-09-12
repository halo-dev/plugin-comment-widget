package run.halo.comment.widget;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.awaitility.Awaitility.await;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.http.codec.multipart.DefaultPartHttpMessageReader;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.codec.multipart.MultipartHttpMessageReader;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.adapter.DefaultServerWebExchange;
import org.springframework.web.server.i18n.AcceptHeaderLocaleContextResolver;
import org.springframework.web.server.session.DefaultWebSessionManager;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import run.halo.app.core.extension.attachment.Attachment;
import run.halo.app.core.extension.service.AttachmentService;
import run.halo.app.extension.Metadata;
import run.halo.comment.widget.upload.CommentUpload;
import run.halo.comment.widget.upload.UploadLifecycleService;

class UploadMediaEndpointTest {

    private final UploadLifecycleService lifecycle = mock(UploadLifecycleService.class);
    private final AttachmentService attachments = mock(AttachmentService.class);
    private final UploadMediaEndpoint endpoint = new UploadMediaEndpoint(
        lifecycle,
        null,
        attachments,
        null,
        null
    );
    private final SettingConfigGetter.EditorConfig config = new SettingConfigGetter.EditorConfig();
    private final ServerCodecConfigurer codecs = ServerCodecConfigurer.create();
    private final Attachment attachment = new Attachment();
    private FilePart receivedFile;
    private int receivedBytes;

    @BeforeEach
    void setUp() {
        config.setEnableUpload(true);
        config.getUpload().getAttachment().setAttachmentPolicy("selected-policy");
        config.getUpload().getAttachment().setAttachmentGroup("selected-group");
        var record = new CommentUpload();
        var metadata = new Metadata();
        metadata.setName("upload-id");
        record.setMetadata(metadata);
        record.setSpec(new CommentUpload.Spec());
        when(lifecycle.begin("draft", "alice")).thenReturn(record);
        when(attachments.getPermalink(attachment)).thenReturn(Mono.just(URI.create("/image.avif")));
        when(
            attachments.upload(
                eq("alice"),
                eq("selected-policy"),
                eq("selected-group"),
                any(FilePart.class),
                any()
            )
        ).thenAnswer(invocation -> receive(invocation.getArgument(3)));
    }

    @Test
    void disabledUploadRejectsBeforeValidatingCredentials() {
        config.setEnableUpload(false);
        for (String token : List.of("", "invalid", "a".repeat(64))) {
            var builder = org.springframework.mock.web.reactive.function.server.MockServerRequest
                .builder();
            if (!token.isEmpty()) {
                builder.header("X-Comment-Upload-Token", token);
            }
            assertThatThrownBy(() -> {
                Mono<?> result = ReflectionTestUtils.invokeMethod(
                    endpoint,
                    "uploadWithConfig",
                    builder.build(),
                    config
                );
                result.block();
            }).isInstanceOfSatisfying(ResponseStatusException.class, error -> {
                assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                assertThat(error.getReason()).isEqualTo("File upload feature is not enabled");
            });
        }
        verifyNoInteractions(attachments, lifecycle);
    }

    @Test
    void uploadsAsAnonymousWhenSecurityContextIsAbsent() {
        var record = new CommentUpload();
        var metadata = new Metadata();
        metadata.setName("anonymous-upload");
        record.setMetadata(metadata);
        record.setSpec(new CommentUpload.Spec());
        when(lifecycle.begin("draft", "anonymousUser")).thenReturn(record);
        when(
            attachments.upload(
                eq("anonymousUser"),
                eq("selected-policy"),
                eq("selected-group"),
                any(FilePart.class),
                any()
            )
        ).thenAnswer(invocation -> receive(invocation.getArgument(3)));

        Mono<List<UploadMediaEndpoint.UploadedImage>> result = ReflectionTestUtils.invokeMethod(
            endpoint,
            "readAndUpload",
            request(300 * 1024, 1),
            "draft",
            config
        );

        assertThat(result.block()).singleElement().satisfies(image -> {
            assertThat(image.uploadId()).isEqualTo("anonymous-upload");
            assertThat(image.url()).isEqualTo("/image.avif");
            assertThat(image.error()).isNull();
        });
        verify(lifecycle).uploaded("anonymous-upload", attachment, "/image.avif");
        assertTemporaryPartDeleted();
    }

    @Test
    void rejectsMissingSecurityContextWhenAnonymousUploadIsDisabled() {
        config.getUpload().setAllowAnonymous(false);
        Mono<Void> permission = ReflectionTestUtils.invokeMethod(
            endpoint,
            "validateUploadPermission",
            config
        );

        assertThatThrownBy(permission::block).isInstanceOfSatisfying(
            ResponseStatusException.class,
            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED)
        );
        verifyNoInteractions(attachments, lifecycle);
    }

    @Test
    void delegatesLargeAvifToSelectedStoragePolicyWithoutRewriting() {
        var result = upload(request(11 * 1024 * 1024, 1)).block(Duration.ofSeconds(10));
        assertThat(result).hasSize(1);
        assertThat(receivedBytes).isEqualTo(11 * 1024 * 1024);
        assertThat(receivedFile.filename()).isEqualTo("original.avif");
        assertThat(receivedFile.headers().getContentType().toString()).isEqualTo("image/avif");
        verify(lifecycle).uploaded("upload-id", attachment, "/image.avif");
        assertTemporaryPartDeleted();
    }

    @Test
    void acceptsMoreThanTenPartsWhenHostAllowsThem() {
        assertThat(upload(request(1, 11)).block(Duration.ofSeconds(10))).hasSize(11);
    }

    @Test
    void preservesStoragePolicyRejectionAndCleansTemporaryFile() {
        var rejection = new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Storage policy rejects type"
        );
        when(attachments.upload(any(), any(), any(), any(FilePart.class), any())).thenAnswer(
            invocation -> {
                receivedFile = invocation.getArgument(3);
                return Mono.error(rejection);
            }
        );
        var results = upload(request(300 * 1024, 1)).block();
        assertThat(results.getFirst().error().status()).isEqualTo(400);
        assertThat(results.getFirst().error().message()).isEqualTo("Storage policy rejects type");
        org.mockito.Mockito.verify(lifecycle, org.mockito.Mockito.never()).discardRejectedUpload(
            any()
        );
        assertTemporaryPartDeleted();
    }

    @Test
    void respectsHostMultipartSizeLimit() {
        var reader = new DefaultPartHttpMessageReader();
        reader.setMaxInMemorySize(32);
        reader.setMaxDiskUsagePerPart(64);
        codecs.defaultCodecs().multipartReader(new MultipartHttpMessageReader(reader));
        assertThatThrownBy(() -> upload(request(300 * 1024, 1)).block()).isInstanceOfSatisfying(
            ResponseStatusException.class,
            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE)
        );
        verifyNoInteractions(attachments, lifecycle);
    }

    @Test
    void cleansTemporaryFileWhenUploadIsCancelled() throws Exception {
        var started = new CountDownLatch(1);
        when(attachments.upload(any(), any(), any(), any(FilePart.class), any())).thenAnswer(
            invocation -> {
                receivedFile = invocation.getArgument(3);
                return Mono.<Attachment>never().doOnSubscribe(subscription -> started.countDown());
            }
        );
        var subscription = upload(request(300 * 1024, 1)).subscribe();
        try {
            assertThat(started.await(5, TimeUnit.SECONDS)).isTrue();
        } finally {
            subscription.dispose();
        }
        await().atMost(Duration.ofSeconds(5)).untilAsserted(this::assertTemporaryPartDeleted);
    }

    @Test
    void returnsSuccessfulFilesWhenAnotherFileFails() {
        when(attachments.upload(any(), any(), any(), any(FilePart.class), any()))
            .thenReturn(Mono.just(attachment))
            .thenReturn(Mono.error(new PolicyRejection()))
            .thenReturn(Mono.just(attachment));
        var results = upload(request(1, 3)).block();
        assertThat(results).hasSize(3);
        assertThat(results.get(0).uploadId()).isEqualTo("upload-id");
        assertThat(results.get(1).error().status()).isEqualTo(415);
        assertThat(results.get(2).uploadId()).isEqualTo("upload-id");
        verify(lifecycle).discardRejectedUpload("upload-id");
    }

    @Test
    void preservesResultsBeforeDraftQuotaIsReached() {
        var record = new CommentUpload();
        var metadata = new Metadata();
        metadata.setName("upload-id");
        record.setMetadata(metadata);
        record.setSpec(new CommentUpload.Spec());
        var attempts = new java.util.concurrent.atomic.AtomicInteger();
        when(lifecycle.begin("draft", "alice")).thenAnswer(invocation -> {
            if (attempts.incrementAndGet() > 20) {
                throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Draft upload limit reached"
                );
            }
            return record;
        });
        var results = upload(request(1, 21)).block();
        assertThat(results).hasSize(21);
        assertThat(results.subList(0, 20)).allMatch(image -> image.uploadId() != null);
        assertThat(results.get(20).error().status()).isEqualTo(429);
    }

    @Test
    void preservesUnknownStorageFailuresForRecovery() {
        when(attachments.upload(any(), any(), any(), any(FilePart.class), any())).thenReturn(
            Mono.error(new IllegalStateException("uncertain storage write"))
        );
        assertThat(upload(request(1, 1)).block().getFirst().error().status()).isEqualTo(500);
        org.mockito.Mockito.verify(lifecycle, org.mockito.Mockito.never()).discardRejectedUpload(
            any()
        );
    }

    private static class PolicyRejection extends ResponseStatusException {

        PolicyRejection() {
            super(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "File type is not allowed",
                null,
                "problemDetail.attachment.upload.fileTypeNotSupported",
                null
            );
        }
    }

    private Mono<Attachment> receive(FilePart file) {
        receivedFile = file;
        return DataBufferUtils.join(file.content()).map(buffer -> {
            receivedBytes = buffer.readableByteCount();
            DataBufferUtils.release(buffer);
            return attachment;
        });
    }

    private void assertTemporaryPartDeleted() {
        assertThatThrownBy(() -> receivedFile.content().then().block()).isNotNull();
    }

    @SuppressWarnings("unchecked")
    private Mono<List<UploadMediaEndpoint.UploadedImage>> upload(ServerRequest request) {
        Mono<List<UploadMediaEndpoint.UploadedImage>> result = ReflectionTestUtils.invokeMethod(
            endpoint,
            "readAndUpload",
            request,
            "draft",
            config
        );
        return result.contextWrite(
            ReactiveSecurityContextHolder.withAuthentication(
                UsernamePasswordAuthenticationToken.authenticated("alice", "", List.of())
            )
        );
    }

    private ServerRequest request(int size, int count) {
        String part =
            "--boundary\r\nContent-Disposition: form-data; name=\"files\"; " +
            "filename=\"original.avif\"\r\nContent-Type: image/avif\r\n\r\n" +
            "x".repeat(size) +
            "\r\n";
        byte[] body = (part.repeat(count) + "--boundary--\r\n").getBytes(StandardCharsets.UTF_8);
        var request = MockServerHttpRequest.post("/upload")
            .header("Content-Type", "multipart/form-data; boundary=boundary")
            .body(
                Flux.range(0, (body.length + 8191) / 8192).map(index ->
                    DefaultDataBufferFactory.sharedInstance.wrap(
                        Arrays.copyOfRange(
                            body,
                            index * 8192,
                            Math.min(body.length, (index + 1) * 8192)
                        )
                    )
                )
            );
        return ServerRequest.create(
            new DefaultServerWebExchange(
                request,
                new MockServerHttpResponse(),
                new DefaultWebSessionManager(),
                codecs,
                new AcceptHeaderLocaleContextResolver()
            ),
            codecs.getReaders()
        );
    }
}
