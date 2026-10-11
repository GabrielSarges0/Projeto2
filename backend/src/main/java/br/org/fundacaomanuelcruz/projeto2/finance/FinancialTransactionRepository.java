package br.org.fundacaomanuelcruz.projeto2.finance;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, Long> {

    List<FinancialTransaction> findByTransactionDateBetweenOrderByTransactionDateDescIdDesc(
            LocalDate start,
            LocalDate end);

    List<FinancialTransaction> findAllByOrderByTransactionDateDescIdDesc();
}
