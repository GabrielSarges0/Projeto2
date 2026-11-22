package br.org.fundacaomanuelcruz.projeto2.auth;

import java.time.Clock;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** Janela fixa por IP: o login é aberto, então limita abuso automatizado sem atrapalhar uso humano. */
@Component
public class LoginRateLimiter extends FixedWindowRateLimiter {

    static final int MAX_ATTEMPTS = 20;
    static final Duration WINDOW = Duration.ofMinutes(1);

    @Autowired
    public LoginRateLimiter() {
        this(Clock.systemUTC());
    }

    LoginRateLimiter(Clock clock) {
        super(MAX_ATTEMPTS, WINDOW, "Muitas tentativas de login. Aguarde um minuto e tente de novo.", clock);
    }
}
