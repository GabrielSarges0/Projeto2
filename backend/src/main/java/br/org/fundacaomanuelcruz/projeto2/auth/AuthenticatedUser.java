package br.org.fundacaomanuelcruz.projeto2.auth;

import br.org.fundacaomanuelcruz.projeto2.user.UserRole;

/** Quem fez a requisição: vem do token (e-mail) e do cadastro (nome atual e papel). */
public record AuthenticatedUser(String email, String displayName, UserRole role) {
}
