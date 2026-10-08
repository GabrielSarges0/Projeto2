package br.org.fundacaomanuelcruz.projeto2.api;

import java.time.OffsetDateTime;
import java.util.Map;

public record ApiErrorResponse(
        OffsetDateTime timestamp,
        int status,
        String message,
        Map<String, String> fieldErrors) {
}
