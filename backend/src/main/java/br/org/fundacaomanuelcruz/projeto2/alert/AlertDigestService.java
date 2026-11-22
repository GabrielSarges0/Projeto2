package br.org.fundacaomanuelcruz.projeto2.alert;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.org.fundacaomanuelcruz.projeto2.reminder.Reminder;
import br.org.fundacaomanuelcruz.projeto2.reminder.ReminderRepository;
import br.org.fundacaomanuelcruz.projeto2.store.AppRecord;
import br.org.fundacaomanuelcruz.projeto2.store.AppRecordRepository;
import br.org.fundacaomanuelcruz.projeto2.user.AppUser;
import br.org.fundacaomanuelcruz.projeto2.user.AppUserRepository;
import br.org.fundacaomanuelcruz.projeto2.user.UserRole;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class AlertDigestService {

    private static final Logger log = LoggerFactory.getLogger(AlertDigestService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final AppUserRepository userRepository;
    private final ReminderRepository reminderRepository;
    private final AppRecordRepository recordRepository;
    private final AlertEmailSender emailSender;
    private final ObjectMapper objectMapper;

    public AlertDigestService(
            AppUserRepository userRepository,
            ReminderRepository reminderRepository,
            AppRecordRepository recordRepository,
            AlertEmailSender emailSender,
            ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.reminderRepository = reminderRepository;
        this.recordRepository = recordRepository;
        this.emailSender = emailSender;
        this.objectMapper = objectMapper;
    }

    public record UserAlertItem(String severity, String title, String detail) {}

    @Transactional(readOnly = true)
    public int sendDailyAlertDigests() {
        LocalDate today = LocalDate.now();
        List<AppUser> users = userRepository.findAll().stream()
                .filter(AppUser::isActive)
                .toList();

        int sentCount = 0;
        for (AppUser user : users) {
            JsonNode prefs = parseJson(user.getPreferences());
            JsonNode alertsNode = prefs.path("alerts");
            if (!alertsNode.path("emailNotifications").asBoolean(false)) {
                continue;
            }

            JsonNode enabledNode = alertsNode.path("enabled");
            boolean remEnabled = enabledNode.path("reminders").asBoolean(true);
            boolean contEnabled = enabledNode.path("contracts").asBoolean(true);
            boolean mpEnabled = enabledNode.path("mp").asBoolean(true);
            boolean invEnabled = enabledNode.path("inventory").asBoolean(true);
            boolean justEnabled = enabledNode.path("justifications").asBoolean(true);

            int remDays = Math.max(0, alertsNode.path("reminderDays").asInt(3));
            int contDays = Math.max(7, alertsNode.path("contractDays").asInt(30));
            int mpDays = Math.max(1, alertsNode.path("mpDays").asInt(7));

            List<UserAlertItem> items = new ArrayList<>();

            // 1. Lembretes
            if (remEnabled) {
                for (Reminder reminder : reminderRepository.findAllByOrderByDoneAscDueDateAscIdAsc()) {
                    if (reminder.isDone() || reminder.getDueDate() == null) continue;
                    long days = ChronoUnit.DAYS.between(today, reminder.getDueDate());
                    if (days <= remDays) {
                        String severity = days <= 0 ? "Crítico" : "Aviso";
                        String text = days < 0 ? "Atrasado há " + (-days) + " dia(s)" : (days == 0 ? "Vence hoje" : "Vence em " + days + " dia(s)");
                        items.add(new UserAlertItem(severity, reminder.getTitle(), "Lembrete: " + text + " (" + reminder.getDueDate().format(DATE_FMT) + ")"));
                    }
                }
            }

            // 2. Contratos de clientes (nome do inquilino: só para quem pode ler os clientes)
            if (contEnabled && user.getRole() != UserRole.FUNCIONARIO) {
                for (AppRecord rec : recordRepository.findAllByIdCollectionOrderByCreatedAtAsc("clients")) {
                    JsonNode data = parseJson(rec.getPayload());
                    String status = data.path("contractStatus").asString("");
                    String endDateStr = data.path("contractEndDate").asString("");
                    if ("Encerrado".equalsIgnoreCase(status) || endDateStr.isEmpty()) continue;
                    try {
                        LocalDate endDate = LocalDate.parse(endDateStr);
                        long days = ChronoUnit.DAYS.between(today, endDate);
                        if (days <= contDays) {
                            String severity = days < 0 ? "Crítico" : "Aviso";
                            String name = data.path("name").asString("Inquilino");
                            String code = data.path("propertyCode").asString("");
                            String text = days < 0 ? "Contrato vencido em " + endDate.format(DATE_FMT) : "Contrato vence em " + days + " dia(s)";
                            items.add(new UserAlertItem(severity, "Contrato: " + name + " (" + code + ")", text));
                        }
                    } catch (Exception ignored) {}
                }
            }

            // 3. Ministério Público
            if (mpEnabled) {
                for (AppRecord rec : recordRepository.findAllByIdCollectionOrderByCreatedAtAsc("mp-submissions")) {
                    JsonNode data = parseJson(rec.getPayload());
                    String status = data.path("status").asString("");
                    String dueDateStr = data.path("dueDate").asString("");
                    if (!("Pendente".equalsIgnoreCase(status) || "Em revisão".equalsIgnoreCase(status)) || dueDateStr.isEmpty()) continue;
                    try {
                        LocalDate dueDate = LocalDate.parse(dueDateStr);
                        long days = ChronoUnit.DAYS.between(today, dueDate);
                        if (days <= mpDays) {
                            String severity = days <= 0 ? "Crítico" : "Aviso";
                            String title = data.path("title").asString("Envio MP");
                            String period = data.path("referencePeriod").asString("");
                            String text = days <= 0 ? "Prazo esgotado em " + dueDate.format(DATE_FMT) : "Envio ao MP vence em " + days + " dia(s)";
                            items.add(new UserAlertItem(severity, title + " (" + period + ")", text + " · Status: " + status));
                        }
                    } catch (Exception ignored) {}
                }
            }

            // 4. Estoque
            if (invEnabled) {
                for (AppRecord rec : recordRepository.findAllByIdCollectionOrderByCreatedAtAsc("inventory")) {
                    JsonNode data = parseJson(rec.getPayload());
                    int qty = data.path("quantity").asInt(0);
                    int min = data.path("minQuantity").asInt(0);
                    if (qty <= min) {
                        String name = data.path("name").asString("Item de estoque");
                        String spec = data.path("packageSpec").asString("");
                        String severity = qty == 0 ? "Crítico" : "Aviso";
                        String text = qty == 0 ? "Item sem estoque" : "Restam " + qty + " un. (mínimo de " + min + ")";
                        items.add(new UserAlertItem(severity, name + " (" + spec + ")", text));
                    }
                }
            }

            // 5. Justificativas (somente para Gestores e Administradores)
            if (justEnabled && user.getRole() != UserRole.FUNCIONARIO) {
                for (AppRecord rec : recordRepository.findAllByIdCollectionOrderByCreatedAtAsc("justifications")) {
                    JsonNode data = parseJson(rec.getPayload());
                    String status = data.path("status").asString("");
                    if ("Pendente".equalsIgnoreCase(status)) {
                        String empName = data.path("employeeName").asString("Funcionário");
                        String type = data.path("type").asString("Justificativa");
                        String dateStr = data.path("date").asString("");
                        items.add(new UserAlertItem("Aviso", "Justificativa: " + empName, type + " em " + dateStr + " aguardando análise"));
                    }
                }
            }

            if (items.isEmpty()) {
                continue;
            }

            long criticalCount = items.stream().filter(i -> "Crítico".equalsIgnoreCase(i.severity())).count();
            long warningCount = items.size() - criticalCount;

            String subject = String.format("[Fundação Manoel Cruz] Resumo de Alertas: %d crítico(s), %d aviso(s)", criticalCount, warningCount);
            String bodyText = buildPlainText(user.getDisplayName(), items);
            String bodyHtml = buildHtml(user.getDisplayName(), items, criticalCount, warningCount);

            if (emailSender.sendEmail(user.getEmail(), user.getDisplayName(), subject, bodyText, bodyHtml)) {
                sentCount++;
            }
        }

        log.info("[AlertDigestService] Processamento diário concluído: {} e-mail(s) enviado(s).", sentCount);
        return sentCount;
    }

    private JsonNode parseJson(String json) {
        if (json == null || json.isBlank()) return objectMapper.createObjectNode();
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            return objectMapper.createObjectNode();
        }
    }

    private String buildPlainText(String name, List<UserAlertItem> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("Olá, ").append(name).append(",\n\n");
        sb.append("Segue o resumo de alertas e prazos da Fundação Manoel Cruz:\n\n");
        for (UserAlertItem item : items) {
            sb.append("[").append(item.severity()).append("] ")
              .append(item.title()).append("\n")
              .append("   ").append(item.detail()).append("\n\n");
        }
        sb.append("Acesse o painel em https://projetocesarschool.vercel.app/alertas para gerenciar ou atualizar suas preferências.\n");
        return sb.toString();
    }

    private String buildHtml(String name, List<UserAlertItem> items, long critical, long warning) {
        StringBuilder sb = new StringBuilder();
        sb.append("<div style=\"font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;\">");
        sb.append("<h2 style=\"color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;\">Fundação Manoel Cruz — Alertas de Prazo</h2>");
        sb.append("<p>Olá, <strong>").append(name).append("</strong>,</p>");
        sb.append("<p>Você possui <strong>").append(critical).append(" alerta(s) crítico(s)</strong> e <strong>").append(warning).append(" aviso(s)</strong> ativos no sistema:</p>");
        sb.append("<table style=\"width: 100%; border-collapse: collapse; margin-top: 16px;\">");
        for (UserAlertItem item : items) {
            boolean isCritical = "Crítico".equalsIgnoreCase(item.severity());
            String badgeBg = isCritical ? "#fee2e2" : "#fef3c7";
            String badgeColor = isCritical ? "#b91c1c" : "#92400e";
            sb.append("<tr style=\"border-bottom: 1px solid #f1f5f9;\">");
            sb.append("<td style=\"padding: 10px 4px; vertical-align: top; width: 80px;\">");
            sb.append("<span style=\"background: ").append(badgeBg).append("; color: ").append(badgeColor).append("; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: bold;\">").append(item.severity()).append("</span>");
            sb.append("</td>");
            sb.append("<td style=\"padding: 10px 8px; vertical-align: top;\">");
            sb.append("<div style=\"font-weight: 600; font-size: 14px;\">").append(item.title()).append("</div>");
            sb.append("<div style=\"color: #64748b; font-size: 13px;\">").append(item.detail()).append("</div>");
            sb.append("</td>");
            sb.append("</tr>");
        }
        sb.append("</table>");
        sb.append("<p style=\"margin-top: 24px;\"><a href=\"https://projetocesarschool.vercel.app/alertas\" style=\"background: #1e3a8a; color: #fff; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;\">Acessar Alertas no Painel</a></p>");
        sb.append("<p style=\"color: #94a3b8; font-size: 12px; margin-top: 24px;\">Para desativar ou alterar seus lembretes diários por e-mail, acesse as Preferências de Alertas na sua conta.</p>");
        sb.append("</div>");
        return sb.toString();
    }
}
