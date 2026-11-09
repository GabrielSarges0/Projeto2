package br.org.fundacaomanuelcruz.projeto2.property;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "property")
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "registration_code", nullable = false, unique = true, length = 80)
    private String registrationCode;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(name = "current_tenant", length = 160)
    private String currentTenant;

    @Column(name = "monthly_rent", nullable = false, precision = 19, scale = 2)
    private BigDecimal monthlyRent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PropertyStatus status;

    @Column(length = 1000)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "updated_by", length = 160)
    private String updatedBy;

    protected Property() {
    }

    public Property(String registrationCode, PropertyDetails details, String author) {
        this.registrationCode = registrationCode;
        apply(details, author);
    }

    public void apply(PropertyDetails details, String author) {
        this.address = details.address();
        this.currentTenant = details.currentTenant();
        this.monthlyRent = details.monthlyRent();
        this.status = details.status();
        this.notes = details.notes();
        this.updatedBy = author;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getRegistrationCode() {
        return registrationCode;
    }

    public String getAddress() {
        return address;
    }

    public String getCurrentTenant() {
        return currentTenant;
    }

    public BigDecimal getMonthlyRent() {
        return monthlyRent;
    }

    public PropertyStatus getStatus() {
        return status;
    }

    public String getNotes() {
        return notes;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public record PropertyDetails(
            String address,
            String currentTenant,
            BigDecimal monthlyRent,
            PropertyStatus status,
            String notes) {
    }
}
