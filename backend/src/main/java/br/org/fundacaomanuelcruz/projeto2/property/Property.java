package br.org.fundacaomanuelcruz.projeto2.property;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
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

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected Property() {
    }

    public Property(String registrationCode, String address, String currentTenant, BigDecimal monthlyRent, String status) {
        this.registrationCode = registrationCode;
        this.address = address;
        this.currentTenant = currentTenant;
        this.monthlyRent = monthlyRent;
        this.status = status;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
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

    public String getStatus() {
        return status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}

