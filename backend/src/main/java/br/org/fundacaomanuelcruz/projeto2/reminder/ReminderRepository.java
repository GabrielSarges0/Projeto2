package br.org.fundacaomanuelcruz.projeto2.reminder;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    List<Reminder> findAllByOrderByDoneAscIdDesc();
}

