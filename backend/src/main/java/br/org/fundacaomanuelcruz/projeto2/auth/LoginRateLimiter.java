package br.org.fundacaomanuelcruz.projeto2.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** Janela fixa por IP: o login é aberto, então limita abuso automatizado sem atrapalhar uso humano. */
@Component
public class LoginRateLimiter {

    static final int MAX_ATTEMPTS = 20;
    static final Duration WINDOW = Duration.ofMinutes(1);
    private static final int MAX_TRACKED_CLIENTS = 10_000;

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final Clock clock;

    @Autowired
    public LoginRateLimiter() {
        this(Clock.systemUTC());
    }

    LoginRateLimiter(Clock clock) {
        this.clock = clock;
    }

    public void check(String clientKey) {
        Instant now = clock.instant();
        if (windows.size() > MAX_TRACKED_CLIENTS) {
            windows.entrySet().removeIf(entry -> entry.getValue().isExpired(now));
        }
        Window window = windows.compute(clientKey, (key, current) ->
                current == null || current.isExpired(now) ? new Window(now, 1) : current.increment());
        if (window.count() > MAX_ATTEMPTS) {
            throw new TooManyRequestsException("Muitas tentativas de login. Aguarde um minuto e tente de novo.");
        }
    }

    private record Window(Instant start, int count) {
        boolean isExpired(Instant now) {
            return !now.isBefore(start.plus(WINDOW));
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
