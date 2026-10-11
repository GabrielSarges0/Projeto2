package br.org.fundacaomanuelcruz.projeto2.property;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/properties")
public class PropertyController {

    private final PropertyService service;

    public PropertyController(PropertyService service) {
        this.service = service;
    }

    @GetMapping
    public List<PropertyResponse> listAll() {
        return service.listAll();
    }

    @GetMapping("/metrics")
    public PropertyMetricsResponse getMetrics() {
        return service.getMetrics();
    }

    @GetMapping("/contracts/expiring")
    public List<LeaseContractResponse> listExpiringContracts() {
        return service.listExpiringContracts();
    }
}

