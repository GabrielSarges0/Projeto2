package br.org.fundacaomanuelcruz.projeto2.finance;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FinancialMovementResponse(
        Long id,
        LocalDate date,
        String tenantName,
        String propertyRegistration,
        BigDecimal amount,
        FinancialTransactionType type) {
}
