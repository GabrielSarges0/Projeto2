package br.org.fundacaomanuelcruz.projeto2.user;

public enum UserRole {
    /** Tudo, inclusive papéis da equipe e exclusões. */
    GERENTE,
    /** Cadastra e edita em todos os módulos; não gerencia a equipe. */
    ADMINISTRADOR,
    /** Consulta os módulos sem dados pessoais; registra ponto, justificativas, retiradas do estoque e envia documentos. */
    FUNCIONARIO
}
