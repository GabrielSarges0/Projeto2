package br.org.fundacaomanuelcruz.projeto2.staff;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Aberto a qualquer conta logada (SecurityConfig): é o que o funcionário usa no lugar das coleções de pessoal. */
@RestController
@RequestMapping("/api/v1/staff")
public class StaffController {

    private final StaffService service;

    public StaffController(StaffService service) {
        this.service = service;
    }

    @GetMapping("/directory")
    public List<StaffMember> directory() {
        return service.directory();
    }

    // POST para o CPF ir no corpo, e não na URL (que acaba em logs).
    @PostMapping("/{employeeId}/self")
    public StaffSelfServiceResponse self(@PathVariable String employeeId, @Valid @RequestBody SelfServiceRequest request) {
        return service.selfService(employeeId, request.cpf());
    }

    public record SelfServiceRequest(
            @NotBlank(message = "Informe o CPF.")
            @Size(max = 20, message = "CPF inválido.")
            String cpf) {
    }
}
