package br.org.fundacaomanuelcruz.projeto2.store;

import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public record AppRecordId(
        @Column(name = "collection", nullable = false, length = 40) String collection,
        @Column(name = "record_id", nullable = false, length = 80) String recordId) implements Serializable {
}
