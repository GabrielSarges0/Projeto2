package br.org.fundacaomanuelcruz.projeto2.finance;

import java.math.BigDecimal;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.org.fundacaomanuelcruz.projeto2.api.NotFoundException;
import br.org.fundacaomanuelcruz.projeto2.property.PropertyRepository;

@Service
public class FinancialService {

    /** Saídas administrativas (sem imóvel específico) usam este código. */
    public static final String GENERAL_EXPENSE_CODE = "GERAL";
    static final LocalDate EARLIEST_DATE = LocalDate.of(2000, 1, 1);

    private final FinancialTransactionRepository repository;
    private final BrazilianDocumentValidator documentValidator;
    private final PropertyRepository propertyRepository;

    public FinancialService(
            FinancialTransactionRepository repository,
            BrazilianDocumentValidator documentValidator,
            PropertyRepository propertyRepository) {
        this.repository = repository;
        this.documentValidator = documentValidator;
        this.propertyRepository = propertyRepository;
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

    @Transactional(readOnly = true)
    public List<FinancialMovementResponse> allMovements() {
        return repository.findAllByOrderByTransactionDateDescIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public FinancialMovementResponse createIncome(CreateIncomeRequest request) {
        if (!documentValidator.isValid(request.documentType(), request.documentNumber())) {
            throw new IllegalArgumentException("CPF/CNPJ inválido para o tipo selecionado.");
        }
        requireReasonableDate(request.transactionDate());
        String property = requireExistingProperty(request.propertyRegistration(), false);

        FinancialTransaction transaction = FinancialTransaction.income(
                request.documentType(),
                request.tenantName().trim().replaceAll("\\s+", " "),
                documentValidator.normalize(request.documentNumber()),
                property,
                request.transactionDate(),
                request.grossAmount());

        return toResponse(repository.save(transaction));
    }

    @Transactional
    public FinancialMovementResponse createExpense(CreateExpenseRequest request) {
        requireReasonableDate(request.transactionDate());
        String property = requireExistingProperty(request.propertyRegistration(), true);
        FinancialTransaction transaction = FinancialTransaction.expense(
                request.description().trim(),
                property,
                request.transactionDate(),
                request.grossAmount());

        return toResponse(repository.save(transaction));
    }

    @Transactional
    public void deleteTransaction(Long id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("Transação com ID " + id + " não encontrada.");
        }
        repository.deleteById(id);
    }

    private static void requireReasonableDate(LocalDate date) {
        if (date.isBefore(EARLIEST_DATE)) {
            throw new IllegalArgumentException("A data deve ser a partir de 01/01/2000.");
        }
    }

    private String requireExistingProperty(String registration, boolean allowGeneral) {
        String code = registration.trim().toUpperCase(Locale.ROOT);
        if (allowGeneral && GENERAL_EXPENSE_CODE.equals(code)) {
            return code;
        }
        if (!propertyRepository.existsByRegistrationCodeIgnoreCase(code)) {
            throw new IllegalArgumentException("Imóvel " + code + " não está cadastrado.");
        }
        return code;
    }

    private List<FinancialTransaction> findPeriod(int month, int year) {
        LocalDate start;
        try {
            start = LocalDate.of(year, month, 1);
        } catch (DateTimeException exception) {
            throw new IllegalArgumentException("Mês/ano inválido.");
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
