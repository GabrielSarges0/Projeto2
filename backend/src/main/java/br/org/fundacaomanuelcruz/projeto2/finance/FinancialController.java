package br.org.fundacaomanuelcruz.projeto2.finance;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api/v1/financial")
@Validated
public class FinancialController {

    private final FinancialService service;

    public FinancialController(FinancialService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    public FinancialSummaryResponse summary(
            @RequestParam @Min(1) @Max(12) int month,
            @RequestParam @Min(2000) @Max(2100) int year) {
        return service.summary(month, year);
    }

    @GetMapping("/movements")
    public List<FinancialMovementResponse> movements(
            @RequestParam @Min(1) @Max(12) int month,
            @RequestParam @Min(2000) @Max(2100) int year) {
        return service.movements(month, year);
    }

    @GetMapping("/all")
    public List<FinancialMovementResponse> allMovements() {
        return service.allMovements();
    }

    @PostMapping("/incomes")
    public ResponseEntity<FinancialMovementResponse> createIncome(
            @Valid @RequestBody CreateIncomeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createIncome(request));
    }

    @PostMapping("/expenses")
    public ResponseEntity<FinancialMovementResponse> createExpense(
            @Valid @RequestBody CreateExpenseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createExpense(request));
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        service.deleteTransaction(id);
        return ResponseEntity.noContent().build();
    }
}
