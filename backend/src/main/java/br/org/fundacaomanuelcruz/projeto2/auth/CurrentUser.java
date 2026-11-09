package br.org.fundacaomanuelcruz.projeto2.auth;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import br.org.fundacaomanuelcruz.projeto2.user.UserRole;

/** Quem está autenticado, para registrar autoria e aplicar regras por papel. */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static String displayName() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return "Sistema";
        if (authentication.getPrincipal() instanceof AuthenticatedUser user) return user.displayName();
        return authentication.getName();
    }

    public static String email() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return "";
        if (authentication.getPrincipal() instanceof AuthenticatedUser user) return user.email();
        return authentication.getName();
    }

    /** Usuário técnico (HTTP Basic, APP_ADMIN_*) conta como Gerente. */
    public static UserRole role() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) return user.role();
        return UserRole.GERENTE;
    }
}
