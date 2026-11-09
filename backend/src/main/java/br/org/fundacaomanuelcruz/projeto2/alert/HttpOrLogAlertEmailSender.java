package br.org.fundacaomanuelcruz.projeto2.alert;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

/**
 * Envia e-mails de alerta por webhook/API externa (configurada no Render) ou simula em log quando não configurada.
 * Zero dependências extras de Maven (usa java.net.http.HttpClient nativo do Java 21).
 */
@Component
public class HttpOrLogAlertEmailSender implements AlertEmailSender {

    private static final Logger log = LoggerFactory.getLogger(HttpOrLogAlertEmailSender.class);

    private final String webhookUrl;
    private final String apiKey;
    private final String from;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public HttpOrLogAlertEmailSender(
            @Value("${app.alerts.mail.webhook-url:}") String webhookUrl,
            @Value("${app.alerts.mail.api-key:}") String apiKey,
            @Value("${app.alerts.mail.from:alertas@fundacaomanuelcruz.org.br}") String from,
            ObjectMapper objectMapper) {
        this.webhookUrl = webhookUrl != null ? webhookUrl.trim() : "";
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.from = from != null ? from.trim() : "alertas@fundacaomanuelcruz.org.br";
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Override
    public boolean sendEmail(String to, String toName, String subject, String bodyText, String bodyHtml) {
        if (webhookUrl.isEmpty()) {
            log.info("[AlertEmailSender] Simulação de envio para {} ({}) | Assunto: {}", toName, to, subject);
            return true;
        }

        try {
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("from", from);
            payload.put("to", to);
            payload.put("toName", toName);
            payload.put("subject", subject);
            payload.put("text", bodyText);
            payload.put("html", bodyHtml);

            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json");

            if (!apiKey.isEmpty()) {
                requestBuilder.header("Authorization", "Bearer " + apiKey);
            }

            HttpRequest request = requestBuilder
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("[AlertEmailSender] E-mail enviado com sucesso para {} (HTTP {})", to, response.statusCode());
                return true;
            } else {
                log.warn("[AlertEmailSender] Falha ao enviar e-mail para {}: HTTP {} {}", to, response.statusCode(), response.body());
                return false;
            }
        } catch (Exception e) {
            log.error("[AlertEmailSender] Erro ao disparar e-mail para {}: {}", to, e.getMessage());
            return false;
        }
    }
}
