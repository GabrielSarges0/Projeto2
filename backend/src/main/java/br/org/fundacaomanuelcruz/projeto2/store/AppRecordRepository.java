package br.org.fundacaomanuelcruz.projeto2.store;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppRecordRepository extends JpaRepository<AppRecord, AppRecordId> {
    List<AppRecord> findAllByIdCollectionOrderByCreatedAtAsc(String collection);

    long countByIdCollection(String collection);
}
