package br.org.fundacaomanuelcruz.projeto2.alert;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Usado quando nenhuma API de e-mail está configurada: registra o envio no log em vez de mandar o e-mail. */
public class LogAlertEmailSender implements AlertEmailSender {

    private static final Logger log = LoggerFactory.getLogger(LogAlertEmailSender.class);

    @Override
    public boolean sendEmail(String to, String toName, String subject, String bodyText, String bodyHtml) {
        log.info("[AlertEmailSender] Simulação de envio para {} ({}) | Assunto: {}", toName, to, subject);
        return true;
    }
}
