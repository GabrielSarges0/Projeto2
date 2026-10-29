package br.org.fundacaomanuelcruz.projeto2.auth;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {"app.auth.username=gestor", "app.auth.password=senha-de-teste"})
@AutoConfigureMockMvc
class AuthSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void apiExigeLoginSemAbrirJanelaNativaDoNavegador() throws Exception {
        mockMvc.perform(get("/api/v1/financial/summary").param("month", "1").param("year", "2026"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"));
    }

    @Test
    void credenciaisCorretasLiberamAApi() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me").with(httpBasic("gestor", "senha-de-teste")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("gestor"));
    }

    @Test
    void senhaErradaEhRecusada() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me").with(httpBasic("gestor", "senha-errada")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void preflightCorsEHealthCheckContinuamPublicos() throws Exception {
        mockMvc.perform(options("/api/v1/auth/me")
                        .header("Origin", "https://projeto-dois.vercel.app")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://projeto-dois.vercel.app"));
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
