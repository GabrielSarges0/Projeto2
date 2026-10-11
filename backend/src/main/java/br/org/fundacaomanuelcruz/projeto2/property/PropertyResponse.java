package br.org.fundacaomanuelcruz.projeto2.property;

import java.math.BigDecimal;

public record PropertyResponse(
        Long id,
        String registrationCode,
        String address,
        String currentTenant,
        BigDecimal monthlyRent,
        String status
) {
}

