package run.halo.comment.widget;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Function;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebInputException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import run.halo.app.infra.utils.FileTypeDetectUtils;

@Slf4j
final class ImageFileValidator {

    private static final int MIB = 1024 * 1024;
    private static final Set<String> TYPES = Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"
    );

    private ImageFileValidator() {}

    static int maxBytes(BigDecimal configured) {
        try {
            int size = (configured == null ? BigDecimal.TEN : configured).intValueExact();
            if (size <= 0) {
                throw new ArithmeticException();
            }
            return Math.multiplyExact(size, MIB);
        } catch (ArithmeticException error) {
            throw new ServerWebInputException("Image size limit must be an integer between 1 and 2047 MiB.");
        }
    }

    static <T> Mono<T> withValidatedFile(FilePart file, int maxBytes,
        Function<FilePart, Mono<T>> action) {
        return withValidatedFile(file, maxBytes, action,
            () -> Files.createTempFile("comment-image-", ".tmp"));
    }

    static <T> Mono<T> withValidatedFile(FilePart file, int maxBytes,
        Function<FilePart, Mono<T>> action, Callable<Path> createTempFile) {
        return Mono.usingWhen(
            Mono.fromCallable(createTempFile)
                // Keep cancellation discard handling when the file is created after cancellation.
                .hide()
                .subscribeOn(Schedulers.boundedElastic())
                .doOnDiscard(Path.class, path -> deleteFile(path).subscribe()),
            path -> {
                var size = new AtomicLong();
                var content = file.content().<DataBuffer>handle((buffer, sink) -> {
                    if (size.addAndGet(buffer.readableByteCount()) > maxBytes) {
                        DataBufferUtils.release(buffer);
                        sink.error(new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                            "Image size must not exceed " + maxBytes / MIB + " MiB."));
                    } else {
                        sink.next(buffer);
                    }
                }).doOnDiscard(DataBuffer.class, DataBufferUtils::release);
                return DataBufferUtils.write(content, path)
                    .then(Mono.fromCallable(() -> {
                        var detected = FileTypeDetectUtils.detectMimeType(Files.newInputStream(path));
                        if (!TYPES.contains(detected)) {
                            throw unsupported();
                        }
                        var type = MediaType.parseMediaType(detected);
                        var declared = file.headers().getContentType();
                        if (!FileTypeDetectUtils.isValidExtensionForMime(detected, file.filename())
                            || (declared != null
                            && !MediaType.APPLICATION_OCTET_STREAM.equalsTypeAndSubtype(declared)
                            && !type.equalsTypeAndSubtype(declared))) {
                            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                                "Image file extension or content type does not match file content.");
                        }
                        return (FilePart) new ValidatedFilePart(file, path, size.get(), type);
                    }).subscribeOn(Schedulers.boundedElastic()))
                    .flatMap(action);
            },
            ImageFileValidator::deleteFile,
            (path, error) -> deleteFile(path),
            ImageFileValidator::deleteFile
        );
    }

    private static Mono<Void> deleteFile(Path path) {
        return Mono.fromCallable(() -> Files.deleteIfExists(path))
            .subscribeOn(Schedulers.boundedElastic())
            .doOnError(error -> log.warn("Failed to delete temporary comment image {}", path, error))
            .onErrorComplete()
            .then();
    }

    private static ResponseStatusException unsupported() {
        return new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
            "Only JPEG, PNG, GIF, WebP, and AVIF images are supported.");
    }

    record ValidatedFilePart(FilePart source, Path path, long size, MediaType type) implements FilePart {
        @Override
        public String filename() {
            return source.filename();
        }

        @Override
        public String name() {
            return source.name();
        }

        @Override
        public HttpHeaders headers() {
            var headers = new HttpHeaders();
            headers.putAll(source.headers());
            headers.setContentType(type);
            headers.setContentLength(size);
            return HttpHeaders.readOnlyHttpHeaders(headers);
        }

        @Override
        public Flux<DataBuffer> content() {
            return DataBufferUtils.read(path, DefaultDataBufferFactory.sharedInstance, 8192)
                .subscribeOn(Schedulers.boundedElastic());
        }

        @Override
        public Mono<Void> transferTo(Path destination) {
            return DataBufferUtils.write(content(), destination)
                .subscribeOn(Schedulers.boundedElastic());
        }

        @Override
        public Mono<Void> delete() {
            return source.delete();
        }
    }
}
