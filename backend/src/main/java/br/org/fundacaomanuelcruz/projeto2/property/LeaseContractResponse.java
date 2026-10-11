package br.org.fundacaomanuelcruz.projeto2.property;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LeaseContractResponse(
        Long id,
        String propertyRegistration,
        String tenantName,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal monthlyAmount,
        String status
) {
}

