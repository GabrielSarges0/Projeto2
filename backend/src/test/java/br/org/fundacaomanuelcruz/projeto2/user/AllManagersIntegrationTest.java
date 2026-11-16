package br.org.fundacaomanuelcruz.projeto2.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** Teste do MVP: com app.auth.all-managers=true, qualquer conta entra como Gerente. */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:todosgerentes;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "app.auth.username=gestor",
        "app.auth.password=senha-de-teste",
        "app.auth.token-secret=segredo-de-teste-123",
        "app.auth.all-managers=true"})
@AutoConfigureMockMvc
class AllManagersIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void todaContaEntraComoGerente() throws Exception {
        for (String email : new String[] {"primeira@exemplo.com", "segunda@exemplo.com", "terceira@exemplo.com"}) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"" + email + "\",\"password\":\"123456\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.user.role").value("GERENTE"));
        }
        mockMvc.perform(get("/api/v1/users").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic("gestor", "senha-de-teste")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.role != 'GERENTE')]").isEmpty());
    }
}
