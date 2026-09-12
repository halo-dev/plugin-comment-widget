package run.halo.comment.widget.upload;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ResolvableType;
import org.springframework.core.codec.DecodingException;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferLimitException;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.AbstractJacksonDecoder;
import org.springframework.http.codec.DecoderHttpMessageReader;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.ServerWebInputException;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import run.halo.app.security.AfterSecurityWebFilter;

@Component
@RequiredArgsConstructor
public class UploadSubmissionFilter implements AfterSecurityWebFilter {

    private static final String PREFIX = "/apis/api.halo.run/v1alpha1/comments";
    private static final ResolvableType JSON_TYPE = ResolvableType.forClass(
        tools.jackson.databind.JsonNode.class
    );
    private final UploadLifecycleService lifecycle;
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        if (!isCommentSubmission(exchange)) {
            return chain.filter(exchange);
        }
        var contentType = exchange.getRequest().getHeaders().getContentType();
        // Resolve the host's codec configuration, not a separate plugin decoder.
        var codecs = Objects.requireNonNull(
            exchange.getApplicationContext(),
            "Missing Halo application context"
        ).getBean(ServerCodecConfigurer.class);
        var decoder = jsonDecoder(codecs, decoderContentType(contentType));
        if (decoder == null) {
            return chain.filter(exchange);
        }
        return DataBufferUtils.join(exchange.getRequest().getBody(), decoder.getMaxInMemorySize())
            .onErrorMap(DataBufferLimitException.class, error ->
                new ServerWebInputException("Failed to read HTTP message", null, error)
            )
            .defaultIfEmpty(
                exchange
                    .getResponse()
                    .bufferFactory()
                    .wrap(new byte[0])
            )
            .flatMap(buffer ->
                prepareAndForward(exchange, chain, read(buffer), decoder, contentType)
            );
    }

    private boolean isCommentSubmission(ServerWebExchange exchange) {
        if (exchange.getRequest().getMethod() != HttpMethod.POST) {
            return false;
        }
        String path = exchange.getRequest().getPath().value();
        if (path.equals(PREFIX)) {
            return true;
        }
        return path.matches(PREFIX + "/[^/]+/reply");
    }

    private MediaType decoderContentType(MediaType contentType) {
        if (contentType == null) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        return contentType;
    }

    private Mono<Void> prepareAndForward(
        ServerWebExchange exchange,
        WebFilterChain chain,
        byte[] bytes,
        AbstractJacksonDecoder<?> decoder,
        MediaType contentType
    ) {
        var request = replayRequest(exchange, bytes);
        return prepare(exchange, bytes, decoder, contentType).flatMap(prepared ->
            forward(exchange, chain, request, prepared)
        );
    }

    private ServerHttpRequest replayRequest(ServerWebExchange exchange, byte[] bytes) {
        return new ServerHttpRequestDecorator(exchange.getRequest()) {
            @Override
            public Flux<DataBuffer> getBody() {
                return Flux.defer(() ->
                    Flux.just(exchange.getResponse().bufferFactory().wrap(bytes))
                );
            }
        };
    }

    private Mono<Void> forward(
        ServerWebExchange exchange,
        WebFilterChain chain,
        ServerHttpRequest request,
        Prepared prepared
    ) {
        if (prepared.submission() == null) {
            return chain.filter(exchange.mutate().request(request).build());
        }
        String id = prepared.submission().getMetadata().getName();
        var response = new UploadSubmissionResponse(
            exchange.getResponse(),
            lifecycle,
            mapper,
            id,
            targetKind(exchange)
        );
        var decorated = exchange.mutate().request(request).response(response).build();
        // Cleanup runs for completion, error and cancellation without releasing uncertain uploads.
        return Mono.usingWhen(
            Mono.just(id),
            ignored -> chain.filter(decorated),
            ignored -> response.complete(),
            (ignored, error) -> response.failed(error),
            ignored -> response.cancelled()
        );
    }

    private String targetKind(ServerWebExchange exchange) {
        if (exchange.getRequest().getPath().value().equals(PREFIX)) {
            return "Comment";
        }
        return "Reply";
    }

    private AbstractJacksonDecoder<?> jsonDecoder(
        ServerCodecConfigurer codecs,
        MediaType contentType
    ) {
        for (var reader : codecs.getReaders()) {
            if (!reader.canRead(JSON_TYPE, contentType)) {
                continue;
            }
            if (!(reader instanceof DecoderHttpMessageReader<?> decodingReader)) {
                continue;
            }
            if (decodingReader.getDecoder() instanceof AbstractJacksonDecoder<?> decoder) {
                return decoder;
            }
        }
        return null;
    }

    private Mono<Prepared> prepare(
        ServerWebExchange exchange,
        byte[] bytes,
        AbstractJacksonDecoder<?> decoder,
        MediaType contentType
    ) {
        return Mono.fromCallable(() -> decodeBody(exchange, bytes, decoder, contentType))
            .subscribeOn(Schedulers.boundedElastic())
            .filter(tools.jackson.databind.JsonNode::isObject)
            .flatMap(body -> prepareBody(exchange, body))
            .defaultIfEmpty(new Prepared(null));
    }

    private tools.jackson.databind.JsonNode decodeBody(
        ServerWebExchange exchange,
        byte[] bytes,
        AbstractJacksonDecoder<?> decoder,
        MediaType contentType
    ) {
        try {
            // Preserve original bytes; Halo still performs its own DTO validation.
            return (tools.jackson.databind.JsonNode) decoder.decode(
                exchange.getResponse().bufferFactory().wrap(bytes),
                JSON_TYPE,
                contentType,
                Map.of()
            );
        } catch (DecodingException invalidBody) {
            throw new ServerWebInputException("Failed to read HTTP message", null, invalidBody);
        }
    }

    private Mono<Prepared> prepareBody(
        ServerWebExchange exchange,
        tools.jackson.databind.JsonNode body
    ) {
        if (isOrdinaryBody(exchange, body)) {
            return Mono.just(new Prepared(null));
        }
        return UploadIdentity.currentOwner().flatMap(owner ->
            Mono.fromCallable(() -> prepareManaged(exchange, body, owner)).subscribeOn(
                Schedulers.boundedElastic()
            )
        );
    }

    private boolean isOrdinaryBody(
        ServerWebExchange exchange,
        tools.jackson.databind.JsonNode body
    ) {
        if (exchange.getRequest().getHeaders().getFirst(UploadIdentity.SUBMISSION_HEADER) != null) {
            return false;
        }
        return UploadReferences.images(body.path("content").asText()).isEmpty();
    }

    private Prepared prepareManaged(
        ServerWebExchange exchange,
        tools.jackson.databind.JsonNode body,
        String owner
    ) throws IOException {
        String ticket = exchange
            .getRequest()
            .getHeaders()
            .getFirst(UploadIdentity.SUBMISSION_HEADER);
        if (ticket != null) {
            lifecycle.available(
                ticket,
                UploadIdentity.credential(
                    exchange.getRequest().getHeaders().getFirst(UploadIdentity.TOKEN_HEADER)
                ),
                owner
            );
        }
        lifecycle.rejectBoundImages(body.path("content").asText());
        var uploads = lifecycle.referenced(body.path("content").asText());
        if (uploads.isEmpty()) {
            if (ticket != null) {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No eligible images for this submission"
                );
            }
            return new Prepared(null);
        }
        String hash = UploadIdentity.credential(
            exchange.getRequest().getHeaders().getFirst(UploadIdentity.TOKEN_HEADER)
        );
        String manifest = exchange.getRequest().getHeaders().getFirst("X-Comment-Uploads");
        var supplied = suppliedUploads(manifest);
        var expected = new HashSet<>(
            uploads
                .stream()
                .map(u -> u.getMetadata().getName())
                .toList()
        );
        if (!expected.equals(supplied)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Upload manifest does not match comment images"
            );
        }
        var submission = lifecycle.reserve(
            exchange.getRequest().getHeaders().getFirst(UploadIdentity.SUBMISSION_HEADER),
            hash,
            owner,
            exchange.getRequest().getPath().value(),
            mapper.readTree(body.toString()),
            uploads
        );
        return new Prepared(submission);
    }

    private Set<String> suppliedUploads(String manifest) {
        if (manifest == null) {
            return Set.of();
        }
        return new HashSet<>(Arrays.asList(manifest.split(",")));
    }

    private record Prepared(CommentSubmission submission) {}

    static Mono<Void> work(Runnable action) {
        return Mono.fromRunnable(action).subscribeOn(Schedulers.boundedElastic()).then();
    }

    static byte[] read(DataBuffer buffer) {
        try {
            var bytes = new byte[buffer.readableByteCount()];
            buffer.read(bytes);
            return bytes;
        } finally {
            DataBufferUtils.release(buffer);
        }
    }
}
