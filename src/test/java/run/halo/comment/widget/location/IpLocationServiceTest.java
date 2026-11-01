package run.halo.comment.widget.location;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.OptimisticLockingFailureException;
import run.halo.app.core.extension.content.Comment;
import run.halo.app.core.extension.content.Reply;
import run.halo.app.extension.ConfigMap;
import run.halo.app.extension.ExtensionClient;
import run.halo.app.extension.Metadata;
import run.halo.app.plugin.PluginContext;

class IpLocationServiceTest {

    private final ExtensionClient client = mock(ExtensionClient.class);
    private final IpLocationResolver resolver = mock(IpLocationResolver.class);
    private final PluginContext context = PluginContext.builder().configMapName("settings").build();
    private final IpLocationService service = new IpLocationService(client, context, resolver);
    private final ConfigMap config = new ConfigMap();

    @BeforeEach
    void setUp() {
        config.setData(new HashMap<>(Map.of("basic", "{\"showIpLocation\":true}")));
        when(client.fetch(ConfigMap.class, "settings")).thenReturn(Optional.of(config));
        when(resolver.resolve("1.0.1.1")).thenReturn("福建省");
    }

    @Test
    void enrichesCommentsAndRepliesOnceWithoutCopyingTheIp() {
        var comment = comment();
        comment.getMetadata().setAnnotations(new HashMap<>(Map.of("existing", "keep")));
        var reply = new Reply();
        reply.setMetadata(metadata("reply"));
        var spec = new Reply.ReplySpec();
        spec.setIpAddress("1.0.1.1");
        reply.setSpec(spec);
        when(client.fetch(Comment.class, "comment")).thenReturn(Optional.of(comment));
        when(client.fetch(Reply.class, "reply")).thenReturn(Optional.of(reply));

        service.reconcileComment("comment");
        service.reconcileReply("reply");
        service.reconcileComment("comment");
        service.reconcileReply("reply");

        assertThat(comment.getMetadata().getAnnotations()).containsExactlyInAnyOrderEntriesOf(
            Map.of("existing", "keep", IpLocationService.ANNOTATION, "福建省"));
        assertThat(reply.getMetadata().getAnnotations())
            .containsExactlyEntriesOf(Map.of(IpLocationService.ANNOTATION, "福建省"));
        assertThat(comment.getSpec().getIpAddress()).isEqualTo("1.0.1.1");
        verify(client).update(comment);
        verify(client).update(reply);
        verify(resolver, times(2)).resolve("1.0.1.1");
    }

    @Test
    void doesNothingWhenDisabledOrSettingsAreAbsent() {
        for (var settings : new String[] {"{}", "{\"showIpLocation\":false}"}) {
            config.getData().put("basic", settings);
            service.reconcileComment("comment");
            service.reconcileReply("reply");
        }
        config.setData(null);
        service.reconcileComment("comment");
        when(client.fetch(ConfigMap.class, "settings")).thenReturn(Optional.empty());
        service.reconcileReply("reply");
        verifyNoInteractions(resolver);
        verify(client, never()).update(any());
    }

    @Test
    void skipsDeletedRecordsAndEmptyResults() {
        var comment = comment();
        when(client.fetch(Comment.class, "comment")).thenReturn(Optional.of(comment));
        comment.getMetadata().setDeletionTimestamp(Instant.now());
        service.reconcileComment("comment");
        verifyNoInteractions(resolver);

        comment.getMetadata().setDeletionTimestamp(null);
        when(resolver.resolve(any())).thenReturn("");
        service.reconcileComment("comment");
        verify(client, never()).update(any());
        assertThat(comment.getMetadata().getAnnotations()).isNull();
    }

    @Test
    void checksTheSwitchAgainBeforePublishingAResult() {
        when(client.fetch(Comment.class, "comment")).thenReturn(Optional.of(comment()));
        when(resolver.resolve(any())).thenAnswer(invocation -> {
            config.getData().put("basic", "{\"showIpLocation\":false}");
            return "福建省";
        });
        service.reconcileComment("comment");
        verify(client, never()).update(any());
    }

    @Test
    void aConflictCanBeRetriedWithoutOverwritingConcurrentChanges() {
        var first = comment();
        var updated = comment();
        updated.getMetadata().setAnnotations(new HashMap<>(Map.of("other", "new")));
        when(client.fetch(Comment.class, "comment"))
            .thenReturn(Optional.of(first), Optional.of(updated));
        doThrow(new OptimisticLockingFailureException("conflict")).when(client).update(first);

        assertThatThrownBy(() -> service.reconcileComment("comment"))
            .isInstanceOf(OptimisticLockingFailureException.class);
        service.reconcileComment("comment");
        verify(client).update(updated);
        assertThat(updated.getMetadata().getAnnotations()).containsEntry("other", "new");
    }

    private static Comment comment() {
        var comment = new Comment();
        comment.setMetadata(metadata("comment"));
        var spec = new Comment.CommentSpec();
        spec.setIpAddress("1.0.1.1");
        comment.setSpec(spec);
        return comment;
    }

    private static Metadata metadata(String name) {
        var metadata = new Metadata();
        metadata.setName(name);
        return metadata;
    }
}
