package br.org.fundacaomanuelcruz.projeto2.alert;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/alerts")
public class AlertController {

    private final AlertDigestService alertDigestService;

    public AlertController(AlertDigestService alertDigestService) {
        this.alertDigestService = alertDigestService;
    }

    /**
     * Dispara manualmente a conciliação e envio dos resumos diários de alerta (acesso restrito aos Editores).
     */
    @PostMapping("/digest/trigger")
    public ResponseEntity<Map<String, Object>> triggerDigest() {
        int count = alertDigestService.sendDailyAlertDigests();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "sentCount", count,
                "message", "Resumo diário de alertas processado com sucesso (" + count + " e-mails enviados)."
        ));
    }
}
