package run.halo.comment.widget.upload;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;
import run.halo.app.core.extension.attachment.Attachment;
import run.halo.app.core.extension.content.Comment;
import run.halo.app.core.extension.content.Reply;
import run.halo.app.extension.ExtensionClient;
import run.halo.app.extension.ListResult;
import run.halo.app.extension.Metadata;

class UploadMaintenanceTest {

    @Test
    void indexReadinessWaitsForAllBatchesAndUsesKeysetCursor() {
        var client = mock(ExtensionClient.class);
        var lifecycle = mock(UploadLifecycleService.class);
        var rows = IntStream.range(0, 100)
            .mapToObj(i -> {
                var c = new Comment();
                var m = new Metadata();
                m.setName(String.format("comment-%03d", i));
                c.setMetadata(m);
                return c;
            })
            .toList();
        when(client.listBy(eq(Comment.class), any(), any()))
            .thenReturn(new ListResult<>(rows))
            .thenReturn(new ListResult<>(List.of()));
        when(client.listBy(eq(Reply.class), any(), any())).thenReturn(new ListResult<>(List.of()));
        when(client.listBy(eq(Attachment.class), any(), any())).thenReturn(
            new ListResult<>(List.of())
        );
        var maintenance = new UploadMaintenance(client, lifecycle);
        maintenance.tick();
        verify(lifecycle).setReferenceIndexReady(false);
        verify(lifecycle, times(100)).indexReferences(eq("Comment"), any());
        maintenance.tick();
        verify(lifecycle).setReferenceIndexReady(true);
        verify(client).listBy(
            eq(Comment.class),
            argThat(o -> o.toString().contains("comment-099")),
            any()
        );
        verify(client, never()).list(any(), any(), any());
        verify(client, times(1)).listBy(eq(Attachment.class), any(), any());
    }
}
