package br.org.fundacaomanuelcruz.projeto2.property;

import java.util.Locale;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.org.fundacaomanuelcruz.projeto2.api.NotFoundException;
import br.org.fundacaomanuelcruz.projeto2.auth.CurrentUser;
import br.org.fundacaomanuelcruz.projeto2.property.Property.PropertyDetails;

@Service
public class PropertyService {

    private static final int EXPIRING_WINDOW_DAYS = 30;

    private final PropertyRepository propertyRepository;
    private final LeaseContractRepository contractRepository;

    public PropertyService(PropertyRepository propertyRepository, LeaseContractRepository contractRepository) {
        this.propertyRepository = propertyRepository;
        this.contractRepository = contractRepository;
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> listAll() {
        return propertyRepository.findAllByOrderByRegistrationCodeAsc().stream()
                .map(this::toPropertyResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PropertyMetricsResponse getMetrics() {
        return new PropertyMetricsResponse(
                propertyRepository.count(),
                propertyRepository.countByStatus(PropertyStatus.OCUPADO),
                propertyRepository.countByStatus(PropertyStatus.DISPONIVEL),
                propertyRepository.countByStatus(PropertyStatus.MANUTENCAO));
    }

    @Transactional
    public PropertyResponse create(PropertyRequest request) {
        if (request.registrationCode() == null || request.registrationCode().isBlank()) {
            throw new IllegalArgumentException("Informe o código do imóvel (ex.: IM-006).");
        }
        String code = request.registrationCode().trim().toUpperCase(Locale.ROOT);
        if (propertyRepository.existsByRegistrationCodeIgnoreCase(code)) {
            throw new IllegalArgumentException("Já existe um imóvel com o código " + code + ".");
        }
        return toPropertyResponse(propertyRepository.save(new Property(code, details(request), CurrentUser.displayName())));
    }

    @Transactional
    public PropertyResponse update(Long id, PropertyRequest request) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Imóvel não encontrado: " + id));
        property.apply(details(request), CurrentUser.displayName());
        return toPropertyResponse(propertyRepository.save(property));
    }

    private static PropertyDetails details(PropertyRequest request) {
        String tenant = request.currentTenant() == null || request.currentTenant().isBlank()
                ? null
                : request.currentTenant().trim();
        if (request.status() == PropertyStatus.OCUPADO && tenant == null) {
            throw new IllegalArgumentException("Imóvel ocupado precisa do nome do inquilino.");
        }
        if (request.status() != PropertyStatus.OCUPADO) {
            tenant = null;
        }
        String notes = request.notes() == null || request.notes().isBlank() ? null : request.notes().trim();
        return new PropertyDetails(request.address().trim(), tenant, request.monthlyRent(), request.status(), notes);
    }

    @Transactional(readOnly = true)
    public List<LeaseContractResponse> listExpiringContracts() {
        // Somente contratos que vencem nos próximos 30 dias (mesma regra exibida no Painel)
        LocalDate today = LocalDate.now();
        return contractRepository.findTop5ByEndDateBetweenOrderByEndDateAsc(today, today.plusDays(EXPIRING_WINDOW_DAYS)).stream()
                .map(this::toContractResponse)
                .toList();
    }

    private PropertyResponse toPropertyResponse(Property p) {
        return new PropertyResponse(
                p.getId(),
                p.getRegistrationCode(),
                p.getAddress(),
                p.getCurrentTenant(),
                p.getMonthlyRent(),
                p.getStatus(),
                p.getNotes(),
                p.getUpdatedAt(),
                p.getUpdatedBy()
        );
    }

    private LeaseContractResponse toContractResponse(LeaseContract c) {
        return new LeaseContractResponse(
                c.getId(),
                c.getPropertyRegistration(),
                c.getTenantName(),
                c.getStartDate(),
                c.getEndDate(),
                c.getMonthlyAmount(),
                c.getStatus()
        );
    }
}

