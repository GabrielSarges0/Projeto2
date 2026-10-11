package br.org.fundacaomanuelcruz.projeto2.reminder;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReminderService {

    private final ReminderRepository repository;

    public ReminderService(ReminderRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ReminderResponse> listAll() {
        return repository.findAllByOrderByDoneAscIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReminderResponse create(CreateReminderRequest request) {
        Reminder reminder = new Reminder(request.text().trim());
        return toResponse(repository.save(reminder));
    }

    @Transactional
    public ReminderResponse toggle(Long id) {
        Reminder reminder = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lembrete não encontrado: " + id));
        reminder.setDone(!reminder.isDone());
        return toResponse(repository.save(reminder));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Lembrete não encontrado: " + id);
        }
        repository.deleteById(id);
    }

    private ReminderResponse toResponse(Reminder reminder) {
        return new ReminderResponse(reminder.getId(), reminder.getText(), reminder.isDone());
    }
}

