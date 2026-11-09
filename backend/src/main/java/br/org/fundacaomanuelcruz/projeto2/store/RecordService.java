package br.org.fundacaomanuelcruz.projeto2.store;

import java.util.List;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.org.fundacaomanuelcruz.projeto2.api.NotFoundException;
import br.org.fundacaomanuelcruz.projeto2.auth.CurrentUser;
import br.org.fundacaomanuelcruz.projeto2.user.ForbiddenException;
import br.org.fundacaomanuelcruz.projeto2.user.UserRole;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

@Service
public class RecordService {

    private static final Pattern RECORD_ID = Pattern.compile("^[A-Za-z0-9_-]{1,80}$");

    private final AppRecordRepository repository;
    private final ObjectMapper objectMapper;

    public RecordService(AppRecordRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<RecordResponse> list(String collectionSlug) {
        RecordCollection collection = RecordCollection.fromSlug(collectionSlug);
        return repository.findAllByIdCollectionOrderByCreatedAtAsc(collection.slug()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RecordResponse get(String collectionSlug, String recordId) {
        RecordCollection collection = RecordCollection.fromSlug(collectionSlug);
        return repository.findById(new AppRecordId(collection.slug(), recordId))
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Registro não encontrado: " + recordId));
    }

    @Transactional
    public RecordResponse upsert(String collectionSlug, String recordId, JsonNode body) {
        RecordCollection collection = RecordCollection.fromSlug(collectionSlug);
        if (!RECORD_ID.matcher(recordId).matches()) {
            throw new IllegalArgumentException("Identificador inválido: use letras, números, '-' ou '_' (até 80).");
        }
        if (body == null || !body.isObject()) {
            throw new IllegalArgumentException("O registro deve ser um objeto JSON.");
        }
        ObjectNode data = (ObjectNode) body;
        // O id do caminho é a fonte da verdade: evita registro salvo sob uma chave e lido com outra.
        data.put("id", recordId);
        String payload = objectMapper.writeValueAsString(data);
        if (payload.length() > collection.maxPayloadChars()) {
            throw new IllegalArgumentException("Registro grande demais para " + collection.slug() + ".");
        }

        AppRecordId id = new AppRecordId(collection.slug(), recordId);
        AppRecord record = repository.findById(id).orElse(null);
        if (CurrentUser.role() == UserRole.FUNCIONARIO) {
            checkStaffWrite(collection, record, data);
        }
        if (record == null) {
            if (repository.countByIdCollection(collection.slug()) >= collection.maxRecords()) {
                throw new IllegalArgumentException("Limite de registros atingido para " + collection.slug() + ".");
            }
            record = new AppRecord(id);
        }
        record.update(payload, CurrentUser.displayName());
        return toResponse(repository.save(record));
    }

    @Transactional
    public void delete(String collectionSlug, String recordId) {
        RecordCollection collection = RecordCollection.fromSlug(collectionSlug);
        AppRecordId id = new AppRecordId(collection.slug(), recordId);
        if (!repository.existsById(id)) {
            throw new NotFoundException("Registro não encontrado: " + recordId);
        }
        repository.deleteById(id);
    }

    /**
     * Funcionário grava só o dia a dia: ponto, justificativa nova (pendente), documento novo, retirada/descarte
     * do estoque (baixando a quantidade). Aprovar, editar cadastros e excluir fica com Gerente/Administrador.
     */
    private void checkStaffWrite(RecordCollection collection, AppRecord existing, ObjectNode data) {
        switch (collection) {
            case ATTENDANCE, DOCUMENT_FILES -> {
                return;
            }
            case JUSTIFICATIONS -> {
                boolean pending = "Pendente".equals(data.path("status").asString(""))
                        && data.path("reviewedBy").isNull();
                if (existing == null && pending) return;
                throw new ForbiddenException("Funcionário só envia justificativas novas; a análise é do gestor.");
            }
            case DOCUMENTS -> {
                if (existing == null) return;
                throw new ForbiddenException("Funcionário pode enviar documentos, mas não alterar os existentes.");
            }
            case INVENTORY_MOVEMENTS -> {
                String type = data.path("type").asString("");
                if (existing == null && ("RETIRADA".equals(type) || "DESCARTE".equals(type))) return;
                throw new ForbiddenException("Funcionário só registra retiradas e descartes.");
            }
            case INVENTORY -> {
                if (existing != null && onlyQuantityDecreased(objectMapper.readTree(existing.getPayload()), data)) return;
                throw new ForbiddenException("Funcionário só pode baixar a quantidade de um item.");
            }
            default -> throw new ForbiddenException("Seu perfil não tem permissão para esta ação. Fale com o gerente.");
        }
    }

    private static boolean onlyQuantityDecreased(JsonNode before, ObjectNode after) {
        ObjectNode beforeCopy = ((ObjectNode) before).deepCopy();
        ObjectNode afterCopy = after.deepCopy();
        long oldQty = beforeCopy.path("quantity").asLong(-1);
        long newQty = afterCopy.path("quantity").asLong(-1);
        beforeCopy.remove("quantity");
        afterCopy.remove("quantity");
        return beforeCopy.equals(afterCopy) && newQty >= 0 && newQty <= oldQty;
    }

    private RecordResponse toResponse(AppRecord record) {
        return new RecordResponse(
                record.getId().recordId(),
                objectMapper.readTree(record.getPayload()),
                record.getUpdatedAt(),
                record.getUpdatedBy());
    }
}
