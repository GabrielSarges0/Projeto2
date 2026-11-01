package br.org.fundacaomanuelcruz.projeto2.property;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LeaseContractRepository extends JpaRepository<LeaseContract, Long> {

    List<LeaseContract> findTop5ByEndDateBetweenOrderByEndDateAsc(LocalDate start, LocalDate end);
}

