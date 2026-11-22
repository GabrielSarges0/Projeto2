package br.org.fundacaomanuelcruz.projeto2.staff;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.org.fundacaomanuelcruz.projeto2.auth.FixedWindowRateLimiter;
import br.org.fundacaomanuelcruz.projeto2.store.AppRecord;
import br.org.fundacaomanuelcruz.projeto2.store.AppRecordId;
import br.org.fundacaomanuelcruz.projeto2.store.AppRecordRepository;
import br.org.fundacaomanuelcruz.projeto2.store.RecordCollection;
import br.org.fundacaomanuelcruz.projeto2.store.RecordService;
import br.org.fundacaomanuelcruz.projeto2.user.ForbiddenException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

/**
 * Autoatendimento do ponto: as coleções de pessoal só são lidas por Gerente/Administrador, então o funcionário
 * recebe daqui a lista de nomes e, com o CPF conferido no servidor, apenas os próprios registros. O ponto também é
 * gravado aqui, com a hora do servidor, para ninguém registrar ou alterar o ponto de um colega.
 */
@Service
public class StaffService {

    // Mesma resposta para funcionário inexistente, inativo ou CPF errado: não revela qual dos três falhou.
    static final String CPF_MISMATCH = "CPF não confere com o funcionário selecionado.";
    static final int MAX_CPF_ATTEMPTS = 10;

    private static final List<PunchStep> PUNCH_STEPS = List.of(
            new PunchStep("entryTime", "entryLocation", "Entrada"),
            new PunchStep("breakStart", "breakStartLocation", "Saída para intervalo"),
            new PunchStep("breakEnd", "breakEndLocation", "Retorno"),
            new PunchStep("exitTime", "exitLocation", "Saída final"));
    // Formato que o navegador gera em captureLocation (funcionarios/page.tsx); texto livre não entra no ponto.
    private static final Pattern LOCATION = Pattern.compile("^Lat -?\\d{1,2}\\.\\d{1,6}, Long -?\\d{1,3}\\.\\d{1,6} \\(±\\d{1,6}m\\)$");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

    private final AppRecordRepository repository;
    private final ObjectMapper objectMapper;
    private final RecordService recordService;
    private final Clock clock;
    private final ZoneId zone;
    // Por funcionário, não por IP: o X-Forwarded-For vem do cliente e criar conta é livre, então só assim a rota
    // não serve para adivinhar o CPF de um colega. Conta só funcionários que existem, para o mapa não crescer à toa.
    private final FixedWindowRateLimiter cpfAttempts = new FixedWindowRateLimiter(
            MAX_CPF_ATTEMPTS,
            Duration.ofMinutes(1),
            "Muitas tentativas de confirmar o CPF. Aguarde um minuto e tente de novo.",
            Clock.systemUTC());

    public StaffService(
            AppRecordRepository repository,
            ObjectMapper objectMapper,
            RecordService recordService,
            Clock clock,
            @Value("${app.time-zone}") String timeZone) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.recordService = recordService;
        this.clock = clock;
        this.zone = ZoneId.of(timeZone);
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
        Employee employee = identify(employeeId, cpf);
        return new StaffSelfServiceResponse(
                employee.toMember(),
                recordsOf(RecordCollection.ATTENDANCE, employeeId),
                recordsOf(RecordCollection.JUSTIFICATIONS, employeeId));
    }

    /**
     * Registra o próximo passo vazio do dia (entrada → intervalo → retorno → saída) com a data e a hora do servidor,
     * no fuso da Fundação. Passos já gravados nunca mudam; correções ficam com o gestor.
     */
    @Transactional
    public StaffPunchResponse punch(String employeeId, String cpf, String location) {
        if (location != null && !LOCATION.matcher(location).matches()) {
            throw new IllegalArgumentException("Localização em formato inválido.");
        }
        Employee employee = identify(employeeId, cpf);
        ZonedDateTime now = clock.instant().atZone(zone);
        String time = now.format(TIME);
        String recordId = "att-" + now.toLocalDate().format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + employeeId;
        ObjectNode day = repository.findById(new AppRecordId(RecordCollection.ATTENDANCE.slug(), recordId))
                .map(record -> objectMapper.readValue(record.getPayload(), ObjectNode.class))
                .orElseGet(() -> emptyDay(employeeId, now.toLocalDate().toString()));

        PunchStep next = PUNCH_STEPS.stream()
                .filter(step -> text(day, step.timeField()).isEmpty())
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("A jornada de hoje já está completa."));
        String last = PUNCH_STEPS.stream()
                .map(step -> text(day, step.timeField()))
                .filter(value -> !value.isEmpty())
                .reduce((first, second) -> second)
                .orElse("");
        if (!last.isEmpty() && time.compareTo(last) <= 0) {
            throw new IllegalArgumentException("Aguarde: o último registro foi às " + last + ".");
        }

        day.put("status", "Presente");
        day.put(next.timeField(), time);
        if (location != null) day.put(next.locationField(), location);
        day.put("registeredBy", employee.toMember().name());
        JsonNode saved = recordService.saveValidated(RecordCollection.ATTENDANCE, recordId, day).data();
        return new StaffPunchResponse(next.label(), time, saved);
    }

    private Employee identify(String employeeId, String cpf) {
        Employee employee = repository.findById(new AppRecordId(RecordCollection.EMPLOYEES.slug(), employeeId))
                .map(record -> new Employee(employeeId, read(record)))
                .filter(Employee::active)
                .orElseThrow(() -> new ForbiddenException(CPF_MISMATCH));
        cpfAttempts.check(employeeId);
        if (!sameCpf(employee.data().path("cpf").asString(""), cpf)) {
            throw new ForbiddenException(CPF_MISMATCH);
        }
        return employee;
    }

    private ObjectNode emptyDay(String employeeId, String date) {
        ObjectNode day = objectMapper.createObjectNode();
        day.put("employeeId", employeeId);
        day.put("date", date);
        day.put("status", "Presente");
        for (PunchStep step : PUNCH_STEPS) {
            day.putNull(step.timeField());
            day.putNull(step.locationField());
        }
        day.put("registeredBy", "");
        return day;
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isString() ? value.asString() : "";
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

    private record PunchStep(String timeField, String locationField, String label) {
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
