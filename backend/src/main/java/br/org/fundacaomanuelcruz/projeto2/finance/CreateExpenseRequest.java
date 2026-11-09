package br.org.fundacaomanuelcruz.projeto2.finance;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

public record CreateExpenseRequest(
        @NotBlank(message = "A descrição/prestador é obrigatória.")
        @Size(min = 3, max = 160, message = "A descrição deve ter entre 3 e 160 caracteres.")
        String description,

        @NotBlank(message = "O registro do imóvel é obrigatório.")
        @Size(max = 80, message = "O registro do imóvel não pode exceder 80 caracteres.")
        String propertyRegistration,

        @NotNull(message = "A data da transação é obrigatória.")
        @PastOrPresent(message = "A data da saída não pode estar no futuro.")
        LocalDate transactionDate,

        @NotNull(message = "O valor bruto é obrigatório.")
        @DecimalMin(value = "0.01", message = "O valor bruto deve ser maior que zero.")
        @DecimalMax(value = "1000000.00", message = "O valor deve ser de no máximo R$ 1.000.000,00.")
        @Digits(integer = 7, fraction = 2, message = "Valor inválido.")
        BigDecimal grossAmount) {
}

