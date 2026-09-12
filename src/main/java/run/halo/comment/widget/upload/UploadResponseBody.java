package run.halo.comment.widget.upload;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.function.Function;
import org.reactivestreams.Publisher;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.core.io.buffer.DataBufferUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/** Spools response bytes to disk so binding can precede delivery without aggregating them in memory. */
final class UploadResponseBody {

    private final Path path;

    private UploadResponseBody(Path path) {
        this.path = path;
    }

    static Mono<Void> use(
        Publisher<? extends DataBuffer> source,
        Function<UploadResponseBody, Mono<Void>> consume
    ) {
        var resource = Mono.fromCallable(() ->
            new UploadResponseBody(Files.createTempFile("comment-upload-response-", ".json"))
        )
            .subscribeOn(Schedulers.boundedElastic())
            .doOnDiscard(UploadResponseBody.class, UploadResponseBody::delete);
        return Mono.usingWhen(
            resource,
            body ->
                DataBufferUtils.write(
                    Flux.<DataBuffer>from(source).doOnDiscard(DataBuffer.class, DataBufferUtils::release),
                    body.path
                ).then(Mono.defer(() -> consume.apply(body))),
            UploadResponseBody::cleanup,
            (body, error) -> body.cleanup(),
            UploadResponseBody::cleanup
        );
    }

    Path path() {
        return path;
    }

    Flux<DataBuffer> read(DataBufferFactory factory) {
        return DataBufferUtils.read(path, factory, 64 * 1024);
    }

    private Mono<Void> cleanup() {
        return Mono.fromRunnable(this::delete).subscribeOn(Schedulers.boundedElastic()).then();
    }

    private void delete() {
        try {
            Files.deleteIfExists(path);
        } catch (IOException error) {
            throw new UncheckedIOException(error);
        }
    }
}
