package run.halo.comment.widget.upload;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.context.support.StaticApplicationContext;
import org.springframework.core.codec.DecodingException;
import org.springframework.core.io.buffer.DataBufferLimitException;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.http.codec.json.JacksonJsonDecoder;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebInputException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import run.halo.app.extension.Metadata;

class UploadSubmissionFilterTest {

    final UploadLifecycleService service = mock(UploadLifecycleService.class);
    final ServerCodecConfigurer codecs = ServerCodecConfigurer.create();
    final UploadSubmissionFilter filter = new UploadSubmissionFilter(service);
    final String id = UUID.randomUUID().toString();
    final StaticApplicationContext host = new StaticApplicationContext();

    UploadSubmissionFilterTest() {
        host.getBeanFactory().registerSingleton("serverCodecConfigurer", codecs);
    }

    @AfterEach
    void closeContext() {
        host.close();
    }

    MockServerWebExchange mockExchange(MockServerHttpRequest request) {
        var exchange = spy(MockServerWebExchange.from(request));
        doReturn(host).when(exchange).getApplicationContext();
        return exchange;
    }

    MockServerWebExchange exchange() {
        return mockExchange(
            MockServerHttpRequest.post("/apis/api.halo.run/v1alpha1/comments")
                .header(UploadIdentity.TOKEN_HEADER, "a".repeat(64))
                .header(UploadIdentity.SUBMISSION_HEADER, id)
                .header("X-Comment-Uploads", "upload")
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"content\":\"<img src='https://example.com/a.png'>\"}")
        );
    }

    void managed() {
        var upload = new CommentUpload();
        var m = new Metadata();
        m.setName("upload");
        upload.setMetadata(m);
        when(service.referenced(any())).thenReturn(List.of(upload));
        var submission = new CommentSubmission();
        var sm = new Metadata();
        sm.setName(id);
        submission.setMetadata(sm);
        when(service.reserve(any(), any(), any(), any(), any(), any())).thenReturn(submission);
    }

    @Test
    void bindsLargeResponseWithoutApplyingTheRequestDecoderLimit() {
        managed();
        codecs.defaultCodecs().maxInMemorySize(256);
        var exchange = exchange();
        String response =
            "{\"spec\":{\"content\":\"" +
            "hello你好".repeat(100_000) +
            "\"},\"metadata\":{\"labels\":{\"kind\":\"unrelated\"},\"name\":\"created\"},\"kind\":\"Comment\"}";
        var bytes = response.getBytes(StandardCharsets.UTF_8);
        doAnswer(call -> {
            assertThat(exchange.getResponse().isCommitted()).isFalse();
            return null;
        })
            .when(service)
            .bind(any(), any(), any());
        filter
            .filter(exchange, e -> {
                e.getResponse().setStatusCode(HttpStatus.OK);
                return e.getResponse().writeWith(
                    Flux.range(0, (bytes.length + 1023) / 1024).map(index ->
                        e
                            .getResponse()
                            .bufferFactory()
                            .wrap(
                                Arrays.copyOfRange(
                                    bytes,
                                    index * 1024,
                                    Math.min(bytes.length, (index + 1) * 1024)
                                )
                            )
                    )
                );
            })
            .block();
        verify(service).bind(id, "Comment", "created");
        verify(service, never()).unknown(any());
        assertThat(exchange.getResponse().getBodyAsString().block()).isEqualTo(response);
    }

    @Test
    void bindsReplyFromFlushedResponseChunks() {
        managed();
        var exchange = mockExchange(
            MockServerHttpRequest.post("/apis/api.halo.run/v1alpha1/comments/parent/reply")
                .header(UploadIdentity.TOKEN_HEADER, "a".repeat(64))
                .header(UploadIdentity.SUBMISSION_HEADER, id)
                .header("X-Comment-Uploads", "upload")
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"content\":\"<img src='https://example.com/a.png'>\"}")
        );
        String first = "{\"metadata\":{\"name\":\"reply-created\"},";
        String last = "\"kind\":\"Reply\"}";
        filter
            .filter(exchange, e -> {
                e.getResponse().setStatusCode(HttpStatus.CREATED);
                var chunks = Flux.just(first, last).map(text ->
                    Mono.just(
                        e.getResponse().bufferFactory().wrap(text.getBytes(StandardCharsets.UTF_8))
                    )
                );
                return e.getResponse().writeAndFlushWith(chunks);
            })
            .block();
        verify(service).bind(id, "Reply", "reply-created");
        assertThat(exchange.getResponse().getBodyAsString().block()).isEqualTo(first + last);
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "{\"kind\":{\"kind\":\"Comment\",\"metadata\":{\"name\":\"forged\"}}}",
            "{\"kind\":\"Comment\",\"metadata\":{\"name\":{\"name\":\"forged\"}}}",
            "{\"kind\":\"Reply\",\"metadata\":{\"name\":\"wrong-kind\"}}",
            "{\"kind\":\"Comment\",\"metadata\":{\"name\":\"created\"},\"spec\":",
        }
    )
    void invalidResponseCannotBindAnUnverifiedTarget(String response) {
        managed();
        var exchange = exchange();
        assertThatThrownBy(() ->
            filter
                .filter(exchange, e -> {
                    e.getResponse().setStatusCode(HttpStatus.OK);
                    return e
                        .getResponse()
                        .writeWith(
                            Mono.just(
                                e
                                    .getResponse()
                                    .bufferFactory()
                                    .wrap(response.getBytes(StandardCharsets.UTF_8))
                            )
                        );
                })
                .block()
        ).isInstanceOf(IllegalStateException.class);
        verify(service, never()).bind(any(), any(), any());
        verify(service).unknown(id);
    }

    @Test
    void bindsBeforeDeliveringResponse() {
        managed();
        var exchange = exchange();
        doAnswer(call -> {
            assertThat(exchange.getResponse().isCommitted()).isFalse();
            return null;
        })
            .when(service)
            .bind(any(), any(), any());
        filter
            .filter(exchange, e -> {
                e.getResponse().setStatusCode(HttpStatus.OK);
                return e
                    .getResponse()
                    .writeWith(
                        Mono.just(
                            e
                                .getResponse()
                                .bufferFactory()
                                .wrap(
                                    "{\"kind\":\"Comment\",\"metadata\":{\"name\":\"created\"}}".getBytes()
                                )
                        )
                    );
            })
            .block();
        verify(service).bind(id, "Comment", "created");
        assertThat(exchange.getResponse().getBodyAsString().block()).contains("created");
        verify(service, never()).unknown(any());
    }

    @Test
    void usesAuthenticatedOwnerFromSecurityContext() {
        managed();
        filter
            .filter(exchange(), e -> Mono.empty())
            .contextWrite(
                ReactiveSecurityContextHolder.withAuthentication(
                    new UsernamePasswordAuthenticationToken("admin", "unused")
                )
            )
            .block();
        verify(service).reserve(any(), any(), eq("admin"), any(), any(), any());
    }

    @Test
    void validationFailureReleasesReservation() {
        managed();
        var exchange = exchange();
        filter
            .filter(exchange, e -> {
                e.getResponse().setStatusCode(HttpStatus.BAD_REQUEST);
                return e
                    .getResponse()
                    .writeWith(Mono.just(e.getResponse().bufferFactory().wrap("{}".getBytes())));
            })
            .block();
        verify(service).fail(id);
        verify(service, never()).bind(any(), any(), any());
    }

    @Test
    void serverFailureIsNotTreatedAsSafeToDelete() {
        managed();
        var exchange = exchange();
        assertThatThrownBy(() ->
            filter
                .filter(exchange, e -> Mono.error(new IllegalStateException("lost response")))
                .block()
        ).isInstanceOf(IllegalStateException.class);
        verify(service).unknown(id);
        verify(service, never()).fail(any());
    }

    @Test
    void outerErrorHandlerValidationFailureReleasesReservation() {
        managed();
        var exchange = exchange();
        assertThatThrownBy(() ->
            filter
                .filter(exchange, e ->
                    Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "disabled"))
                )
                .block()
        ).isInstanceOf(ResponseStatusException.class);
        verify(service).fail(id);
        verify(service, never()).unknown(any());
    }

    @Test
    void transformedSuccessMustMatchResourceKind() {
        managed();
        var exchange = exchange();
        assertThatThrownBy(() ->
            filter
                .filter(exchange, e -> {
                    e.getResponse().setStatusCode(HttpStatus.OK);
                    return e
                        .getResponse()
                        .writeWith(
                            Mono.just(e.getResponse().bufferFactory().wrap("{}".getBytes()))
                        );
                })
                .block()
        ).isInstanceOf(IllegalStateException.class);
        verify(service).unknown(id);
    }

    @Test
    void legacyTextCommentRetainsOriginalBody() {
        when(service.referenced(any())).thenReturn(List.of());
        var exchange = mockExchange(
            MockServerHttpRequest.post("/apis/api.halo.run/v1alpha1/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"content\":\"https://example.com/a.png\"}")
        );
        filter
            .filter(exchange, e ->
                e
                    .getRequest()
                    .getBody()
                    .doOnNext(buffer -> {
                        String body = new String(UploadSubmissionFilter.read(buffer));
                        assertThat(body).contains("https://example.com/a.png");
                    })
                    .then()
            )
            .block();
        verifyNoInteractions(service);
    }

    @Test
    void purgedTicketIsRejectedEvenWhenUploadRecordsAreGone() {
        when(service.available(any(), any(), any())).thenThrow(
            new ResponseStatusException(HttpStatus.NOT_FOUND)
        );
        assertThatThrownBy(() ->
            filter
                .filter(exchange(), e -> {
                    throw new AssertionError("must not create comment");
                })
                .block()
        ).isInstanceOf(ResponseStatusException.class);
        verify(service, never()).reserve(any(), any(), any(), any(), any(), any());
    }

    @Test
    void invalidManifestStopsBeforeCoreCreation() {
        managed();
        var exchange = mockExchange(
            MockServerHttpRequest.post("/apis/api.halo.run/v1alpha1/comments")
                .header(UploadIdentity.TOKEN_HEADER, "a".repeat(64))
                .header("X-Comment-Uploads", "someone-else")
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"content\":\"<img src='image'>\"}")
        );
        assertThatThrownBy(() ->
            filter
                .filter(exchange, e -> {
                    throw new AssertionError("must not delegate");
                })
                .block()
        ).isInstanceOf(ResponseStatusException.class);
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "/apis/api.halo.run/v1alpha1/comments",
            "/apis/api.halo.run/v1alpha1/comments/parent/reply",
        }
    )
    void ordinaryPayloadAboveOneMiBUsesHaloLimit(String path) {
        codecs.defaultCodecs().maxInMemorySize(3 * 1024 * 1024);
        String body = "{\"content\":\"" + "a".repeat(1100 * 1024) + "\",\"raw\":\"plain text\"}";
        var exchange = mockExchange(
            MockServerHttpRequest.post(path).contentType(MediaType.APPLICATION_JSON).body(body)
        );
        filter
            .filter(exchange, e ->
                DataBufferUtils.join(e.getRequest().getBody())
                    .doOnNext(buffer ->
                        assertThat(
                            new String(UploadSubmissionFilter.read(buffer), StandardCharsets.UTF_8)
                        ).isEqualTo(body)
                    )
                    .then()
            )
            .block();
        verifyNoInteractions(service);
    }

    @Test
    void honorsHaloConfiguredMemoryLimit() {
        codecs.defaultCodecs().maxInMemorySize(32);
        var exchange = mockExchange(
            MockServerHttpRequest.post("/apis/api.halo.run/v1alpha1/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"content\":\"" + "a".repeat(100) + "\"}")
        );
        assertThatThrownBy(() ->
            filter
                .filter(exchange, e -> {
                    throw new AssertionError("must not create oversized comment");
                })
                .block()
        )
            .isInstanceOf(ServerWebInputException.class)
            .hasCauseInstanceOf(DataBufferLimitException.class);
        verifyNoInteractions(service);
    }

    @Test
    void usesHaloJsonDecoderConfiguration() {
        var mapper = tools.jackson.databind.json.JsonMapper.builder()
            .enable(tools.jackson.core.json.JsonReadFeature.ALLOW_JAVA_COMMENTS)
            .build();
        codecs.defaultCodecs().jacksonJsonDecoder(new JacksonJsonDecoder(mapper));
        String body = "{/* accepted by the configured Halo decoder */\"content\":\"hello\"}";
        var exchange = mockExchange(
            MockServerHttpRequest.post("/apis/api.halo.run/v1alpha1/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
        );
        filter
            .filter(exchange, e ->
                e
                    .getRequest()
                    .getBody()
                    .doOnNext(buffer ->
                        assertThat(new String(UploadSubmissionFilter.read(buffer))).isEqualTo(body)
                    )
                    .then()
            )
            .block();
        verifyNoInteractions(service);
    }

    @Test
    void unsupportedMediaTypeIsLeftToHalo() {
        var exchange = mockExchange(
            MockServerHttpRequest.post("/apis/api.halo.run/v1alpha1/comments")
                .contentType(MediaType.TEXT_PLAIN)
                .body("not json")
        );
        filter
            .filter(exchange, e -> {
                assertThat(e).isSameAs(exchange);
                return Mono.empty();
            })
            .block();
        verifyNoInteractions(service);
    }

    @Test
    void malformedJsonRetainsFrameworkDecoderError() {
        var exchange = mockExchange(
            MockServerHttpRequest.post("/apis/api.halo.run/v1alpha1/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .body("{bad json")
        );
        assertThatThrownBy(() ->
            filter
                .filter(exchange, e -> {
                    throw new AssertionError("must not create malformed comment");
                })
                .block()
        )
            .isInstanceOf(ServerWebInputException.class)
            .hasCauseInstanceOf(DecodingException.class);
        verifyNoInteractions(service);
    }

    @Test
    void externalImageDoesNotRequireUploadHeaders() {
        String body = "{\"content\":\"<img src='https://external.example/photo.png'>\"}";
        var exchange = mockExchange(
            MockServerHttpRequest.post("/apis/api.halo.run/v1alpha1/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
        );
        filter
            .filter(exchange, e -> {
                assertThat(
                    e.getRequest().getHeaders().getFirst(UploadIdentity.SUBMISSION_HEADER)
                ).isNull();
                return e
                    .getRequest()
                    .getBody()
                    .doOnNext(buffer ->
                        assertThat(new String(UploadSubmissionFilter.read(buffer))).isEqualTo(body)
                    )
                    .then();
            })
            .block();
        verify(service).rejectBoundImages("<img src='https://external.example/photo.png'>");
        verify(service).referenced("<img src='https://external.example/photo.png'>");
        verifyNoMoreInteractions(service);
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "/apis/api.halo.run/v1alpha1/comments",
            "/apis/api.halo.run/v1alpha1/comments/parent/reply",
        }
    )
    void temporaryManagedImageCannotBypassOwnershipWithoutHeaders(String path) {
        managed();
        var exchange = mockExchange(
            MockServerHttpRequest.post(path)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"content\":\"<img src='https://example.com/a.png'>\"}")
        );
        assertThatThrownBy(() ->
            filter
                .filter(exchange, e -> {
                    throw new AssertionError("must not accept unowned image");
                })
                .block()
        ).isInstanceOf(ResponseStatusException.class);
        verify(service, never()).reserve(any(), any(), any(), any(), any(), any());
    }

    @Test
    void boundManagedImageCannotBypassOwnershipWithoutHeaders() {
        var conflict = new ResponseStatusException(HttpStatus.CONFLICT);
        doThrow(conflict).when(service).rejectBoundImages(any());
        var exchange = mockExchange(
            MockServerHttpRequest.post("/apis/api.halo.run/v1alpha1/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"content\":\"<img src='https://example.com/a.png'>\"}")
        );
        assertThatThrownBy(() ->
            filter
                .filter(exchange, e -> {
                    throw new AssertionError("must not reassign bound image");
                })
                .block()
        ).isSameAs(conflict);
    }

    @Test
    void expiredTicketCannotFallBackToTextComment() {
        var expired = new ResponseStatusException(HttpStatus.GONE);
        when(service.available(any(), any(), any())).thenThrow(expired);
        var exchange = mockExchange(
            MockServerHttpRequest.post("/apis/api.halo.run/v1alpha1/comments")
                .header(UploadIdentity.TOKEN_HEADER, "a".repeat(64))
                .header(UploadIdentity.SUBMISSION_HEADER, id)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"content\":\"hello\"}")
        );
        assertThatThrownBy(() ->
            filter
                .filter(exchange, e -> {
                    throw new AssertionError("must not replay expired ticket");
                })
                .block()
        ).isSameAs(expired);
    }

    @Test
    void ordinaryEndpointErrorsAreNotRewrittenByUploadFilter() {
        var original = new DataBufferLimitException("core error");
        var exchange = mockExchange(
            MockServerHttpRequest.post("/apis/api.halo.run/v1alpha1/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"content\":\"hello\"}")
        );
        assertThatThrownBy(() ->
            filter.filter(exchange, e -> Mono.error(original)).block()
        ).isSameAs(original);
        verifyNoInteractions(service);
    }

    @Test
    void cancellationAfterReservationKeepsTheOutcomeUnknown() throws Exception {
        managed();
        var entered = new CountDownLatch(1);
        var running = filter
            .filter(exchange(), exchange -> {
                entered.countDown();
                return Mono.never();
            })
            .subscribe();
        try {
            assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();
        } finally {
            running.dispose();
        }
        verify(service, timeout(1000)).unknown(id);
        verify(service, never()).fail(any());
    }
}
