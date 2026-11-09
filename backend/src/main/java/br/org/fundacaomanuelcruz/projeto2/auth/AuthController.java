package br.org.fundacaomanuelcruz.projeto2.auth;

import java.time.Instant;
import java.util.Locale;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.org.fundacaomanuelcruz.projeto2.auth.SessionTokenService.SessionUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final SessionTokenService tokenService;
    private final LoginRateLimiter rateLimiter;

    public AuthController(SessionTokenService tokenService, LoginRateLimiter rateLimiter) {
        this.tokenService = tokenService;
        this.rateLimiter = rateLimiter;
    }

    /**
     * Login aberto por decisão do produto: qualquer e-mail válido com senha de 6+ caracteres entra.
     * A senha não é guardada; o token só identifica quem fez cada ação.
     */
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        rateLimiter.check(clientKey(httpRequest));
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String name = request.name() == null || request.name().isBlank()
                ? nameFromEmail(email)
                : request.name().trim();
        SessionTokenService.IssuedToken issued = tokenService.issue(email, name);
        return new LoginResponse(issued.token(), issued.expiresAt(), new CurrentUserResponse(email, name));
    }

    @GetMapping("/me")
    public CurrentUserResponse me(Authentication authentication) {
        if (authentication.getPrincipal() instanceof SessionUser user) {
            return new CurrentUserResponse(user.email(), user.displayName());
        }
        return new CurrentUserResponse(authentication.getName(), authentication.getName());
    }

    /** Troca o nome de exibição: emite um token novo com o mesmo e-mail (a sessão não guarda estado). */
    @PutMapping("/me")
    public LoginResponse updateMe(@Valid @RequestBody UpdateProfileRequest request, Authentication authentication) {
        String email = authentication.getPrincipal() instanceof SessionUser user ? user.email() : authentication.getName();
        SessionTokenService.IssuedToken issued = tokenService.issue(email, request.name().trim());
        return new LoginResponse(issued.token(), issued.expiresAt(), new CurrentUserResponse(email, request.name().trim()));
    }

    // O Render fica atrás de proxy: o IP real é o primeiro do X-Forwarded-For.
    private static String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static String nameFromEmail(String email) {
        String local = email.substring(0, email.indexOf('@')).replaceAll("[._-]+", " ").trim();
        if (local.isEmpty()) return email;
        StringBuilder name = new StringBuilder();
        for (String part : local.split(" ")) {
            if (part.isEmpty()) continue;
            if (!name.isEmpty()) name.append(' ');
            name.append(Character.toUpperCase(part.charAt(0))).append(part.substring(1));
        }
        return name.toString();
    }

    public record LoginRequest(
            @NotBlank(message = "Informe o e-mail.")
            @Email(message = "E-mail inválido.")
            @Size(max = 160, message = "E-mail muito longo.")
            String email,

            @NotBlank(message = "Informe a senha.")
            @Size(min = 6, max = 128, message = "A senha deve ter entre 6 e 128 caracteres.")
            String password,

            @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres.")
            String name) {
    }

    public record UpdateProfileRequest(
            @NotBlank(message = "Informe o nome.")
            @Size(min = 3, max = 120, message = "O nome deve ter entre 3 e 120 caracteres.")
            String name) {
    }

    public record LoginResponse(String token, Instant expiresAt, CurrentUserResponse user) {
    }

    public record CurrentUserResponse(String username, String name) {
    }
}
