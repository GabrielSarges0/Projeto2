package br.org.fundacaomanuelcruz.projeto2.finance;

import java.math.BigDecimal;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialService {

    private final FinancialTransactionRepository repository;
    private final BrazilianDocumentValidator documentValidator;

    public FinancialService(
            FinancialTransactionRepository repository,
            BrazilianDocumentValidator documentValidator) {
        this.repository = repository;
        this.documentValidator = documentValidator;
    }

    @Transactional(readOnly = true)
    public FinancialSummaryResponse summary(int month, int year) {
        List<FinancialTransaction> transactions = findPeriod(month, year);

        BigDecimal income = sum(transactions, FinancialTransactionType.INCOME);
        BigDecimal expense = sum(transactions, FinancialTransactionType.EXPENSE);
        return new FinancialSummaryResponse(income, expense, income.subtract(expense));
    }

    @Transactional(readOnly = true)
    public List<FinancialMovementResponse> movements(int month, int year) {
        return findPeriod(month, year).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public FinancialMovementResponse createIncome(CreateIncomeRequest request) {
        if (!documentValidator.isValid(request.documentType(), request.documentNumber())) {
            throw new IllegalArgumentException("CPF/CNPJ invalido para o tipo selecionado.");
        }

        FinancialTransaction transaction = FinancialTransaction.income(
                request.documentType(),
                request.tenantName().trim(),
                documentValidator.normalize(request.documentNumber()),
                request.propertyRegistration().trim(),
                request.transactionDate(),
                request.grossAmount());

        return toResponse(repository.save(transaction));
    }

    @Transactional
    public FinancialMovementResponse createExpense(CreateExpenseRequest request) {
        FinancialTransaction transaction = FinancialTransaction.expense(
                request.description().trim(),
                request.propertyRegistration().trim(),
                request.transactionDate(),
                request.grossAmount());

        return toResponse(repository.save(transaction));
    }

    @Transactional
    public void deleteTransaction(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Transação com ID " + id + " não encontrada.");
        }
        repository.deleteById(id);
    }

    private List<FinancialTransaction> findPeriod(int month, int year) {
        LocalDate start;
        try {
            start = LocalDate.of(year, month, 1);
        } catch (DateTimeException exception) {
            throw new IllegalArgumentException("Mes/ano invalido.");
        }
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        return repository.findByTransactionDateBetweenOrderByTransactionDateDescIdDesc(start, end);
    }

    private BigDecimal sum(
            List<FinancialTransaction> transactions,
            FinancialTransactionType type) {
        return transactions.stream()
                .filter(transaction -> transaction.getType() == type)
                .map(FinancialTransaction::getGrossAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private FinancialMovementResponse toResponse(FinancialTransaction transaction) {
        return new FinancialMovementResponse(
                transaction.getId(),
                transaction.getTransactionDate(),
                transaction.getTenantName(),
                transaction.getPropertyRegistration(),
                transaction.getGrossAmount(),
                transaction.getType());
    }
}
