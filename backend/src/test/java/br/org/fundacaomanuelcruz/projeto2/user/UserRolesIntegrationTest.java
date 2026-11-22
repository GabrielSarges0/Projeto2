package br.org.fundacaomanuelcruz.projeto2.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
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
@Import(UserRolesIntegrationTest.TestClockConfig.class)
class UserRolesIntegrationTest {

    private static final String MANAGER = "gerente@fundacao.org";

    /** Relógio que o teste avança: o ponto usa a hora do servidor. */
    static final class TestClock extends Clock {
        private volatile Instant now = Instant.parse("2026-11-23T11:00:00Z");

        void set(String instant) {
            now = Instant.parse(instant);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return Clock.fixed(now, zone);
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    @TestConfiguration
    static class TestClockConfig {
        @Bean
        @Primary
        TestClock testClock() {
            return new TestClock();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestClock clock;

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
    void fichaDaEquipeSoOGerenteLeOuGrava() throws Exception {
        String manager = login(MANAGER);
        mockMvc.perform(json(manager, put("/api/v1/records/team-profiles/tm-teste"), "{\"email\":\"x@fundacao.org\",\"cpf\":\"000\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(as(manager, get("/api/v1/records/team-profiles"))).andExpect(status().isOk());

        String staffEmail = "func-" + UUID.randomUUID() + "@fundacao.org";
        String staff = login(staffEmail);
        mockMvc.perform(as(staff, get("/api/v1/records/team-profiles"))).andExpect(status().isForbidden());
        mockMvc.perform(as(staff, get("/api/v1/records/team-profiles/tm-teste"))).andExpect(status().isForbidden());
        mockMvc.perform(json(staff, put("/api/v1/records/team-profiles/tm-teste"), "{}")).andExpect(status().isForbidden());

        // Administrador edita os módulos, mas não vê dados pessoais da equipe.
        mockMvc.perform(json(manager, put("/api/v1/users/" + staffEmail + "/role"), "{\"role\":\"ADMINISTRADOR\"}"))
                .andExpect(status().isOk());
        String admin = login(staffEmail);
        mockMvc.perform(as(admin, get("/api/v1/records/team-profiles"))).andExpect(status().isForbidden());
        mockMvc.perform(as(admin, delete("/api/v1/records/team-profiles/tm-teste"))).andExpect(status().isForbidden());
    }

    @Test
    void dadosPessoaisSoGestorEAdministradorLeem() throws Exception {
        String manager = login(MANAGER);
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String clientId = "cli-" + suffix;
        String employeeId = "func-" + suffix;
        String attendanceId = "att-20261105-" + employeeId;
        String justificationId = "just-" + suffix;
        mockMvc.perform(json(manager, put("/api/v1/records/clients/" + clientId), "{\"name\":\"Inquilina\",\"cpf\":\"111.444.777-35\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(json(manager, put("/api/v1/records/employees/" + employeeId), employee("Ana", "111.444.777-35", true)))
                .andExpect(status().isOk());
        mockMvc.perform(json(manager, put("/api/v1/records/attendance/" + attendanceId), attendance(employeeId, "2026-11-05")))
                .andExpect(status().isOk());
        mockMvc.perform(json(manager, put("/api/v1/records/justifications/" + justificationId), justification(employeeId, "2026-11-05")))
                .andExpect(status().isOk());

        String[] personal = {
                "/api/v1/records/clients", "/api/v1/records/clients/" + clientId,
                "/api/v1/records/employees", "/api/v1/records/employees/" + employeeId,
                "/api/v1/records/attendance", "/api/v1/records/attendance/" + attendanceId,
                "/api/v1/records/justifications", "/api/v1/records/justifications/" + justificationId,
        };
        for (String path : personal) {
            mockMvc.perform(as(manager, get(path))).andExpect(status().isOk());
        }

        String staffEmail = "func-" + UUID.randomUUID() + "@fundacao.org";
        String staff = login(staffEmail);
        for (String path : personal) {
            mockMvc.perform(as(staff, get(path)))
                    .andExpect(status().isForbidden())
                    .andExpect(content().string(not(containsString("111.444.777-35"))));
        }
        // O que não é dado pessoal continua aberto à leitura.
        mockMvc.perform(as(staff, get("/api/v1/records/inventory"))).andExpect(status().isOk());
        mockMvc.perform(as(staff, get("/api/v1/records/mp-submissions"))).andExpect(status().isOk());
        // Bloquear a leitura não tira do funcionário o envio de justificativa.
        mockMvc.perform(json(staff, put("/api/v1/records/justifications/just-novo-" + suffix), justification(employeeId, "2026-11-06")))
                .andExpect(status().isOk());
        // O ponto não é mais gravado direto: vai por /api/v1/staff/{id}/punch, com o CPF conferido no servidor.
        mockMvc.perform(json(staff, put("/api/v1/records/attendance/att-20261106-" + employeeId), attendance(employeeId, "2026-11-06")))
                .andExpect(status().isForbidden());

        mockMvc.perform(json(manager, put("/api/v1/users/" + staffEmail + "/role"), "{\"role\":\"ADMINISTRADOR\"}"))
                .andExpect(status().isOk());
        for (String path : personal) {
            mockMvc.perform(as(staff, get(path))).andExpect(status().isOk());
        }
    }

    @Test
    void funcionarioVeSoOProprioPontoDepoisDeConfirmarOCpf() throws Exception {
        String manager = login(MANAGER);
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String ana = "ana-" + suffix;
        String bruno = "bruno-" + suffix;
        String carla = "carla-" + suffix;
        mockMvc.perform(json(manager, put("/api/v1/records/employees/" + ana), employee("Ana " + suffix, "111.444.777-35", true)))
                .andExpect(status().isOk());
        mockMvc.perform(json(manager, put("/api/v1/records/employees/" + bruno), employee("Bruno " + suffix, "529.982.247-25", true)))
                .andExpect(status().isOk());
        mockMvc.perform(json(manager, put("/api/v1/records/employees/" + carla), employee("Carla " + suffix, "390.533.447-05", false)))
                .andExpect(status().isOk());
        for (String id : new String[] {ana, bruno}) {
            mockMvc.perform(json(manager, put("/api/v1/records/attendance/att-20261105-" + id), attendance(id, "2026-11-05")))
                    .andExpect(status().isOk());
            mockMvc.perform(json(manager, put("/api/v1/records/justifications/just-" + id), justification(id, "2026-11-05")))
                    .andExpect(status().isOk());
        }

        String staff = login("func-" + UUID.randomUUID() + "@fundacao.org");
        mockMvc.perform(as(staff, get("/api/v1/staff/directory")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '" + ana + "' && @.name == 'Ana " + suffix + "' && @.role == 'Porteiro')]").isNotEmpty())
                .andExpect(jsonPath("$[?(@.id == '" + bruno + "')]").isNotEmpty())
                .andExpect(jsonPath("$[?(@.id == '" + carla + "')]").isEmpty())
                .andExpect(content().string(not(containsString("cpf"))))
                .andExpect(content().string(not(containsString("111.444.777-35"))));

        mockMvc.perform(json(staff, post("/api/v1/staff/" + ana + "/self"), "{\"cpf\":\"11144477735\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.employee.id").value(ana))
                .andExpect(jsonPath("$.employee.name").value("Ana " + suffix))
                .andExpect(jsonPath("$.attendance.length()").value(1))
                .andExpect(jsonPath("$.attendance[0].employeeId").value(ana))
                .andExpect(jsonPath("$.attendance[0].entryLocation").value("Lat -8.05, Long -34.9 (±30m)"))
                .andExpect(jsonPath("$.justifications.length()").value(1))
                .andExpect(jsonPath("$.justifications[0].employeeId").value(ana))
                .andExpect(content().string(not(containsString(bruno))))
                .andExpect(content().string(not(containsString("cpf"))));

        String mismatch = "CPF não confere com o funcionário selecionado.";
        mockMvc.perform(json(staff, post("/api/v1/staff/" + ana + "/self"), "{\"cpf\":\"529.982.247-25\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(mismatch));
        // Inativo e inexistente respondem igual ao CPF errado.
        mockMvc.perform(json(staff, post("/api/v1/staff/" + carla + "/self"), "{\"cpf\":\"390.533.447-05\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(mismatch));
        mockMvc.perform(json(staff, post("/api/v1/staff/nao-existe-" + suffix + "/self"), "{\"cpf\":\"111.444.777-35\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(mismatch));
        mockMvc.perform(json(staff, post("/api/v1/staff/" + ana + "/self"), "{\"cpf\":\" \"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/staff/" + ana + "/self").contentType(MediaType.APPLICATION_JSON).content("{\"cpf\":\"11144477735\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/staff/directory")).andExpect(status().isUnauthorized());
    }

    @Test
    void confirmacaoDoCpfTemLimiteDeTentativasPorFuncionario() throws Exception {
        String manager = login(MANAGER);
        String id = "lim-" + UUID.randomUUID().toString().substring(0, 8);
        mockMvc.perform(json(manager, put("/api/v1/records/employees/" + id), employee("Dora", "111.444.777-35", true)))
                .andExpect(status().isOk());

        // Contas diferentes não somam um limite novo: a contagem é por funcionário.
        for (int attempt = 0; attempt < 10; attempt++) {
            String staff = login("func-" + UUID.randomUUID() + "@fundacao.org");
            mockMvc.perform(json(staff, post("/api/v1/staff/" + id + "/self"), "{\"cpf\":\"000.000.000-" + String.format("%02d", attempt) + "\"}"))
                    .andExpect(status().isForbidden());
        }
        String staff = login("func-" + UUID.randomUUID() + "@fundacao.org");
        mockMvc.perform(json(staff, post("/api/v1/staff/" + id + "/self"), "{\"cpf\":\"111.444.777-35\"}"))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void pontoSoComCpfConferidoEHoraDoServidor() throws Exception {
        String manager = login(MANAGER);
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String id = "ponto-" + suffix;
        mockMvc.perform(json(manager, put("/api/v1/records/employees/" + id), employee("Elisa " + suffix, "111.444.777-35", true)))
                .andExpect(status().isOk());
        String staff = login("func-" + UUID.randomUUID() + "@fundacao.org");
        String punch = "/api/v1/staff/" + id + "/punch";
        String gps = "Lat -8.0500, Long -34.9000 (±30m)";

        mockMvc.perform(json(staff, post(punch), "{\"cpf\":\"529.982.247-25\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("CPF não confere com o funcionário selecionado."));
        mockMvc.perform(json(staff, post(punch), "{\"cpf\":\"111.444.777-35\",\"location\":\"Rua da Aurora, 10\"}"))
                .andExpect(status().isBadRequest());

        // 11:00 UTC = 08:00 em Recife.
        clock.set("2026-11-23T11:00:00Z");
        mockMvc.perform(json(staff, post(punch), "{\"cpf\":\"11144477735\",\"location\":\"" + gps + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.step").value("Entrada"))
                .andExpect(jsonPath("$.time").value("08:00"))
                .andExpect(jsonPath("$.attendance.id").value("att-20261123-" + id))
                .andExpect(jsonPath("$.attendance.date").value("2026-11-23"))
                .andExpect(jsonPath("$.attendance.entryTime").value("08:00"))
                .andExpect(jsonPath("$.attendance.entryLocation").value(gps))
                .andExpect(jsonPath("$.attendance.registeredBy").value("Elisa " + suffix));
        mockMvc.perform(json(staff, post(punch), "{\"cpf\":\"111.444.777-35\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Aguarde: o último registro foi às 08:00."));

        clock.set("2026-11-23T15:00:00Z");
        mockMvc.perform(json(staff, post(punch), "{\"cpf\":\"111.444.777-35\"}"))
                .andExpect(jsonPath("$.step").value("Saída para intervalo"))
                .andExpect(jsonPath("$.attendance.breakStart").value("12:00"))
                .andExpect(jsonPath("$.attendance.breakStartLocation").isEmpty())
                .andExpect(jsonPath("$.attendance.entryTime").value("08:00"));
        clock.set("2026-11-23T16:00:00Z");
        mockMvc.perform(json(staff, post(punch), "{\"cpf\":\"111.444.777-35\"}")).andExpect(jsonPath("$.step").value("Retorno"));
        clock.set("2026-11-23T20:00:00Z");
        mockMvc.perform(json(staff, post(punch), "{\"cpf\":\"111.444.777-35\"}")).andExpect(jsonPath("$.step").value("Saída final"));
        clock.set("2026-11-23T20:30:00Z");
        mockMvc.perform(json(staff, post(punch), "{\"cpf\":\"111.444.777-35\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("A jornada de hoje já está completa."));

        mockMvc.perform(as(manager, get("/api/v1/records/attendance/att-20261123-" + id)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.entryTime").value("08:00"))
                .andExpect(jsonPath("$.data.breakEnd").value("13:00"))
                .andExpect(jsonPath("$.data.exitTime").value("17:00"));
        // O gestor continua ajustando o ponto direto.
        mockMvc.perform(json(manager, put("/api/v1/records/attendance/att-20261123-" + id), attendance(id, "2026-11-23")))
                .andExpect(status().isOk());

        // 01:30 UTC do dia 24 ainda é 22:30 do dia 23 em Recife.
        String late = "noite-" + suffix;
        mockMvc.perform(json(manager, put("/api/v1/records/employees/" + late), employee("Fábio " + suffix, "390.533.447-05", true)))
                .andExpect(status().isOk());
        clock.set("2026-11-24T01:30:00Z");
        mockMvc.perform(json(staff, post("/api/v1/staff/" + late + "/punch"), "{\"cpf\":\"390.533.447-05\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.time").value("22:30"))
                .andExpect(jsonPath("$.attendance.date").value("2026-11-23"));
    }

    @Test
    void documentosPessoaisFicamForaDoFuncionario() throws Exception {
        String manager = login(MANAGER);
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String subfolder = "fld-sub-" + suffix;
        String inSubfolder = "doc-sub-" + suffix;
        String receipt = "doc-recibo-" + suffix;
        String ofClient = "doc-cli-" + suffix;
        String report = "doc-rel-" + suffix;
        mockMvc.perform(json(manager, put("/api/v1/records/folders/" + subfolder),
                        "{\"name\":\"Maria Helena\",\"parentId\":\"fld-clientes\",\"createdAt\":\"2026-11-23\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(json(manager, put("/api/v1/records/documents/" + inSubfolder), document(subfolder, "Outro", null)))
                .andExpect(status().isOk());
        mockMvc.perform(json(manager, put("/api/v1/records/documents/" + receipt), document("fld-comprovantes", "Recibo", null)))
                .andExpect(status().isOk());
        mockMvc.perform(json(manager, put("/api/v1/records/documents/" + ofClient), document(null, "Outro", "cli-joao")))
                .andExpect(status().isOk());
        mockMvc.perform(json(manager, put("/api/v1/records/documents/" + report), document("fld-mp", "Relatório", null)))
                .andExpect(status().isOk());
        for (String doc : new String[] {inSubfolder, report}) {
            mockMvc.perform(json(manager, put("/api/v1/records/document-files/" + doc + "-p0"), filePart(doc, 0)))
                    .andExpect(status().isOk());
        }

        String staffEmail = "func-" + UUID.randomUUID() + "@fundacao.org";
        String staff = login(staffEmail);
        mockMvc.perform(as(staff, get("/api/v1/records/documents")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '" + report + "')]").isNotEmpty())
                .andExpect(jsonPath("$[?(@.id == 'doc-estatuto')]").isNotEmpty())
                // Categoria, pasta (com subpasta) e vínculo com cliente, cada um basta para esconder.
                .andExpect(jsonPath("$[?(@.id == '" + inSubfolder + "')]").isEmpty())
                .andExpect(jsonPath("$[?(@.id == '" + receipt + "')]").isEmpty())
                .andExpect(jsonPath("$[?(@.id == '" + ofClient + "')]").isEmpty())
                .andExpect(jsonPath("$[?(@.id == 'doc-pessoal-cli-joao')]").isEmpty())
                .andExpect(jsonPath("$[?(@.id == 'doc-contrato-im-001')]").isEmpty());
        mockMvc.perform(as(staff, get("/api/v1/records/documents/" + report))).andExpect(status().isOk());
        mockMvc.perform(as(staff, get("/api/v1/records/documents/" + receipt)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Documento restrito ao Gerente e ao Administrador."));

        mockMvc.perform(as(staff, get("/api/v1/records/folders")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == 'fld-mp')]").isNotEmpty())
                .andExpect(jsonPath("$[?(@.id == 'fld-clientes')]").isEmpty())
                .andExpect(jsonPath("$[?(@.id == 'fld-contratos')]").isEmpty())
                .andExpect(jsonPath("$[?(@.id == 'fld-funcionarios')]").isEmpty())
                .andExpect(jsonPath("$[?(@.id == '" + subfolder + "')]").isEmpty())
                .andExpect(content().string(not(containsString("Maria Helena"))));
        mockMvc.perform(as(staff, get("/api/v1/records/folders/" + subfolder))).andExpect(status().isForbidden());

        mockMvc.perform(as(staff, get("/api/v1/records/document-files"))).andExpect(status().isForbidden());
        mockMvc.perform(as(staff, get("/api/v1/records/document-files/" + inSubfolder + "-p0"))).andExpect(status().isForbidden());
        mockMvc.perform(as(staff, get("/api/v1/records/document-files/" + report + "-p0")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").value("data:text/plain;base64,T2zDoQ=="));

        // Não troca o arquivo de documento existente, nem cria parte nova para ele.
        mockMvc.perform(json(staff, put("/api/v1/records/document-files/" + report + "-p0"), filePart(report, 0)))
                .andExpect(status().isForbidden());
        mockMvc.perform(json(staff, put("/api/v1/records/document-files/" + report + "-p1"), filePart(report, 1)))
                .andExpect(status().isForbidden());
        mockMvc.perform(json(staff, put("/api/v1/records/document-files/doc-x-" + suffix + "-p0"), filePart(report, 0)))
                .andExpect(status().isForbidden());
        // Envio continua: atestado da justificativa cai na pasta restrita e some da lista dele.
        String upload = "doc-atestado-" + suffix;
        mockMvc.perform(json(staff, put("/api/v1/records/document-files/" + upload + "-p0"), filePart(upload, 0)))
                .andExpect(status().isOk());
        mockMvc.perform(json(staff, put("/api/v1/records/documents/" + upload), document("fld-funcionarios", "Justificativa", null)))
                .andExpect(status().isOk());
        mockMvc.perform(as(staff, get("/api/v1/records/documents")))
                .andExpect(jsonPath("$[?(@.id == '" + upload + "')]").isEmpty());

        mockMvc.perform(as(manager, get("/api/v1/records/documents")))
                .andExpect(jsonPath("$[?(@.id == '" + inSubfolder + "')]").isNotEmpty())
                .andExpect(jsonPath("$[?(@.id == '" + receipt + "')]").isNotEmpty())
                .andExpect(jsonPath("$[?(@.id == '" + upload + "')]").isNotEmpty());
        mockMvc.perform(as(manager, get("/api/v1/records/document-files/" + upload + "-p0"))).andExpect(status().isOk());

        mockMvc.perform(json(manager, put("/api/v1/users/" + staffEmail + "/role"), "{\"role\":\"ADMINISTRADOR\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(as(staff, get("/api/v1/records/documents/" + receipt))).andExpect(status().isOk());
        mockMvc.perform(as(staff, get("/api/v1/records/folders/" + subfolder))).andExpect(status().isOk());
        mockMvc.perform(as(staff, get("/api/v1/records/document-files/" + inSubfolder + "-p0"))).andExpect(status().isOk());
    }

    private static String document(String folderId, String category, String clientId) {
        return """
                {"name":"Arquivo.pdf","folderId":%s,"category":"%s","createdAt":"2026-11-23","sizeBytes":3,
                 "mimeType":"text/plain","fileParts":1,"protocol":"FMC-2026-00001","signed":false,"description":"",
                 "template":null,"templateData":null,"rendered":null,"clientId":%s,"movementId":null,"createdBy":"Teste"}
                """.formatted(folderId == null ? "null" : "\"" + folderId + "\"", category, clientId == null ? "null" : "\"" + clientId + "\"");
    }

    private static String filePart(String docId, int index) {
        return """
                {"docId":"%s","index":%d,"content":"data:text/plain;base64,T2zDoQ=="}
                """.formatted(docId, index);
    }

    private static String employee(String name, String cpf, boolean active) {
        return """
                {"name":"%s","role":"Porteiro","cpf":"%s","shiftStart":"08:00","shiftEnd":"17:00",
                 "breakStart":"12:00","breakEnd":"13:00","active":%s,"situation":"%s"}
                """.formatted(name, cpf, active, active ? "Ativo" : "Desligado");
    }

    private static String attendance(String employeeId, String date) {
        return """
                {"employeeId":"%s","date":"%s","status":"Presente","entryTime":"08:00",
                 "entryLocation":"Lat -8.05, Long -34.9 (±30m)","breakStart":null,"breakEnd":null,"exitTime":null,"registeredBy":"Teste"}
                """.formatted(employeeId, date);
    }

    private static String justification(String employeeId, String date) {
        return """
                {"employeeId":"%s","employeeName":"Teste","date":"%s","type":"Ausência","reason":"Consulta médica",
                 "status":"Pendente","submittedAt":"%sT09:00:00Z","submittedBy":"Teste","reviewedBy":null}
                """.formatted(employeeId, date, date);
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
