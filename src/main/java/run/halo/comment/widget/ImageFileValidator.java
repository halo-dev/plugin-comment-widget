package run.halo.comment.widget;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.file.Path;
import java.util.Set;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferLimitException;
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

    static Mono<FilePart> validate(FilePart file, int maxBytes) {
        return DataBufferUtils.join(file.content(), maxBytes)
            .onErrorMap(DataBufferLimitException.class, error -> new ResponseStatusException(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "Image size must not exceed " + maxBytes / MIB + " MiB."
            ))
            .map(buffer -> {
                try {
                    byte[] bytes = new byte[buffer.readableByteCount()];
                    buffer.read(bytes);
                    return bytes;
                } finally {
                    DataBufferUtils.release(buffer);
                }
            })
            .switchIfEmpty(Mono.error(unsupported()))
            .flatMap(bytes -> Mono.fromCallable(() -> {
                var detected = FileTypeDetectUtils.detectMimeType(new ByteArrayInputStream(bytes));
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
                return (FilePart) new ValidatedFilePart(file, bytes, type);
            }).subscribeOn(Schedulers.boundedElastic()));
    }

    private static ResponseStatusException unsupported() {
        return new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
            "Only JPEG, PNG, GIF, WebP, and AVIF images are supported.");
    }

    record ValidatedFilePart(FilePart source, byte[] bytes, MediaType type) implements FilePart {
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
            headers.setContentLength(bytes.length);
            return HttpHeaders.readOnlyHttpHeaders(headers);
        }

        @Override
        public Flux<DataBuffer> content() {
            return Flux.defer(() -> Flux.just(DefaultDataBufferFactory.sharedInstance.wrap(bytes)));
        }

        @Override
        public Mono<Void> transferTo(Path destination) {
            return DataBufferUtils.write(content(), destination);
        }

        @Override
        public Mono<Void> delete() {
            return source.delete();
        }
    }
}
