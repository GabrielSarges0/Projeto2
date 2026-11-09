package br.org.fundacaomanuelcruz.projeto2.store;

import java.time.OffsetDateTime;

import tools.jackson.databind.JsonNode;

public record RecordResponse(String id, JsonNode data, OffsetDateTime updatedAt, String updatedBy) {
}
