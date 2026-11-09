package br.org.fundacaomanuelcruz.projeto2.store;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "app_record")
public class AppRecord {

    public static final int MAX_PAYLOAD_CHARS = 1_000_000;

    @EmbeddedId
    private AppRecordId id;

    @Column(nullable = false, length = AppRecord.MAX_PAYLOAD_CHARS)
    private String payload;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "updated_by", nullable = false, length = 160)
    private String updatedBy;

    protected AppRecord() {
    }

    public AppRecord(AppRecordId id) {
        this.id = id;
    }

    public void update(String payload, String author) {
        this.payload = payload;
        this.updatedBy = author;
    }

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public AppRecordId getId() {
        return id;
    }

    public String getPayload() {
        return payload;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }
}
