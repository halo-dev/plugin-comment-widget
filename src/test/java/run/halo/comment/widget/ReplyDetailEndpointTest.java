package run.halo.comment.widget;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;
import run.halo.app.core.extension.Counter;
import run.halo.app.core.extension.User;
import run.halo.app.core.extension.content.Comment;
import run.halo.app.core.extension.content.Reply;
import run.halo.app.core.user.service.UserService;
import run.halo.app.extension.Metadata;
import run.halo.app.extension.ReactiveExtensionClient;

class ReplyDetailEndpointTest {
    ReactiveExtensionClient client;
    UserService users;
    Comment comment;
    Reply reply;
    WebTestClient web;

    @BeforeEach
    void setUp() {
        client = mock(ReactiveExtensionClient.class);
        users = mock(UserService.class);
        comment = new Comment();
        comment.setMetadata(metadata("comment"));
        comment.setSpec(new Comment.CommentSpec());
        initialize(comment.getSpec(), "parent");
        reply = new Reply();
        reply.setMetadata(metadata("reply"));
        reply.setSpec(new Reply.ReplySpec());
        initialize(reply.getSpec(), "reader");
        reply.getSpec().setCommentName("comment");
        when(client.fetch(Comment.class, "comment")).thenReturn(Mono.just(comment));
        when(client.fetch(Reply.class, "reply")).thenReturn(Mono.just(reply));
        when(client.fetch(Counter.class, "replies.content.halo.run/reply"))
            .thenReturn(Mono.just(Counter.emptyCounter("counter")));
        when(users.hasSufficientRoles(Set.of("role-template-view-comments"))).thenReturn(Mono.just(false));
        var user = new User();
        user.setMetadata(metadata("reader"));
        user.setSpec(new User.UserSpec());
        user.getSpec().setDisplayName("Reader");
        user.getSpec().setEmail("reader@example.com");
        when(users.getUserOrGhost("reader")).thenReturn(Mono.just(user));
        web = WebTestClient.bindToRouterFunction(new ReplyDetailEndpoint(client, users).endpoint())
            .webFilter((exchange, chain) -> {
                var name = exchange.getRequest().getHeaders().getFirst("X-Test-User");
                var response = chain.filter(exchange);
                return name == null ? response : response.contextWrite(
                    ReactiveSecurityContextHolder.withAuthentication(
                        UsernamePasswordAuthenticationToken.authenticated(name, "", List.of())));
            }).build();
    }

    static Stream<Arguments> visibility() {
        // user, view permission, parent approved/hidden, reply approved/hidden, expected status
        return Stream.of(
            Arguments.of("", false, true, false, true, false, 200),
            Arguments.of("", false, true, false, false, false, 404),
            Arguments.of("", false, true, false, true, true, 404),
            Arguments.of("", false, false, false, true, false, 404),
            Arguments.of("", false, true, true, true, false, 404),
            Arguments.of("reader", false, true, false, false, true, 200),
            Arguments.of("other", false, true, false, false, true, 404),
            Arguments.of("parent", false, true, true, false, true, 200),
            Arguments.of("reader", false, true, true, true, false, 404),
            Arguments.of("admin", true, false, true, false, true, 200),
            Arguments.of("", true, false, true, false, true, 404)
        );
    }

    @ParameterizedTest
    @MethodSource("visibility")
    void honorsParentAndReplyVisibility(String username, boolean permission, boolean parentApproved,
        boolean parentHidden, boolean replyApproved, boolean replyHidden, int status) {
        when(users.hasSufficientRoles(Set.of("role-template-view-comments"))).thenReturn(Mono.just(permission));
        comment.getSpec().setApproved(parentApproved);
        comment.getSpec().setHidden(parentHidden);
        reply.getSpec().setApproved(replyApproved);
        reply.getSpec().setHidden(replyHidden);
        web.get().uri("/comments/comment/replies/reply").header("X-Test-User", username)
            .exchange().expectStatus().isEqualTo(status);
    }

    @Test
    void rejectsDeletedMissingAndUnrelatedResources() {
        reply.getSpec().setCommentName("different");
        expectNotFound();
        reply.getSpec().setCommentName("comment");
        reply.getMetadata().setDeletionTimestamp(Instant.now());
        expectNotFound();
        reply.getMetadata().setDeletionTimestamp(null);
        comment.getMetadata().setDeletionTimestamp(Instant.now());
        expectNotFound();
        comment.getMetadata().setDeletionTimestamp(null);
        when(client.fetch(Reply.class, "reply")).thenReturn(Mono.empty());
        expectNotFound();
        when(client.fetch(Comment.class, "comment")).thenReturn(Mono.empty());
        expectNotFound();
    }

    @Test
    void returnsOnlyPublicDataWithoutMutatingStoredReply() {
        var owner = reply.getSpec().getOwner();
        owner.setKind(Comment.CommentOwner.KIND_EMAIL);
        owner.setName("Private@Example.com");
        owner.setAnnotations(Map.of("Email", "secret@example.com", "website", "https://example.com",
            "private-field", "secret"));
        reply.getMetadata().setAnnotations(Map.of("private-field", "secret"));
        reply.getSpec().setIpAddress("192.0.2.1");
        var counter = Counter.emptyCounter("counter");
        counter.setUpvote(8);
        when(client.fetch(Counter.class, "replies.content.halo.run/reply")).thenReturn(Mono.just(counter));
        web.get().uri("/comments/comment/replies/reply").exchange().expectStatus().isOk()
            .expectHeader().value("Cache-Control", value -> assertThat(value).contains("no-store", "private"))
            .expectHeader().value("Vary", value -> assertThat(value).contains("Cookie", "Authorization"))
            .expectBody().jsonPath("$.spec.owner.name").isEqualTo("")
            .jsonPath("$.spec.ipAddress").isEqualTo("")
            .jsonPath("$.spec.owner.annotations.website").isEqualTo("https://example.com")
            .jsonPath("$.spec.owner.annotations['email-hash']").isNotEmpty()
            .jsonPath("$.spec.owner.annotations.Email").doesNotExist()
            .jsonPath("$.spec.owner.annotations['private-field']").doesNotExist()
            .jsonPath("$.metadata.annotations['private-field']").doesNotExist()
            .jsonPath("$.owner.email").doesNotExist()
            .jsonPath("$.owner.name").doesNotExist()
            .jsonPath("$.stats.upvote").isEqualTo(8);
        assertThat(owner.getName()).isEqualTo("Private@Example.com");
        assertThat(reply.getSpec().getIpAddress()).isEqualTo("192.0.2.1");
        verify(users, never()).getUserOrGhost(anyString());
    }

    private void expectNotFound() {
        web.get().uri("/comments/comment/replies/reply").exchange().expectStatus().isNotFound();
    }

    private static Metadata metadata(String name) {
        var metadata = new Metadata();
        metadata.setName(name);
        return metadata;
    }

    private static void initialize(Comment.BaseCommentSpec spec, String name) {
        spec.setApproved(true);
        spec.setHidden(false);
        spec.setContent("<p>Content</p>");
        spec.setRaw("Content");
        var owner = new Comment.CommentOwner();
        owner.setKind(User.KIND);
        owner.setName(name);
        owner.setDisplayName(name);
        spec.setOwner(owner);
    }
}
