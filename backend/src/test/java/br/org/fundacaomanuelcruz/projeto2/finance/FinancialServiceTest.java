package br.org.fundacaomanuelcruz.projeto2.finance;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FinancialServiceTest {

    @Mock
    private FinancialTransactionRepository repository;

    private FinancialService service;

    @BeforeEach
    void setUp() {
        service = new FinancialService(repository, new BrazilianDocumentValidator());
    }

    @Test
    void calculatesMonthlySummary() {
        LocalDate start = LocalDate.of(2026, 9, 1);
        LocalDate end = LocalDate.of(2026, 9, 30);

        when(repository.findByTransactionDateBetweenOrderByTransactionDateDescIdDesc(start, end))
                .thenReturn(List.of(
                        FinancialTransaction.income(
                                BrazilianDocumentType.CPF,
                                "Inquilino Teste",
                                "52998224725",
                                "IM-001",
                                LocalDate.of(2026, 9, 10),
                                new BigDecimal("1500.00")),
                        FinancialTransaction.expense(
                                "Manutencao",
                                "IM-001",
                                LocalDate.of(2026, 9, 12),
                                new BigDecimal("250.00"))));

        FinancialSummaryResponse summary = service.summary(9, 2026);

        assertEquals(0, summary.income().compareTo(new BigDecimal("1500.00")));
        assertEquals(0, summary.expense().compareTo(new BigDecimal("250.00")));
        assertEquals(0, summary.balance().compareTo(new BigDecimal("1250.00")));
    }

    @Test
    void rejectsInvalidCpf() {
        CreateIncomeRequest request = new CreateIncomeRequest(
                BrazilianDocumentType.CPF,
                "Inquilino Teste",
                "11111111111",
                "IM-001",
                LocalDate.of(2026, 9, 10),
                new BigDecimal("1000.00"));

        assertThrows(IllegalArgumentException.class, () -> service.createIncome(request));
    }

    @Test
    void persistsValidIncome() {
        when(repository.save(any(FinancialTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CreateIncomeRequest request = new CreateIncomeRequest(
                BrazilianDocumentType.CPF,
                "Inquilino Teste",
                "529.982.247-25",
                "IM-001",
                LocalDate.of(2026, 9, 10),
                new BigDecimal("1000.00"));

        FinancialMovementResponse response = service.createIncome(request);

        assertEquals(FinancialTransactionType.INCOME, response.type());
        assertEquals("IM-001", response.propertyRegistration());
        assertEquals(0, response.amount().compareTo(new BigDecimal("1000.00")));
        verify(repository).save(any(FinancialTransaction.class));
    }

    @Test
    void persistsValidExpense() {
        when(repository.save(any(FinancialTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CreateExpenseRequest request = new CreateExpenseRequest(
                "Pintura e Reforma",
                "IM-002",
                LocalDate.of(2026, 9, 15),
                new BigDecimal("450.00"));

        FinancialMovementResponse response = service.createExpense(request);

        assertEquals(FinancialTransactionType.EXPENSE, response.type());
        assertEquals("Pintura e Reforma", response.tenantName());
        assertEquals("IM-002", response.propertyRegistration());
        assertEquals(0, response.amount().compareTo(new BigDecimal("450.00")));
        verify(repository).save(any(FinancialTransaction.class));
    }

    @Test
    void deletesTransactionSuccessfully() {
        when(repository.existsById(10L)).thenReturn(true);

        service.deleteTransaction(10L);

        verify(repository).deleteById(10L);
    }

    @Test
    void rejectsDeletionWhenTransactionNotFound() {
        when(repository.existsById(999L)).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> service.deleteTransaction(999L));
    }
}
