package br.org.fundacaomanuelcruz.projeto2.reminder;

public record ReminderResponse(
        Long id,
        String text,
        boolean done
) {
}

