package br.org.fundacaomanuelcruz.projeto2.staff;

import tools.jackson.databind.JsonNode;

/** Passo registrado ("Entrada", "Retorno"...), a hora do servidor e o dia de ponto como ficou na coleção. */
public record StaffPunchResponse(String step, String time, JsonNode attendance) {
}
