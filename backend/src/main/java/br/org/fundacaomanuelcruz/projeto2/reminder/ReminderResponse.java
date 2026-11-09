package br.org.fundacaomanuelcruz.projeto2.reminder;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ReminderResponse(
        Long id,
        String title,
        LocalDate dueDate,
        ReminderCategory category,
        ReminderPriority priority,
        String responsible,
        String description,
        boolean done,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {
}
