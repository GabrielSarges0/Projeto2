package br.org.fundacaomanuelcruz.projeto2.alert;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
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

    @MockitoBean
    private AlertEmailSender emailSender;

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

    @Test
    void funcionarioNaoRecebeContratoDeInquilinoNoEmail() throws Exception {
        String managerToken = login(MANAGER);
        String staffEmail = "func-" + UUID.randomUUID() + "@fundacao.org";
        String staffToken = login(staffEmail);
        when(emailSender.sendEmail(anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(true);

        String prefs = """
                {"alerts":{"emailNotifications":true,"reminderDays":15,
                 "enabled":{"reminders":true,"contracts":true,"mp":true,"inventory":true,"justifications":true}}}
                """;
        for (String token : new String[] {managerToken, staffToken}) {
            mockMvc.perform(as(token, put("/api/v1/auth/me/preferences")).contentType(MediaType.APPLICATION_JSON).content(prefs))
                    .andExpect(status().isOk());
        }
        String tenant = "Inquilina " + UUID.randomUUID().toString().substring(0, 8);
        mockMvc.perform(as(managerToken, put("/api/v1/records/clients/cli-" + UUID.randomUUID().toString().substring(0, 8)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"%s","propertyCode":"IM-01","contractStatus":"Ativo","contractEndDate":"%s"}
                                """.formatted(tenant, LocalDate.now().plusDays(5))))
                .andExpect(status().isOk());
        // Lembrete vale para todos: garante que o funcionário também recebe um e-mail.
        mockMvc.perform(as(managerToken, post("/api/v1/reminders"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Vistoria","dueDate":"%s","category":"OUTRO","priority":"BAIXA"}
                                """.formatted(LocalDate.now().plusDays(1))))
                .andExpect(status().isCreated());

        mockMvc.perform(as(managerToken, post("/api/v1/alerts/digest/trigger"))).andExpect(status().isOk());

        ArgumentCaptor<String> staffBody = ArgumentCaptor.forClass(String.class);
        verify(emailSender, atLeastOnce()).sendEmail(eq(staffEmail), anyString(), anyString(), staffBody.capture(), any());
        assertThat(staffBody.getAllValues()).allSatisfy(body -> assertThat(body).contains("Vistoria").doesNotContain(tenant));

        ArgumentCaptor<String> managerBody = ArgumentCaptor.forClass(String.class);
        verify(emailSender, atLeastOnce()).sendEmail(eq(MANAGER), anyString(), anyString(), managerBody.capture(), any());
        assertThat(managerBody.getAllValues()).anySatisfy(body -> assertThat(body).contains(tenant));
    }
}
