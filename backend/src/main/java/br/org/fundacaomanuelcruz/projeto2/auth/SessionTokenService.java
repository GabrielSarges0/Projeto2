package br.org.fundacaomanuelcruz.projeto2.auth;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Token de sessão assinado (HMAC-SHA256) e sem estado no servidor: o Render reinicia e escala sem perder sessões.
 */
@Service
public class SessionTokenService {

    static final Duration TOKEN_TTL = Duration.ofHours(12);
    private static final String HMAC = "HmacSHA256";
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();

    private final byte[] secret;
    private final Clock clock;

    @Autowired
    public SessionTokenService(@Value("${app.auth.token-secret}") String secret) {
        this(secret, Clock.systemUTC());
    }

    SessionTokenService(String secret, Clock clock) {
        if (secret == null || secret.length() < 8) {
            throw new IllegalStateException("Configure APP_TOKEN_SECRET (mínimo de 8 caracteres).");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.clock = clock;
    }

    public IssuedToken issue(String email, String displayName) {
        Instant expiresAt = clock.instant().plus(TOKEN_TTL);
        String payload = String.join("\n", email, displayName, Long.toString(expiresAt.getEpochSecond()));
        String encodedPayload = ENCODER.encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return new IssuedToken(encodedPayload + "." + sign(encodedPayload), expiresAt);
    }

    public Optional<SessionUser> verify(String token) {
        if (token == null) return Optional.empty();
        int dot = token.indexOf('.');
        if (dot <= 0 || dot == token.length() - 1) return Optional.empty();

        String encodedPayload = token.substring(0, dot);
        byte[] expected = sign(encodedPayload).getBytes(StandardCharsets.US_ASCII);
        byte[] received = token.substring(dot + 1).getBytes(StandardCharsets.US_ASCII);
        if (!MessageDigest.isEqual(expected, received)) return Optional.empty();

        try {
            String[] parts = new String(DECODER.decode(encodedPayload), StandardCharsets.UTF_8).split("\n", -1);
            if (parts.length != 3) return Optional.empty();
            Instant expiresAt = Instant.ofEpochSecond(Long.parseLong(parts[2]));
            if (!clock.instant().isBefore(expiresAt)) return Optional.empty();
            return Optional.of(new SessionUser(parts[0], parts[1]));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance(HMAC);
            mac.init(new SecretKeySpec(secret, HMAC));
            return ENCODER.encodeToString(mac.doFinal(value.getBytes(StandardCharsets.US_ASCII)));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("HMAC-SHA256 indisponível na JVM.", e);
        }
    }

    public record IssuedToken(String token, Instant expiresAt) {
    }

    public record SessionUser(String email, String displayName) {
    }
}
