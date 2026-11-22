package br.org.fundacaomanuelcruz.projeto2.staff;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.org.fundacaomanuelcruz.projeto2.auth.FixedWindowRateLimiter;
import br.org.fundacaomanuelcruz.projeto2.store.AppRecord;
import br.org.fundacaomanuelcruz.projeto2.store.AppRecordId;
import br.org.fundacaomanuelcruz.projeto2.store.AppRecordRepository;
import br.org.fundacaomanuelcruz.projeto2.store.RecordCollection;
import br.org.fundacaomanuelcruz.projeto2.user.ForbiddenException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Autoatendimento do ponto: as coleções de pessoal só são lidas por Gerente/Administrador, então o funcionário
 * recebe daqui a lista de nomes e, com o CPF conferido no servidor, apenas os próprios registros.
 */
@Service
public class StaffService {

    // Mesma resposta para funcionário inexistente, inativo ou CPF errado: não revela qual dos três falhou.
    static final String CPF_MISMATCH = "CPF não confere com o funcionário selecionado.";
    static final int MAX_CPF_ATTEMPTS = 10;

    private final AppRecordRepository repository;
    private final ObjectMapper objectMapper;
    // Por funcionário, não por IP: o X-Forwarded-For vem do cliente e criar conta é livre, então só assim a rota
    // não serve para adivinhar o CPF de um colega. Conta só funcionários que existem, para o mapa não crescer à toa.
    private final FixedWindowRateLimiter cpfAttempts = new FixedWindowRateLimiter(
            MAX_CPF_ATTEMPTS,
            Duration.ofMinutes(1),
            "Muitas tentativas de confirmar o CPF. Aguarde um minuto e tente de novo.",
            Clock.systemUTC());

    public StaffService(AppRecordRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<StaffMember> directory() {
        return repository.findAllByIdCollectionOrderByCreatedAtAsc(RecordCollection.EMPLOYEES.slug()).stream()
                .map(record -> new Employee(record.getId().recordId(), read(record)))
                .filter(Employee::active)
                .map(Employee::toMember)
                .sorted(Comparator.comparing(StaffMember::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional(readOnly = true)
    public StaffSelfServiceResponse selfService(String employeeId, String cpf) {
        Employee employee = repository.findById(new AppRecordId(RecordCollection.EMPLOYEES.slug(), employeeId))
                .map(record -> new Employee(employeeId, read(record)))
                .filter(Employee::active)
                .orElseThrow(() -> new ForbiddenException(CPF_MISMATCH));
        cpfAttempts.check(employeeId);
        if (!sameCpf(employee.data().path("cpf").asString(""), cpf)) {
            throw new ForbiddenException(CPF_MISMATCH);
        }
        return new StaffSelfServiceResponse(
                employee.toMember(),
                recordsOf(RecordCollection.ATTENDANCE, employeeId),
                recordsOf(RecordCollection.JUSTIFICATIONS, employeeId));
    }

    private List<JsonNode> recordsOf(RecordCollection collection, String employeeId) {
        return repository.findAllByIdCollectionOrderByCreatedAtAsc(collection.slug()).stream()
                .map(this::read)
                .filter(data -> employeeId.equals(data.path("employeeId").asString("")))
                .toList();
    }

    private static boolean sameCpf(String stored, String provided) {
        byte[] expected = digits(stored).getBytes(StandardCharsets.UTF_8);
        byte[] actual = digits(provided).getBytes(StandardCharsets.UTF_8);
        return expected.length > 0 && MessageDigest.isEqual(expected, actual);
    }

    private static String digits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    private JsonNode read(AppRecord record) {
        return objectMapper.readTree(record.getPayload());
    }

    private record Employee(String id, JsonNode data) {
        // Registros antigos não têm "active": valem como ativos, igual ao frontend.
        boolean active() {
            return data.path("active").asBoolean(true);
        }

        StaffMember toMember() {
            return new StaffMember(id, data.path("name").asString(""), data.path("role").asString(""));
        }
    }
}
