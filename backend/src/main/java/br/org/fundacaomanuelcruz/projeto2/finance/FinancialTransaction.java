package br.org.fundacaomanuelcruz.projeto2.finance;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "financial_transaction")
public class FinancialTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 20)
    private FinancialTransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", length = 10)
    private BrazilianDocumentType documentType;

    @Column(name = "tenant_name", nullable = false, length = 160)
    private String tenantName;

    @Column(name = "document_number", nullable = false, length = 20)
    private String documentNumber;

    @Column(name = "property_registration", nullable = false, length = 80)
    private String propertyRegistration;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "gross_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal grossAmount;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected FinancialTransaction() {
    }

    private FinancialTransaction(
            FinancialTransactionType type,
            BrazilianDocumentType documentType,
            String tenantName,
            String documentNumber,
            String propertyRegistration,
            LocalDate transactionDate,
            BigDecimal grossAmount) {
        this.type = type;
        this.documentType = documentType;
        this.tenantName = tenantName;
        this.documentNumber = documentNumber;
        this.propertyRegistration = propertyRegistration;
        this.transactionDate = transactionDate;
        this.grossAmount = grossAmount;
    }

    public static FinancialTransaction income(
            BrazilianDocumentType documentType,
            String tenantName,
            String documentNumber,
            String propertyRegistration,
            LocalDate transactionDate,
            BigDecimal grossAmount) {
        return new FinancialTransaction(
                FinancialTransactionType.INCOME,
                documentType,
                tenantName,
                documentNumber,
                propertyRegistration,
                transactionDate,
                grossAmount);
    }

    public static FinancialTransaction expense(
            String description,
            String propertyRegistration,
            LocalDate transactionDate,
            BigDecimal grossAmount) {
        return new FinancialTransaction(
                FinancialTransactionType.EXPENSE,
                null,
                description,
                "N/A",
                propertyRegistration,
                transactionDate,
                grossAmount);
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

    public FinancialTransactionType getType() {
        return type;
    }

    public BrazilianDocumentType getDocumentType() {
        return documentType;
    }

    public String getTenantName() {
        return tenantName;
    }

    public String getDocumentNumber() {
        return documentNumber;
    }

    public String getPropertyRegistration() {
        return propertyRegistration;
    }

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public BigDecimal getGrossAmount() {
        return grossAmount;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
