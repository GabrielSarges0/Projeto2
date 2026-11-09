package br.org.fundacaomanuelcruz.projeto2.auth;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Nome de quem está autenticado, para registrar autoria ("responsável", "alterado por"). */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static String displayName() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return "Sistema";
        if (authentication.getPrincipal() instanceof SessionTokenService.SessionUser user) {
            return user.displayName();
        }
        return authentication.getName();
    }
}
