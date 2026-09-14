package run.halo.comment.widget;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;
import run.halo.app.core.extension.Counter;
import run.halo.app.core.extension.User;
import run.halo.app.core.extension.content.Comment;
import run.halo.app.core.extension.content.Reply;
import run.halo.app.core.extension.endpoint.CustomEndpoint;
import run.halo.app.core.user.service.UserService;
import run.halo.app.extension.ExtensionUtil;
import run.halo.app.extension.GroupVersion;
import run.halo.app.extension.Metadata;
import run.halo.app.extension.ReactiveExtensionClient;
import run.halo.app.infra.AnonymousUserConst;
import run.halo.comment.widget.upload.UploadIdentity;

/** Public reply lookup for comment permalinks. */
@Component
@RequiredArgsConstructor
public class ReplyDetailEndpoint implements CustomEndpoint {
    private final ReactiveExtensionClient client;
    private final UserService userService;

    @Override
    public RouterFunction<ServerResponse> endpoint() {
        return RouterFunctions.route()
            .GET("comments/{commentName}/replies/{replyName}", this::getReply)
            .build();
    }

    private Mono<ServerResponse> getReply(ServerRequest request) {
        var username = ReactiveSecurityContextHolder.getContext()
            .mapNotNull(SecurityContext::getAuthentication)
            .filter(auth -> auth.isAuthenticated())
            .map(auth -> auth.getName())
            .filter(StringUtils::isNotBlank)
            .defaultIfEmpty(AnonymousUserConst.PRINCIPAL);
        var permission = userService.hasSufficientRoles(Set.of("role-template-view-comments"))
            .defaultIfEmpty(false);
        return Mono.zip(username, permission)
            .flatMap(identity -> client.fetch(Comment.class, request.pathVariable("commentName"))
                .filter(comment -> !ExtensionUtil.isDeleted(comment)
                    && visible(comment.getSpec(), identity.getT1(), identity.getT2()))
                .flatMap(comment -> client.fetch(Reply.class, request.pathVariable("replyName"))
                    .filter(reply -> !ExtensionUtil.isDeleted(reply)
                        && Objects.equals(reply.getSpec().getCommentName(), comment.getMetadata().getName())
                        && visible(reply.getSpec(), identity.getT1(), identity.getT2()
                            || (Boolean.TRUE.equals(comment.getSpec().getHidden())
                                && owns(comment.getSpec(), identity.getT1()))))))
            .flatMap(this::toPublicReply)
            .flatMap(reply -> ServerResponse.ok()
                .cacheControl(CacheControl.noStore().cachePrivate())
                .headers(headers -> headers.setVary(List.of(HttpHeaders.COOKIE, HttpHeaders.AUTHORIZATION)))
                .bodyValue(reply))
            .switchIfEmpty(ServerResponse.notFound()
                .cacheControl(CacheControl.noStore().cachePrivate()).build());
    }

    // Match Core's public visibility rules, including the owner of a private thread.
    private static boolean visible(Comment.BaseCommentSpec spec, String username, boolean canView) {
        var published = Boolean.TRUE.equals(spec.getApproved()) && Boolean.FALSE.equals(spec.getHidden());
        return published || (!AnonymousUserConst.isAnonymousUser(username) && (canView || owns(spec, username)));
    }

    private static boolean owns(Comment.BaseCommentSpec spec, String username) {
        var owner = spec.getOwner();
        return !AnonymousUserConst.isAnonymousUser(username) && owner != null
            && User.KIND.equals(owner.getKind()) && Objects.equals(owner.getName(), username);
    }

    private Mono<PublicReply> toPublicReply(Reply reply) {
        var owner = reply.getSpec().getOwner();
        Mono<Owner> resolvedOwner;
        if (Comment.CommentOwner.KIND_EMAIL.equals(owner.getKind())) {
            resolvedOwner = Mono.just(new Owner(owner.getKind(), owner.getDisplayName(),
                owner.getAnnotation(Comment.CommentOwner.AVATAR_ANNO), owner.getName()));
        } else {
            resolvedOwner = userService.getUserOrGhost(owner.getName())
                .map(user -> new Owner(user.getKind(), user.getSpec().getDisplayName(),
                    user.getSpec().getAvatar(), user.getSpec().getEmail()));
        }
        // Core stores interaction counters under plural.group/name.
        var votes = client.fetch(Counter.class, "replies.content.halo.run/" + reply.getMetadata().getName())
            .mapNotNull(Counter::getUpvote).defaultIfEmpty(0);
        return Mono.zip(resolvedOwner, votes).map(tuple -> {
            var resolved = tuple.getT1();
            var source = reply.getSpec();
            var publicOwner = new Comment.CommentOwner();
            publicOwner.setKind(owner.getKind());
            publicOwner.setName("");
            publicOwner.setDisplayName(resolved.displayName());
            var annotations = new HashMap<String, String>();
            var website = owner.getAnnotation(Comment.CommentOwner.WEBSITE_ANNO);
            if (website != null) {
                annotations.put(Comment.CommentOwner.WEBSITE_ANNO, website);
            }
            if (StringUtils.isNotBlank(resolved.email())) {
                annotations.put(Comment.CommentOwner.EMAIL_HASH_ANNO,
                    UploadIdentity.hash(resolved.email().toLowerCase(Locale.ROOT)));
            }
            publicOwner.setAnnotations(annotations);
            // Copy only public fields; never mutate an Extension obtained from the client.
            var spec = new Reply.ReplySpec();
            spec.setCommentName(source.getCommentName());
            spec.setQuoteReply(source.getQuoteReply());
            spec.setContent(source.getContent());
            spec.setRaw(source.getRaw());
            spec.setOwner(publicOwner);
            spec.setUserAgent(source.getUserAgent());
            spec.setIpAddress("");
            spec.setCreationTime(source.getCreationTime());
            spec.setApproved(source.getApproved());
            spec.setApprovedTime(source.getApprovedTime());
            spec.setHidden(source.getHidden());
            spec.setTop(source.getTop());
            spec.setPriority(source.getPriority());
            spec.setAllowNotification(source.getAllowNotification());
            var metadata = new Metadata();
            metadata.setName(reply.getMetadata().getName());
            metadata.setCreationTimestamp(reply.getMetadata().getCreationTimestamp());
            metadata.setVersion(reply.getMetadata().getVersion());
            return new PublicReply(metadata, spec,
                new PublicOwner(resolved.kind(), resolved.displayName(), resolved.avatar()),
                new Stats(tuple.getT2()));
        });
    }

    private record Owner(String kind, String displayName, String avatar, String email) {
    }

    public record PublicOwner(String kind, String displayName, String avatar) {
    }

    public record Stats(int upvote) {
    }

    public record PublicReply(Metadata metadata, Reply.ReplySpec spec, PublicOwner owner, Stats stats) {
    }

    @Override
    public GroupVersion groupVersion() {
        return GroupVersion.parseAPIVersion("api.commentwidget.halo.run/v1alpha1");
    }
}
