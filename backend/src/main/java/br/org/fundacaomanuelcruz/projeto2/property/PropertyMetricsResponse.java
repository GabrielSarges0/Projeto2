package br.org.fundacaomanuelcruz.projeto2.property;

public record PropertyMetricsResponse(
        long totalProperties,
        long occupied,
        long available,
        long underMaintenance
) {
}

