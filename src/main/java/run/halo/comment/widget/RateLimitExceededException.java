package run.halo.comment.widget;

import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.web.server.ResponseStatusException;

public class RateLimitExceededException extends ResponseStatusException {
    public static final String REQUEST_NOT_PERMITTED_TYPE =
        "https://halo.run/probs/request-not-permitted";
    
    public RateLimitExceededException(@Nullable Throwable cause) {
        super(HttpStatus.TOO_MANY_REQUESTS, "You have exceeded your quota", cause);
        setType(URI.create(REQUEST_NOT_PERMITTED_TYPE));
    }
}
