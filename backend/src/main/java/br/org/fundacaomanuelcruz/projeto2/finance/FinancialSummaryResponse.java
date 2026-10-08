package br.org.fundacaomanuelcruz.projeto2.finance;

import java.math.BigDecimal;

public record FinancialSummaryResponse(
        BigDecimal income,
        BigDecimal expense,
        BigDecimal balance) {
}
