package run.halo.comment.widget.upload;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

public final class UploadIdentity {

    public static final String TOKEN_HEADER = "X-Comment-Upload-Token";
    public static final String SUBMISSION_HEADER = "X-Comment-Submission";

    private UploadIdentity() {}

    public static Mono<String> currentOwner() {
        return ReactiveSecurityContextHolder.getContext()
            .map(context -> context.getAuthentication().getName())
            .defaultIfEmpty("anonymousUser");
    }

    public static String credential(String value) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid upload credential");
        }
        if (!value.matches("[a-f0-9]{64}")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid upload credential");
        }
        return hash(value);
    }

    public static String hash(String value) {
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public static void authorize(
        String hash,
        String owner,
        String expectedHash,
        String expectedOwner
    ) {
        if (
            !MessageDigest.isEqual(
                hash.getBytes(StandardCharsets.UTF_8),
                expectedHash.getBytes(StandardCharsets.UTF_8)
            )
        ) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Upload does not belong to this draft"
            );
        }
        if (!owner.equals(expectedOwner)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Upload does not belong to this draft"
            );
        }
    }
}
