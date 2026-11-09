package br.org.fundacaomanuelcruz.projeto2;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** Fluxos ponta a ponta com H2: login aberto, token e as rotas usadas pelo painel. */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:fluxos;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "app.auth.username=gestor",
        "app.auth.password=senha-de-teste",
        "app.auth.token-secret=segredo-de-teste-123"})
@AutoConfigureMockMvc
class ApiFlowsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;

    @BeforeEach
    void login() throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "10.0.0." + (int) (Math.random() * 200))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"Hannah.Teste@exemplo.com\",\"password\":\"qualquer\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username").value("hannah.teste@exemplo.com"))
                .andExpect(jsonPath("$.user.name").value("Hannah Teste"))
                .andReturn().getResponse().getContentAsString();
        token = objectMapper.readTree(body).get("token").asString();
    }

    private MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder request) {
        return request.header("Authorization", "Bearer " + token);
    }

    private MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String content) {
        return auth(request).contentType(MediaType.APPLICATION_JSON).content(content);
    }

    @Test
    void qualquerContaEntraEOTokenDaAcessoAApi() throws Exception {
        mockMvc.perform(auth(get("/api/v1/auth/me")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Hannah Teste"));
        mockMvc.perform(get("/api/v1/reminders").header("Authorization", "Bearer token-falso.assinatura"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginRecusaEmailInvalidoESenhaCurta() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"sem-arroba\",\"password\":\"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    @Test
    void lembreteExigePrazoNaoPassadoEPodeSerEditado() throws Exception {
        LocalDate amanha = LocalDate.now().plusDays(1);
        mockMvc.perform(json(post("/api/v1/reminders"),
                        "{\"title\":\"Pagar IPTU\",\"category\":\"FINANCEIRO\",\"priority\":\"ALTA\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.dueDate").value("Informe a data limite."));
        mockMvc.perform(json(post("/api/v1/reminders"), """
                        {"title":"Pagar IPTU","dueDate":"%s","category":"FINANCEIRO","priority":"ALTA"}
                        """.formatted(LocalDate.now().minusDays(1))))
                .andExpect(status().isBadRequest());

        String created = mockMvc.perform(json(post("/api/v1/reminders"), """
                        {"title":"Pagar IPTU","dueDate":"%s","category":"FINANCEIRO","priority":"ALTA"}
                        """.formatted(amanha)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.responsible").value("Hannah Teste"))
                .andReturn().getResponse().getContentAsString();
        long id = objectMapper.readTree(created).get("id").asLong();

        mockMvc.perform(json(put("/api/v1/reminders/" + id), """
                        {"title":"Pagar IPTU 2026","dueDate":"%s","category":"IMOVEL","priority":"BAIXA",
                         "responsible":"Lara","description":"Guia no e-mail"}
                        """.formatted(amanha.plusDays(5))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Pagar IPTU 2026"))
                .andExpect(jsonPath("$.dueDate").value(amanha.plusDays(5).toString()))
                .andExpect(jsonPath("$.responsible").value("Lara"));

        mockMvc.perform(auth(delete("/api/v1/reminders/" + id))).andExpect(status().isNoContent());
        mockMvc.perform(auth(delete("/api/v1/reminders/" + id))).andExpect(status().isNotFound());
    }

    @Test
    void imovelPodeSerCriadoEditadoEMetricasSaoReais() throws Exception {
        String code = "IM-" + (10000 + (int) (Math.random() * 80000));
        String created = mockMvc.perform(json(post("/api/v1/properties"), """
                        {"registrationCode":"%s","address":"Rua Nova, 10 - Recife/PE","monthlyRent":1500.00,
                         "status":"DISPONIVEL"}
                        """.formatted(code)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = objectMapper.readTree(created).get("id").asLong();

        mockMvc.perform(json(post("/api/v1/properties"), """
                        {"registrationCode":"%s","address":"Outro endereço 1","monthlyRent":10,"status":"DISPONIVEL"}
                        """.formatted(code)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(json(put("/api/v1/properties/" + id), """
                        {"address":"Rua Nova, 10 - Recife/PE","monthlyRent":1500.00,"status":"OCUPADO"}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Imóvel ocupado precisa do nome do inquilino."));

        mockMvc.perform(json(put("/api/v1/properties/" + id), """
                        {"address":"Rua Nova, 10 - Recife/PE","currentTenant":"Ana Lima","monthlyRent":1600.00,
                         "status":"OCUPADO"}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OCUPADO"))
                .andExpect(jsonPath("$.updatedBy").value("Hannah Teste"));

        String metrics = mockMvc.perform(auth(get("/api/v1/properties/metrics")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode m = objectMapper.readTree(metrics);
        long soma = m.get("occupied").asLong() + m.get("available").asLong() + m.get("underMaintenance").asLong();
        org.junit.jupiter.api.Assertions.assertEquals(m.get("totalProperties").asLong(), soma);
    }

    @Test
    void entradaComValoresIrreaisERecusada() throws Exception {
        String base = """
                {"documentType":"CPF","tenantName":"%s","documentNumber":"529.982.247-25",
                 "propertyRegistration":"%s","transactionDate":"%s","grossAmount":%s}
                """;
        LocalDate hoje = LocalDate.now();
        mockMvc.perform(json(post("/api/v1/financial/incomes"), base.formatted("ab", "IM-001", hoje, "100")))
                .andExpect(status().isBadRequest());
        mockMvc.perform(json(post("/api/v1/financial/incomes"), base.formatted("João Silva", "IM-001", hoje.plusDays(3), "100")))
                .andExpect(status().isBadRequest());
        mockMvc.perform(json(post("/api/v1/financial/incomes"), base.formatted("João Silva", "IM-001", hoje, "1000000.01")))
                .andExpect(status().isBadRequest());
        mockMvc.perform(json(post("/api/v1/financial/incomes"), base.formatted("João Silva", "IM-777", hoje, "100")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Imóvel IM-777 não está cadastrado."));
        mockMvc.perform(json(post("/api/v1/financial/incomes"), base.formatted("João Silva", "im-001", hoje, "3200.50")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.propertyRegistration").value("IM-001"));
    }

    @Test
    void registrosCompartilhadosSalvamListamEExcluem() throws Exception {
        String id = "cli-" + UUID.randomUUID().toString().substring(0, 8);
        mockMvc.perform(json(put("/api/v1/records/clients/" + id), "{\"name\":\"Maria\",\"id\":\"outro\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(id))
                .andExpect(jsonPath("$.updatedBy").value("Hannah Teste"));
        mockMvc.perform(auth(get("/api/v1/records/clients")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", hasItem(id)));
        mockMvc.perform(json(put("/api/v1/records/clients/" + id), "[1,2]"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(json(put("/api/v1/records/senhas/" + id), "{}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(json(put("/api/v1/records/clients/id com espaço"), "{}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(auth(delete("/api/v1/records/clients/" + id))).andExpect(status().isNoContent());
        mockMvc.perform(auth(delete("/api/v1/records/clients/" + id))).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/records/clients")).andExpect(status().isUnauthorized());
    }
}
