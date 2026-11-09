package br.org.fundacaomanuelcruz.projeto2.reminder;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.org.fundacaomanuelcruz.projeto2.api.NotFoundException;
import br.org.fundacaomanuelcruz.projeto2.auth.CurrentUser;

@Service
public class ReminderService {

    static final int MAX_YEARS_AHEAD = 5;

    private final ReminderRepository repository;
    private final Clock clock;

    @Autowired
    public ReminderService(ReminderRepository repository) {
        this(repository, Clock.systemDefaultZone());
    }

    ReminderService(ReminderRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<ReminderResponse> listAll() {
        return repository.findAllByOrderByDoneAscDueDateAscIdAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReminderResponse create(CreateReminderRequest request) {
        LocalDate today = LocalDate.now(clock);
        if (request.dueDate().isBefore(today)) {
            throw new IllegalArgumentException("A data limite não pode estar no passado.");
        }
        return toResponse(repository.save(new Reminder(details(request, today))));
    }

    @Transactional
    public ReminderResponse update(Long id, CreateReminderRequest request) {
        Reminder reminder = find(id);
        // Na edição, um prazo já vencido pode ser mantido; só não pode ser trocado por outra data passada.
        LocalDate today = LocalDate.now(clock);
        if (request.dueDate().isBefore(today) && !request.dueDate().equals(reminder.getDueDate())) {
            throw new IllegalArgumentException("A nova data limite não pode estar no passado.");
        }
        reminder.apply(details(request, today));
        return toResponse(repository.save(reminder));
    }

    @Transactional
    public ReminderResponse toggle(Long id) {
        Reminder reminder = find(id);
        reminder.setDone(!reminder.isDone());
        return toResponse(repository.save(reminder));
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(find(id));
    }

    private Reminder find(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Lembrete não encontrado: " + id));
    }

    private Reminder.ReminderDetails details(CreateReminderRequest request, LocalDate today) {
        if (request.dueDate().isAfter(today.plusYears(MAX_YEARS_AHEAD))) {
            throw new IllegalArgumentException("A data limite deve estar nos próximos " + MAX_YEARS_AHEAD + " anos.");
        }
        String responsible = blankToNull(request.responsible());
        return new Reminder.ReminderDetails(
                request.title().trim(),
                request.dueDate(),
                request.category(),
                request.priority(),
                responsible != null ? responsible : CurrentUser.displayName(),
                blankToNull(request.description()));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private ReminderResponse toResponse(Reminder r) {
        return new ReminderResponse(
                r.getId(), r.getTitle(), r.getDueDate(), r.getCategory(), r.getPriority(),
                r.getResponsible(), r.getDescription(), r.isDone(), r.getCreatedAt(), r.getUpdatedAt());
    }
}
