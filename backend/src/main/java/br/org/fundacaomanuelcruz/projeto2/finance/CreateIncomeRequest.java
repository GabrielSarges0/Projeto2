package br.org.fundacaomanuelcruz.projeto2.finance;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateIncomeRequest(
        @NotNull(message = "Selecione CPF ou CNPJ.")
        BrazilianDocumentType documentType,

        @NotBlank(message = "Informe o nome do inquilino.")
        @Size(min = 3, max = 160, message = "O nome do inquilino deve ter entre 3 e 160 caracteres.")
        // Pessoa ou empresa (CNPJ pode ter números, ex.: "3M do Brasil"), mas com ao menos 3 letras.
        @Pattern(regexp = "^(?=(?:.*\\p{L}){3})[\\p{L}\\d][\\p{L}\\d &.,'/-]*$",
                message = "Nome do inquilino inválido: use letras (mínimo 3) e sem símbolos.")
        String tenantName,

        @NotBlank(message = "Informe o CPF/CNPJ.")
        @Size(max = 20, message = "CPF/CNPJ inválido.")
        String documentNumber,

        @NotBlank(message = "Informe o registro do imovel.")
        @Size(max = 80, message = "O registro do imovel deve ter no maximo 80 caracteres.")
        String propertyRegistration,

        @NotNull(message = "Informe a data da entrada.")
        @PastOrPresent(message = "A data da entrada não pode estar no futuro.")
        LocalDate transactionDate,

        @NotNull(message = "Informe o valor bruto.")
        @DecimalMin(value = "0.01", message = "O valor bruto deve ser maior que zero.")
        @DecimalMax(value = "1000000.00", message = "O valor bruto deve ser de no máximo R$ 1.000.000,00.")
        @Digits(integer = 7, fraction = 2, message = "Valor bruto inválido.")
        BigDecimal grossAmount) {
}
