package run.halo.comment.widget.upload;

import org.springframework.dao.OptimisticLockingFailureException;

/** Re-runs a complete read/change/write attempt after an optimistic conflict. */
final class UploadRetries {

    private UploadRetries() {}

    static void run(int maxRetries, Runnable attempt) {
        for (int retries = 0; ; retries++) {
            try {
                attempt.run();
                return;
            } catch (OptimisticLockingFailureException error) {
                requireRetry(retries, maxRetries, error);
            }
        }
    }

    private static void requireRetry(
        int retries,
        int maxRetries,
        OptimisticLockingFailureException error
    ) {
        if (retries >= maxRetries) {
            throw error;
        }
    }
}
