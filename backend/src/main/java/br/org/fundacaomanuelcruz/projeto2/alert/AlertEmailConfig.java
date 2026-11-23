package br.org.fundacaomanuelcruz.projeto2.alert;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import tools.jackson.databind.ObjectMapper;

@Configuration
public class AlertEmailConfig {

    /** Sem webhook configurado (local e Codespaces), os alertas só vão para o log; com webhook, saem por e-mail. */
    @Bean
    AlertEmailSender alertEmailSender(
            @Value("${app.alerts.mail.webhook-url:}") String webhookUrl,
            @Value("${app.alerts.mail.api-key:}") String apiKey,
            @Value("${app.alerts.mail.from:alertas@fundacaomanuelcruz.org.br}") String from,
            ObjectMapper objectMapper) {
        String url = webhookUrl != null ? webhookUrl.trim() : "";
        if (url.isEmpty()) {
            return new LogAlertEmailSender();
        }
        return new HttpAlertEmailSender(
                url,
                apiKey != null ? apiKey.trim() : "",
                from != null ? from.trim() : "alertas@fundacaomanuelcruz.org.br",
                objectMapper);
    }
}
