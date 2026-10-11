package br.org.fundacaomanuelcruz.projeto2.property;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {

    List<Property> findAllByOrderByRegistrationCodeAsc();

    long countByStatus(String status);
}

