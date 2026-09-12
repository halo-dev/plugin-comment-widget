package run.halo.comment.widget.upload;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import org.reactivestreams.Publisher;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.web.ErrorResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Records the submission outcome before forwarding Halo's unchanged response. */
final class UploadSubmissionResponse extends ServerHttpResponseDecorator {

    private static final Set<Integer> REJECTED_STATUSES = Set.of(400, 401, 403, 404, 413, 422, 429);
    private final UploadLifecycleService lifecycle;
    private final ObjectMapper mapper;
    private final String submissionId;
    private final String targetKind;
    private final AtomicBoolean handled = new AtomicBoolean();

    UploadSubmissionResponse(
        ServerHttpResponse response,
        UploadLifecycleService lifecycle,
        ObjectMapper mapper,
        String submissionId,
        String targetKind
    ) {
        super(response);
        this.lifecycle = lifecycle;
        this.mapper = mapper;
        this.submissionId = submissionId;
        this.targetKind = targetKind;
    }

    @Override
    public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
        return UploadResponseBody.use(body, this::recordAndWrite);
    }

    private Mono<Void> recordAndWrite(UploadResponseBody body) {
        return UploadSubmissionFilter.work(() -> {
            recordOutcome(body);
            handled.set(true);
        }).then(super.writeWith(body.read(bufferFactory())));
    }

    private void recordOutcome(UploadResponseBody body) {
        var status = getStatusCode();
        if (status == null) {
            lifecycle.unknown(submissionId);
            return;
        }
        if (status.is2xxSuccessful()) {
            bindCreatedTarget(body);
            return;
        }
        if (isRejected(status)) {
            lifecycle.fail(submissionId);
            return;
        }
        lifecycle.unknown(submissionId);
    }

    private void bindCreatedTarget(UploadResponseBody body) {
        try {
            if (Files.size(body.path()) == 0) {
                lifecycle.unknown(submissionId);
                return;
            }
            try (var parser = mapper.getFactory().createParser(body.path().toFile())) {
                String name = readTargetName(parser);
                lifecycle.bind(submissionId, targetKind, name);
            }
        } catch (IOException error) {
            throw new IllegalStateException(error);
        }
    }

    private String readTargetName(JsonParser parser) throws IOException {
        if (parser.nextToken() != JsonToken.START_OBJECT) {
            throw new IllegalStateException("Invalid comment response");
        }
        String kind = null;
        String name = null;
        while (parser.nextToken() == JsonToken.FIELD_NAME) {
            String field = parser.currentName();
            parser.nextToken();
            if ("kind".equals(field)) {
                kind = readString(parser);
                continue;
            }
            if ("metadata".equals(field)) {
                name = readMetadataName(parser);
                continue;
            }
            parser.skipChildren();
        }
        if (!targetKind.equals(kind)) {
            throw new IllegalStateException("Invalid comment response");
        }
        if (name == null) {
            throw new IllegalStateException("Invalid comment response");
        }
        if (name.isBlank()) {
            throw new IllegalStateException("Invalid comment response");
        }
        return name;
    }

    private String readMetadataName(JsonParser parser) throws IOException {
        if (parser.currentToken() != JsonToken.START_OBJECT) {
            parser.skipChildren();
            return null;
        }
        String name = null;
        while (parser.nextToken() == JsonToken.FIELD_NAME) {
            String field = parser.currentName();
            parser.nextToken();
            if ("name".equals(field)) {
                name = readString(parser);
                continue;
            }
            parser.skipChildren();
        }
        return name;
    }

    private String readString(JsonParser parser) throws IOException {
        if (parser.currentToken() != JsonToken.VALUE_STRING) {
            parser.skipChildren();
            return null;
        }
        return parser.getText();
    }

    @Override
    public Mono<Void> writeAndFlushWith(Publisher<? extends Publisher<? extends DataBuffer>> body) {
        return writeWith(Flux.from(body).concatMap(Flux::from));
    }

    Mono<Void> complete() {
        if (handled.get()) {
            return Mono.empty();
        }
        return cancelled();
    }

    Mono<Void> failed(Throwable error) {
        return UploadSubmissionFilter.work(() -> recordFailure(error));
    }

    private void recordFailure(Throwable error) {
        // Preserve the original rule: an error after handling remains uncertain.
        if (handled.get()) {
            lifecycle.unknown(submissionId);
            return;
        }
        if (error instanceof ErrorResponse responseError) {
            if (isRejected(responseError.getStatusCode())) {
                lifecycle.fail(submissionId);
                return;
            }
        }
        lifecycle.unknown(submissionId);
    }

    Mono<Void> cancelled() {
        return UploadSubmissionFilter.work(() -> lifecycle.unknown(submissionId));
    }

    private static boolean isRejected(HttpStatusCode status) {
        return REJECTED_STATUSES.contains(status.value());
    }
}
