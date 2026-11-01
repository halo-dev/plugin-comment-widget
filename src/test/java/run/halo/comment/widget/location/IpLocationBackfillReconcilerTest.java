package run.halo.comment.widget.location;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;
import org.springframework.dao.OptimisticLockingFailureException;
import run.halo.app.core.extension.content.Comment;
import run.halo.app.core.extension.content.Reply;
import run.halo.app.extension.ConfigMap;
import run.halo.app.extension.ExtensionClient;
import run.halo.app.extension.ListResult;
import run.halo.app.extension.Metadata;
import run.halo.app.extension.controller.Reconciler.Request;
import run.halo.app.plugin.PluginContext;

class IpLocationBackfillReconcilerTest {

    private final ExtensionClient client = mock(ExtensionClient.class);
    private final IpLocationService service = mock(IpLocationService.class);
    private final PluginContext context = PluginContext.builder().configMapName("settings").build();
    private final IpLocationBackfillReconciler reconciler =
        new IpLocationBackfillReconciler(client, context, service);
    private final Request request = new Request("settings");

    @Test
    void scansCommentsAndRepliesInBoundedKeysetPages() {
        when(service.isEnabled()).thenReturn(true);
        var names = IntStream.range(0, 100).mapToObj(i -> "comment-%03d".formatted(i)).toList();
        when(client.listNamesBy(eq(Comment.class), any(), any()))
            .thenReturn(new ListResult<>(names), new ListResult<>(List.of("last-comment")));
        when(client.listNamesBy(eq(Reply.class), any(), any()))
            .thenReturn(new ListResult<>(List.of("reply")));

        assertThat(reconciler.reconcile(request).reEnqueue()).isTrue();
        verify(service, times(100)).reconcileComment(any());
        verify(service, never()).reconcileReply(any());
        assertThat(reconciler.reconcile(request).reEnqueue()).isTrue();
        verify(client).listNamesBy(eq(Comment.class),
            argThat(options -> options.toString().contains("comment-099")), any());
        assertThat(reconciler.reconcile(request).reEnqueue()).isFalse();
        verify(service).reconcileReply("reply");
    }

    @Test
    void resumesAfterAConflictAndRestartsAfterReenabling() {
        when(service.isEnabled()).thenReturn(true);
        when(client.listNamesBy(eq(Comment.class), any(), any()))
            .thenReturn(new ListResult<>(List.of("a", "b")),
                new ListResult<>(List.of("b")), new ListResult<>(List.of("a", "b")));
        doThrow(new OptimisticLockingFailureException("conflict")).doNothing()
            .when(service).reconcileComment("b");

        assertThatThrownBy(() -> reconciler.reconcile(request))
            .isInstanceOf(OptimisticLockingFailureException.class);
        assertThat(reconciler.reconcile(request).reEnqueue()).isTrue();
        verify(client).listNamesBy(eq(Comment.class),
            argThat(options -> options.toString().contains("a")), any());

        when(service.isEnabled()).thenReturn(false);
        assertThat(reconciler.reconcile(request).reEnqueue()).isFalse();
        when(service.isEnabled()).thenReturn(true);
        assertThat(reconciler.reconcile(request).reEnqueue()).isTrue();
        verify(service, times(2)).reconcileComment("a");
    }

    @Test
    void ignoresOtherSettingsAndDoesNotScanWhileDisabled() {
        reconciler.reconcile(new Request("another-plugin"));
        verifyNoInteractions(service, client);
        assertThat(reconciler.reconcile(request).reEnqueue()).isFalse();
        verify(client, never()).listNamesBy(any(), any(), any());
    }

    @Test
    void restartsTheCursorIfSettingsChangeDuringABatch() {
        var config = new ConfigMap();
        var metadata = new Metadata();
        metadata.setVersion(1L);
        config.setMetadata(metadata);
        when(client.fetch(ConfigMap.class, "settings")).thenReturn(Optional.of(config));
        when(service.isEnabled()).thenReturn(true);
        var names = IntStream.range(0, 100).mapToObj(i -> "comment-%03d".formatted(i)).toList();
        when(client.listNamesBy(eq(Comment.class), any(), any()))
            .thenReturn(new ListResult<>(names));
        doAnswer(invocation -> {
            // Disable and re-enable before the next controller invocation.
            metadata.setVersion(3L);
            return null;
        }).when(service).reconcileComment("comment-000");

        reconciler.reconcile(request);
        reconciler.reconcile(request);

        verify(client, times(2)).listNamesBy(eq(Comment.class),
            argThat(options -> !options.toString().contains("comment-099")), any());
        verify(service, times(2)).reconcileComment("comment-000");
    }
}
