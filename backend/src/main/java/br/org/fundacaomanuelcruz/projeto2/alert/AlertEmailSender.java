package br.org.fundacaomanuelcruz.projeto2.alert;

public interface AlertEmailSender {
    boolean sendEmail(String to, String toName, String subject, String bodyText, String bodyHtml);
}
