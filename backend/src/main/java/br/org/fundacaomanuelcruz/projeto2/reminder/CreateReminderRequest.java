package br.org.fundacaomanuelcruz.projeto2.reminder;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Usado para criar e para editar: as mesmas regras valem nos dois casos. */
public record CreateReminderRequest(
        @NotBlank(message = "Informe o título do lembrete.")
        @Size(min = 3, max = 255, message = "O título deve ter entre 3 e 255 caracteres.")
        String title,

        @NotNull(message = "Informe a data limite.")
        LocalDate dueDate,

        @NotNull(message = "Selecione a categoria.")
        ReminderCategory category,

        @NotNull(message = "Selecione a prioridade.")
        ReminderPriority priority,

        @Size(max = 120, message = "O responsável deve ter no máximo 120 caracteres.")
        String responsible,

        @Size(max = 1000, message = "A descrição deve ter no máximo 1000 caracteres.")
        String description) {
}
