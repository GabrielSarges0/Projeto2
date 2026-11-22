package br.org.fundacaomanuelcruz.projeto2.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import jakarta.servlet.http.HttpServletRequest;

/** Janela fixa por chave (IP, funcionário...): limita abuso automatizado sem atrapalhar uso humano. */
public class FixedWindowRateLimiter {

    private static final int MAX_TRACKED_KEYS = 10_000;

    private final int maxAttempts;
    private final Duration window;
    private final String message;
    private final Clock clock;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public FixedWindowRateLimiter(int maxAttempts, Duration window, String message, Clock clock) {
        this.maxAttempts = maxAttempts;
        this.window = window;
        this.message = message;
        this.clock = clock;
    }

    public void check(String key) {
        Instant now = clock.instant();
        if (windows.size() > MAX_TRACKED_KEYS) {
            windows.entrySet().removeIf(entry -> entry.getValue().isExpired(now, window));
        }
        Window current = windows.compute(key, (ignored, existing) ->
                existing == null || existing.isExpired(now, window) ? new Window(now, 1) : existing.increment());
        if (current.count() > maxAttempts) {
            throw new TooManyRequestsException(message);
        }
    }

    // O Render fica atrás de proxy: o IP real é o primeiro do X-Forwarded-For.
    public static String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private record Window(Instant start, int count) {
        boolean isExpired(Instant now, Duration window) {
            return !now.isBefore(start.plus(window));
        }

        Window increment() {
            return new Window(start, count + 1);
        }
    }

    public static class TooManyRequestsException extends RuntimeException {
        public TooManyRequestsException(String message) {
            super(message);
        }
    }
}
