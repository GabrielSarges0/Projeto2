package br.org.fundacaomanuelcruz.projeto2.alert;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import tools.jackson.databind.ObjectMapper;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:alertas_test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "app.auth.username=gestor",
        "app.auth.password=senha-de-teste",
        "app.auth.token-secret=segredo-de-teste-123",
        "app.alerts.scheduling.enabled=false"
})
@AutoConfigureMockMvc
class AlertDigestIntegrationTest {

    private static final String MANAGER = "gerente.alertas@fundacao.org";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String login(String email) throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "10.2." + (int) (Math.random() * 250) + "." + (int) (Math.random() * 250))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"123456\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asString();
    }

    private MockHttpServletRequestBuilder as(String token, MockHttpServletRequestBuilder request) {
        return request.header("Authorization", "Bearer " + token);
    }

    @Test
    void shouldTriggerAlertDigestAndSendForOptedInUser() throws Exception {
        String managerToken = login(MANAGER);

        // 1. Configura preferência do gerente para receber notificações por e-mail
        String prefs = """
                {
                  "alerts": {
                    "emailNotifications": true,
                    "enabled": {
                      "reminders": true,
                      "contracts": true,
                      "mp": true,
                      "inventory": true,
                      "justifications": true
                    },
                    "reminderDays": 15
                  }
                }
                """;
        mockMvc.perform(as(managerToken, put("/api/v1/auth/me/preferences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(prefs)))
                .andExpect(status().isOk());

        // 2. Cria um lembrete com prazo próximo
        String dueDate = LocalDate.now().plusDays(2).toString();
        String reminder = String.format("""
                {
                  "title": "Renovação de Seguro Predial",
                  "dueDate": "%s",
                  "category": "FINANCEIRO",
                  "priority": "ALTA",
                  "responsible": "Financeiro",
                  "description": "Renovação anual do seguro predial"
                }
                """, dueDate);

        mockMvc.perform(as(managerToken, post("/api/v1/reminders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reminder)))
                .andExpect(status().isCreated());

        // 3. Dispara o resumo de alertas
        mockMvc.perform(as(managerToken, post("/api/v1/alerts/digest/trigger")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.sentCount").isNumber());

        // 4. Sem autenticação deve retornar 401
        mockMvc.perform(post("/api/v1/alerts/digest/trigger"))
                .andExpect(status().isUnauthorized());
    }
}
