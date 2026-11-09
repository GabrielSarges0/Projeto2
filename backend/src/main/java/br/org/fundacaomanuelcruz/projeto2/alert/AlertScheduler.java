package br.org.fundacaomanuelcruz.projeto2.alert;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.alerts.scheduling.enabled", havingValue = "true", matchIfMissing = true)
public class AlertScheduler {

    private static final Logger log = LoggerFactory.getLogger(AlertScheduler.class);

    private final AlertDigestService alertDigestService;

    public AlertScheduler(AlertDigestService alertDigestService) {
        this.alertDigestService = alertDigestService;
    }

    /**
     * Job diário de disparo de alertas por e-mail para contas que ativaram a opção em preferências.
     * Padrão: 08:00 AM todos os dias. Configurável por APP_ALERTS_CRON.
     */
    @Scheduled(cron = "${app.alerts.cron:0 0 8 * * *}")
    public void runDailyAlertJob() {
        log.info("[AlertScheduler] Executando rotina diária de resumo de alertas...");
        try {
            int sent = alertDigestService.sendDailyAlertDigests();
            log.info("[AlertScheduler] Rotina diária concluída. {} e-mails processados.", sent);
        } catch (Exception e) {
            log.error("[AlertScheduler] Erro ao executar job diário de alertas: {}", e.getMessage(), e);
        }
    }
}
