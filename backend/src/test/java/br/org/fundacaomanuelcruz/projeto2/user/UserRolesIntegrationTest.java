package br.org.fundacaomanuelcruz.projeto2.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import tools.jackson.databind.ObjectMapper;

/** Níveis de acesso: primeira conta vira Gerente; as demais entram como Funcionário. */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:papeis;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "app.auth.username=gestor",
        "app.auth.password=senha-de-teste",
        "app.auth.token-secret=segredo-de-teste-123"})
@AutoConfigureMockMvc
class UserRolesIntegrationTest {

    private static final String MANAGER = "gerente@fundacao.org";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String login(String email) throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "10.1." + (int) (Math.random() * 250) + "." + (int) (Math.random() * 250))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"123456\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asString();
    }

    private MockHttpServletRequestBuilder as(String token, MockHttpServletRequestBuilder request) {
        return request.header("Authorization", "Bearer " + token);
    }

    private MockHttpServletRequestBuilder json(String token, MockHttpServletRequestBuilder request, String content) {
        return as(token, request).contentType(MediaType.APPLICATION_JSON).content(content);
    }

    @Test
    void funcionarioConsultaMasNaoAlteraCadastros() throws Exception {
        String manager = login(MANAGER);
        mockMvc.perform(as(manager, get("/api/v1/auth/me"))).andExpect(jsonPath("$.role").value("GERENTE"));

        String staff = login("func-" + UUID.randomUUID() + "@fundacao.org");
        mockMvc.perform(as(staff, get("/api/v1/auth/me"))).andExpect(jsonPath("$.role").value("FUNCIONARIO"));
        mockMvc.perform(as(staff, get("/api/v1/reminders"))).andExpect(status().isOk());

        mockMvc.perform(json(staff, post("/api/v1/reminders"), """
                        {"title":"Teste","dueDate":"%s","category":"OUTRO","priority":"BAIXA"}
                        """.formatted(LocalDate.now().plusDays(1))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Seu perfil não tem permissão para esta ação. Fale com o gerente."));
        mockMvc.perform(json(staff, put("/api/v1/records/clients/cli-x"), "{\"name\":\"X\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(as(staff, get("/api/v1/users"))).andExpect(status().isForbidden());
        mockMvc.perform(as(staff, delete("/api/v1/records/documents/doc-estatuto"))).andExpect(status().isForbidden());
    }

    @Test
    void formatacaoDosModelosSoGestorAltera() throws Exception {
        String manager = login(MANAGER);
        String staff = login("func-" + UUID.randomUUID() + "@fundacao.org");
        String layout = """
                {"header":"FUNDAÇÃO MANUEL CRUZ","title":"RECIBO","paragraphs":["Recebemos de {inquilino}."],
                 "font":"sans","align":"left","size":"large"}
                """;

        mockMvc.perform(json(staff, put("/api/v1/records/template-settings/recibo"), layout)).andExpect(status().isForbidden());
        mockMvc.perform(json(manager, put("/api/v1/records/template-settings/recibo"), layout)).andExpect(status().isOk());
        mockMvc.perform(as(staff, get("/api/v1/records/template-settings")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].data.font").value("sans"));
        mockMvc.perform(as(staff, delete("/api/v1/records/template-settings/recibo"))).andExpect(status().isForbidden());
        mockMvc.perform(as(manager, delete("/api/v1/records/template-settings/recibo"))).andExpect(status().is2xxSuccessful());
    }

    @Test
    void funcionarioEnviaJustificativaMasNaoAprova() throws Exception {
        login(MANAGER);
        String staff = login("func-" + UUID.randomUUID() + "@fundacao.org");
        String id = "just-" + UUID.randomUUID().toString().substring(0, 8);
        String pending = """
                {"employeeId":"func-ana","employeeName":"Ana","date":"2026-11-05","type":"Atraso","reason":"Trânsito",
                 "status":"Pendente","submittedAt":"2026-11-05T09:00:00Z","submittedBy":"Ana","reviewedBy":null}
                """;
        mockMvc.perform(json(staff, put("/api/v1/records/justifications/" + id), pending)).andExpect(status().isOk());
        mockMvc.perform(json(staff, put("/api/v1/records/justifications/" + id), pending.replace("Pendente", "Aprovada")))
                .andExpect(status().isForbidden());
        mockMvc.perform(json(staff, put("/api/v1/records/justifications/just-" + UUID.randomUUID().toString().substring(0, 8)),
                        pending.replace("Pendente", "Aprovada")))
                .andExpect(status().isForbidden());
    }

    @Test
    void funcionarioSoBaixaQuantidadeDoEstoque() throws Exception {
        String manager = login(MANAGER);
        String staff = login("func-" + UUID.randomUUID() + "@fundacao.org");
        String id = "est-" + UUID.randomUUID().toString().substring(0, 8);
        String item = "{\"name\":\"Luva\",\"packageSpec\":\"Par\",\"unitPrice\":3.5,\"quantity\":%d,\"minQuantity\":5,\"category\":\"Limpeza\",\"lastPurchaseDate\":\"2026-11-01\"}";
        mockMvc.perform(json(manager, put("/api/v1/records/inventory/" + id), item.formatted(10))).andExpect(status().isOk());
        mockMvc.perform(json(staff, put("/api/v1/records/inventory/" + id), item.formatted(8))).andExpect(status().isOk());
        mockMvc.perform(json(staff, put("/api/v1/records/inventory/" + id), item.formatted(50))).andExpect(status().isForbidden());
        mockMvc.perform(json(staff, put("/api/v1/records/inventory/" + id), item.formatted(7).replace("3.5", "0.1")))
                .andExpect(status().isForbidden());
    }

    @Test
    void gerentePromoveDesativaENaoFicaSemGerente() throws Exception {
        String manager = login(MANAGER);
        String email = "promo-" + UUID.randomUUID() + "@fundacao.org";
        String staff = login(email);

        mockMvc.perform(json(manager, put("/api/v1/users/" + email + "/role"), "{\"role\":\"ADMINISTRADOR\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMINISTRADOR"));
        // O papel novo vale na hora, com o mesmo token.
        mockMvc.perform(json(staff, post("/api/v1/reminders"), """
                        {"title":"Promovido","dueDate":"%s","category":"OUTRO","priority":"BAIXA"}
                        """.formatted(LocalDate.now().plusDays(1))))
                .andExpect(status().isCreated());

        mockMvc.perform(json(manager, put("/api/v1/users/" + email + "/active"), "{\"active\":false}"))
                .andExpect(status().isOk());
        mockMvc.perform(as(staff, get("/api/v1/reminders"))).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .header("X-Forwarded-For", "10.9.9.9")
                        .content("{\"email\":\"" + email + "\",\"password\":\"123456\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Conta desativada. Fale com o gerente da Fundação."));

        mockMvc.perform(json(manager, put("/api/v1/users/" + MANAGER + "/role"), "{\"role\":\"FUNCIONARIO\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(json(manager, put("/api/v1/users/" + MANAGER + "/active"), "{\"active\":false}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void preferenciasDaContaSaoSalvasENomeEditadoSobreviveAoLogin() throws Exception {
        String token = login("pref-" + UUID.randomUUID() + "@fundacao.org");
        mockMvc.perform(json(token, put("/api/v1/auth/me/preferences"), "{\"alerts\":{\"inventory\":false}}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preferences.alerts.inventory").value(false));
        mockMvc.perform(json(token, put("/api/v1/auth/me/preferences"), "[1]")).andExpect(status().isBadRequest());

        String email = "nome-" + UUID.randomUUID() + "@fundacao.org";
        String other = login(email);
        mockMvc.perform(json(other, put("/api/v1/auth/me"), "{\"name\":\"Maria do Carmo\"}")).andExpect(status().isOk());
        String again = login(email);
        mockMvc.perform(as(again, get("/api/v1/auth/me"))).andExpect(jsonPath("$.name").value("Maria do Carmo"));
    }

    @Test
    void managerEmailsPadraoEntramSempreComoGerente() throws Exception {
        String tokenHbsv = login("hbsv@cesar.school");
        mockMvc.perform(as(tokenHbsv, get("/api/v1/auth/me")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("GERENTE"));

        String tokenGabriel = login("gabrielsarges1926@gmail.com");
        mockMvc.perform(as(tokenGabriel, get("/api/v1/auth/me")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("GERENTE"));
    }
}
