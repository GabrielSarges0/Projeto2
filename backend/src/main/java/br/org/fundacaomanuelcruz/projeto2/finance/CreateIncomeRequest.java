package br.org.fundacaomanuelcruz.projeto2.finance;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateIncomeRequest(
        @NotNull(message = "Selecione CPF ou CNPJ.")
        BrazilianDocumentType documentType,

        @NotBlank(message = "Informe o nome do inquilino.")
        @Size(max = 160, message = "O nome do inquilino deve ter no maximo 160 caracteres.")
        String tenantName,

        @NotBlank(message = "Informe o CPF/CNPJ.")
        @Size(max = 20, message = "CPF/CNPJ invalido.")
        String documentNumber,

        @NotBlank(message = "Informe o registro do imovel.")
        @Size(max = 80, message = "O registro do imovel deve ter no maximo 80 caracteres.")
        String propertyRegistration,

        @NotNull(message = "Informe a data da entrada.")
        LocalDate transactionDate,

        @NotNull(message = "Informe o valor bruto.")
        @DecimalMin(value = "0.01", message = "O valor bruto deve ser maior que zero.")
        @Digits(integer = 17, fraction = 2, message = "Valor bruto invalido.")
        BigDecimal grossAmount) {
}
