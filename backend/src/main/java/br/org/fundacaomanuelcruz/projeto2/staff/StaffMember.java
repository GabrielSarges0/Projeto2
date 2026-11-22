package br.org.fundacaomanuelcruz.projeto2.staff;

/** Funcionário como aparece para toda a equipe (lista do ponto, responsável no estoque): sem CPF nem jornada. */
public record StaffMember(String id, String name, String role) {
}
