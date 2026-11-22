package br.org.fundacaomanuelcruz.projeto2.staff;

import java.util.List;

import tools.jackson.databind.JsonNode;

/** O que o funcionário vê de si depois de confirmar o CPF: os próprios pontos e justificativas, no formato das coleções. */
public record StaffSelfServiceResponse(StaffMember employee, List<JsonNode> attendance, List<JsonNode> justifications) {
}
