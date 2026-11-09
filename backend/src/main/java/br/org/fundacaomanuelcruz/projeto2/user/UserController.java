package br.org.fundacaomanuelcruz.projeto2.user;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.org.fundacaomanuelcruz.projeto2.auth.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

/** Gestão de equipe (Figma Tela-01.2): só Gerente (regra em SecurityConfig). */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping
    public List<UserResponse> list() {
        return service.listAll().stream().map(UserResponse::of).toList();
    }

    @PutMapping("/{email}/role")
    public UserResponse changeRole(@PathVariable String email, @Valid @RequestBody RoleRequest request) {
        return UserResponse.of(service.changeRole(CurrentUser.email(), email, request.role()));
    }

    @PutMapping("/{email}/active")
    public UserResponse changeActive(@PathVariable String email, @Valid @RequestBody ActiveRequest request) {
        return UserResponse.of(service.changeActive(CurrentUser.email(), email, request.active()));
    }

    public record RoleRequest(@NotNull(message = "Escolha o papel.") UserRole role) {
    }

    public record ActiveRequest(@NotNull(message = "Informe se a conta fica ativa.") Boolean active) {
    }

    public record UserResponse(
            String email,
            String name,
            UserRole role,
            boolean active,
            OffsetDateTime createdAt,
            OffsetDateTime lastLoginAt) {
        static UserResponse of(AppUser user) {
            return new UserResponse(user.getEmail(), user.getDisplayName(), user.getRole(), user.isActive(),
                    user.getCreatedAt(), user.getLastLoginAt());
        }
    }
}
