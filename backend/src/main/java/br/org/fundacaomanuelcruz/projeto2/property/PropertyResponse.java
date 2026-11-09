package br.org.fundacaomanuelcruz.projeto2.property;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PropertyResponse(
        Long id,
        String registrationCode,
        String address,
        String currentTenant,
        BigDecimal monthlyRent,
        PropertyStatus status,
        String notes,
        OffsetDateTime updatedAt,
        String updatedBy) {
}
