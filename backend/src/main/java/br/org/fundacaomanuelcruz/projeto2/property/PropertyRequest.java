package br.org.fundacaomanuelcruz.projeto2.property;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** No PUT o código do imóvel é ignorado: ele identifica o registro e não muda. */
public record PropertyRequest(
        @Pattern(regexp = "^IM-\\d{3,5}$", message = "Use o formato IM-000 para o código do imóvel.")
        String registrationCode,

        @NotBlank(message = "Informe o endereço.")
        @Size(min = 5, max = 255, message = "O endereço deve ter entre 5 e 255 caracteres.")
        String address,

        @Size(max = 160, message = "O nome do inquilino deve ter no máximo 160 caracteres.")
        String currentTenant,

        @NotNull(message = "Informe o valor do aluguel.")
        @DecimalMin(value = "0.00", message = "O aluguel não pode ser negativo.")
        @DecimalMax(value = "1000000.00", message = "O aluguel deve ser de no máximo R$ 1.000.000,00.")
        @Digits(integer = 7, fraction = 2, message = "Valor de aluguel inválido.")
        BigDecimal monthlyRent,

        @NotNull(message = "Selecione a situação do imóvel.")
        PropertyStatus status,

        @Size(max = 1000, message = "As observações devem ter no máximo 1000 caracteres.")
        String notes) {
}
