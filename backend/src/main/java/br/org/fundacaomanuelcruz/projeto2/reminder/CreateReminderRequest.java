package br.org.fundacaomanuelcruz.projeto2.reminder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateReminderRequest(
        @NotBlank @Size(max = 255) String text
) {
}

