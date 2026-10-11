package br.org.fundacaomanuelcruz.projeto2.property;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "lease_contract")
public class LeaseContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "property_registration", nullable = false, length = 80)
    private String propertyRegistration;

    @Column(name = "tenant_name", nullable = false, length = 160)
    private String tenantName;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "monthly_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal monthlyAmount;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected LeaseContract() {
    }

    public LeaseContract(String propertyRegistration, String tenantName, LocalDate startDate, LocalDate endDate, BigDecimal monthlyAmount, String status) {
        this.propertyRegistration = propertyRegistration;
        this.tenantName = tenantName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.monthlyAmount = monthlyAmount;
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

    public String getPropertyRegistration() {
        return propertyRegistration;
    }

    public String getTenantName() {
        return tenantName;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public BigDecimal getMonthlyAmount() {
        return monthlyAmount;
    }

    public String getStatus() {
        return status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}

