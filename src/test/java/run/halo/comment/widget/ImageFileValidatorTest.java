package run.halo.comment.widget;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;

class ImageFileValidatorTest {
    @TempDir
    Path directory;

    @ParameterizedTest
    @CsvSource({"jpg,image/jpeg", "png,image/png", "gif,image/gif", "webp,image/webp", "avif,image/avif"})
    void detectsRealImagesAndReplaysValidatedContent(String extension, String type) throws Exception {
        var bytes = image(extension);
        var file = ImageFileValidator.validate(file(bytes, "image." + extension, null), bytes.length).block();
        assertThat(file.headers().getContentType()).isEqualTo(MediaType.parseMediaType(type));
        assertThat(file.headers().getContentLength()).isEqualTo(bytes.length);
        for (int i = 0; i < 2; i++) {
            var buffer = DataBufferUtils.join(file.content()).block();
            try {
                var replay = new byte[buffer.readableByteCount()];
                buffer.read(replay);
                assertThat(replay).isEqualTo(bytes);
            } finally {
                DataBufferUtils.release(buffer);
            }
        }
        var target = directory.resolve("image." + extension);
        file.transferTo(target).block();
        assertThat(Files.readAllBytes(target)).isEqualTo(bytes);
    }

    @Test
    void appliesDefaultAndConfiguredSizeWithoutTruncating() {
        assertThat(ImageFileValidator.maxBytes(null)).isEqualTo(10 * 1024 * 1024);
        assertThat(ImageFileValidator.maxBytes(BigDecimal.ONE)).isEqualTo(1024 * 1024);
        assertThat(new SettingConfigGetter.UploadConfig().getMaxFileSize()).isEqualTo(BigDecimal.TEN);
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-1", "1.5", "2048", "99999999999999999999"})
    void rejectsInvalidLimits(String value) {
        assertThatThrownBy(() -> ImageFileValidator.maxBytes(new BigDecimal(value)))
            .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void countsActualBytesAndAcceptsExactLimit() throws Exception {
        var bytes = Arrays.copyOf(image("png"), 1024 * 1024);
        assertThat(ImageFileValidator.validate(file(bytes, "image.png", "image/png"), bytes.length).block()).isNotNull();
        rejects(file(bytes, "image.png", "image/png"), bytes.length - 1, HttpStatus.PAYLOAD_TOO_LARGE);
    }

    @Test
    void rejectsEmptyAndRenamedNonImages() {
        rejects(file(new byte[0], "image.png", "image/png"), 1024, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        for (var content : new String[] {"plain text", "<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>", "<html>page</html>"}) {
            rejects(file(content.getBytes(StandardCharsets.UTF_8), "image.png", "image/png"), 1024, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        }
    }

    @Test
    void rejectsConflictingExtensionAndMime() throws Exception {
        var bytes = image("png");
        rejects(file(bytes, "image.jpg", "image/png"), 1024, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        rejects(file(bytes, "image.png", "image/jpeg"), 1024, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        rejects(file(bytes, "image.png.html", "image/png"), 1024, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        assertThat(ImageFileValidator.validate(file(bytes, "image.PNG", "application/octet-stream"), 1024).block()).isNotNull();
    }

    private void rejects(FilePart file, int max, HttpStatus status) {
        assertThatThrownBy(() -> ImageFileValidator.validate(file, max).block())
            .isInstanceOfSatisfying(ResponseStatusException.class,
                error -> assertThat(error.getStatusCode()).isEqualTo(status));
    }

    private byte[] image(String extension) throws Exception {
        try (var stream = getClass().getResourceAsStream("/images/image." + extension)) {
            return stream.readAllBytes();
        }
    }

    private FilePart file(byte[] bytes, String name, String type) {
        var file = mock(FilePart.class);
        var headers = new HttpHeaders();
        if (type != null) headers.setContentType(MediaType.parseMediaType(type));
        headers.setContentLength(1); // The declared length must not bypass the actual byte limit.
        when(file.filename()).thenReturn(name);
        when(file.headers()).thenReturn(headers);
        when(file.content()).thenAnswer(invocation -> Flux.range(0, (bytes.length + 16) / 17)
            .map(i -> DefaultDataBufferFactory.sharedInstance.wrap(
                Arrays.copyOfRange(bytes, i * 17, Math.min(bytes.length, (i + 1) * 17)))));
        return file;
    }
}
