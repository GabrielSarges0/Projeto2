package br.org.fundacaomanuelcruz.projeto2.auth;

import java.time.Instant;
import java.util.Locale;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.org.fundacaomanuelcruz.projeto2.user.AppUser;
import br.org.fundacaomanuelcruz.projeto2.user.UserRole;
import br.org.fundacaomanuelcruz.projeto2.user.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final SessionTokenService tokenService;
    private final LoginRateLimiter rateLimiter;
    private final UserService userService;

    public AuthController(SessionTokenService tokenService, LoginRateLimiter rateLimiter, UserService userService) {
        this.tokenService = tokenService;
        this.rateLimiter = rateLimiter;
        this.userService = userService;
    }

    /**
     * Login aberto por decisão do produto: qualquer e-mail válido com senha de 6+ caracteres entra.
     * A senha não é guardada; o papel da conta (Gerente/Administrador/Funcionário) limita o que ela altera.
     */
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        rateLimiter.check(FixedWindowRateLimiter.clientKey(httpRequest));
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String providedName = request.name() == null || request.name().isBlank() ? null : request.name().trim();
        AppUser user = userService.onLogin(email, providedName, nameFromEmail(email));
        return issue(user);
    }

    @GetMapping("/me")
    public CurrentUserResponse me() {
        return userService.findActive(CurrentUser.email())
                .map(this::toResponse)
                .orElseGet(() -> new CurrentUserResponse(CurrentUser.email(), CurrentUser.displayName(), CurrentUser.role(), null));
    }

    /** Troca o nome de exibição e devolve um token novo (o nome vai no token). */
    @PutMapping("/me")
    public LoginResponse updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        return issue(userService.rename(CurrentUser.email(), request.name().trim()));
    }

    /** Preferências da conta (ex.: quais alertas de prazo aparecem). */
    @PutMapping("/me/preferences")
    public CurrentUserResponse updatePreferences(@RequestBody JsonNode preferences) {
        return toResponse(userService.savePreferences(CurrentUser.email(), preferences));
    }

    private LoginResponse issue(AppUser user) {
        SessionTokenService.IssuedToken issued = tokenService.issue(user.getEmail(), user.getDisplayName());
        return new LoginResponse(issued.token(), issued.expiresAt(), toResponse(user));
    }

    private CurrentUserResponse toResponse(AppUser user) {
        return new CurrentUserResponse(user.getEmail(), user.getDisplayName(), user.getRole(), userService.preferencesOf(user));
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

    public record CurrentUserResponse(String username, String name, UserRole role, JsonNode preferences) {
    }
}
