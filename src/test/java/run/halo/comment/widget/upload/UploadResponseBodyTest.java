package run.halo.comment.widget.upload;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.awaitility.Awaitility.await;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

class UploadResponseBodyTest {

    @Test
    void removesSpoolAfterSuccessfulConsumption() {
        var path = new AtomicReference<Path>();
        UploadResponseBody.use(source(), body -> {
            path.set(body.path());
            assertThat(body.path()).hasContent("response");
            return Mono.empty();
        }).block();
        assertThat(path.get()).doesNotExist();
    }

    @Test
    void removesSpoolWhenBindingFails() {
        var path = new AtomicReference<Path>();
        var failure = new IllegalStateException("binding failed");
        var operation = UploadResponseBody.use(source(), body -> {
            path.set(body.path());
            return Mono.error(failure);
        });
        assertThatThrownBy(operation::block).isSameAs(failure);
        assertThat(path.get()).doesNotExist();
    }

    @Test
    void removesSpoolWhenResponseIsCancelled() throws Exception {
        var path = new AtomicReference<Path>();
        var entered = new CountDownLatch(1);
        var subscription = UploadResponseBody.use(source(), body -> {
            path.set(body.path());
            entered.countDown();
            return Mono.never();
        }).subscribe();
        try {
            assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();
            assertThat(Files.exists(path.get())).isTrue();
        } finally {
            subscription.dispose();
        }
        await()
            .atMost(Duration.ofSeconds(5))
            .untilAsserted(() -> assertThat(path.get()).doesNotExist());
    }

    @Test
    void removesSpoolCreatedDuringCancellation() throws Exception {
        var path = Files.createTempFile("response-cancellation-test-", ".json");
        var created = new CountDownLatch(1);
        var release = new CompletableFuture<Void>();
        var consumed = new AtomicBoolean();
        var subscription = UploadResponseBody.use(Mono.empty(), body -> {
            consumed.set(true);
            return Mono.empty();
        }, () -> {
            created.countDown();
            // Hold resource delivery across cancellation, even if the worker is interrupted.
            release.join();
            return path;
        }).subscribe();
        try {
            assertThat(created.await(5, TimeUnit.SECONDS)).isTrue();
            subscription.dispose();
            release.complete(null);
            await().atMost(Duration.ofSeconds(5))
                .untilAsserted(() -> assertThat(path).doesNotExist());
            assertThat(consumed).isFalse();
        } finally {
            subscription.dispose();
            release.complete(null);
            Files.deleteIfExists(path);
        }
    }

    @Test
    void replaysLargeBodiesInBoundedChunks() {
        var total = new AtomicInteger();
        var largest = new AtomicInteger();
        var content = Flux.range(0, 256).map(index ->
            DefaultDataBufferFactory.sharedInstance.wrap(new byte[4096])
        );
        UploadResponseBody.use(content, body ->
            body
                .read(DefaultDataBufferFactory.sharedInstance)
                .doOnNext(buffer -> {
                    total.addAndGet(buffer.readableByteCount());
                    largest.accumulateAndGet(buffer.readableByteCount(), Math::max);
                    DataBufferUtils.release(buffer);
                })
                .then()
        ).block();
        assertThat(total.get()).isEqualTo(1024 * 1024);
        assertThat(largest.get()).isLessThanOrEqualTo(64 * 1024);
    }

    private Mono<DataBuffer> source() {
        return Mono.just(
            DefaultDataBufferFactory.sharedInstance.wrap(
                "response".getBytes(StandardCharsets.UTF_8)
            )
        );
    }
}
