package br.org.fundacaomanuelcruz.projeto2.finance;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateExpenseRequest(
        @NotBlank(message = "A descrição/prestador é obrigatória.")
        @Size(max = 160, message = "A descrição não pode exceder 160 caracteres.")
        String description,

        @NotBlank(message = "O registro do imóvel é obrigatório.")
        @Size(max = 80, message = "O registro do imóvel não pode exceder 80 caracteres.")
        String propertyRegistration,

        @NotNull(message = "A data da transação é obrigatória.")
        LocalDate transactionDate,

        @NotNull(message = "O valor bruto é obrigatório.")
        @DecimalMin(value = "0.01", message = "O valor bruto deve ser maior que zero.")
        BigDecimal grossAmount) {
}

