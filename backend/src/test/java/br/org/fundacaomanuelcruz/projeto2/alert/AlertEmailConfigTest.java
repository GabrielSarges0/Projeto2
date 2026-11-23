package br.org.fundacaomanuelcruz.projeto2.alert;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

class AlertEmailConfigTest {

    private final AlertEmailConfig config = new AlertEmailConfig();
    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    @Test
    void semWebhookOsAlertasVaoSoParaOLog() {
        AlertEmailSender sender = config.alertEmailSender("  ", "", "alertas@fundacao.org", objectMapper);

        assertThat(sender).isInstanceOf(LogAlertEmailSender.class);
        assertThat(sender.sendEmail("gerente@fundacao.org", "Gerente", "Assunto", "texto", "<p>texto</p>")).isTrue();
    }

    @Test
    void comWebhookOsAlertasSaemPorHttp() {
        AlertEmailSender sender = config.alertEmailSender(
                "http://127.0.0.1:1/webhook", "chave", "alertas@fundacao.org", objectMapper);

        assertThat(sender).isInstanceOf(HttpAlertEmailSender.class);
        // Porta 1 recusa a conexão: o envio falha sem derrubar quem chamou.
        assertThat(sender.sendEmail("gerente@fundacao.org", "Gerente", "Assunto", "texto", "<p>texto</p>")).isFalse();
    }
}
