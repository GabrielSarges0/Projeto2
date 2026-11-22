package br.org.fundacaomanuelcruz.projeto2.store;

import java.util.List;
import java.util.Set;
import java.util.function.Predicate;
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
    static final String RESTRICTED_DOCUMENT = "Documento restrito ao Gerente e ao Administrador.";

    private final AppRecordRepository repository;
    private final ObjectMapper objectMapper;
    private final DocumentVisibility documentVisibility;

    public RecordService(AppRecordRepository repository, ObjectMapper objectMapper, DocumentVisibility documentVisibility) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.documentVisibility = documentVisibility;
    }

    @Transactional(readOnly = true)
    public List<RecordResponse> list(String collectionSlug) {
        RecordCollection collection = RecordCollection.fromSlug(collectionSlug);
        boolean staff = CurrentUser.role() == UserRole.FUNCIONARIO;
        // Partes de arquivo são lidas uma a uma, pelo documento; a listagem inteira entregaria todos os arquivos.
        if (staff && collection == RecordCollection.DOCUMENT_FILES) {
            throw new ForbiddenException(RESTRICTED_DOCUMENT);
        }
        Predicate<RecordResponse> visible = staff ? staffCanRead(collection) : record -> true;
        return repository.findAllByIdCollectionOrderByCreatedAtAsc(collection.slug()).stream()
                .map(this::toResponse)
                .filter(visible)
                .toList();
    }

    @Transactional(readOnly = true)
    public RecordResponse get(String collectionSlug, String recordId) {
        RecordCollection collection = RecordCollection.fromSlug(collectionSlug);
        RecordResponse record = repository.findById(new AppRecordId(collection.slug(), recordId))
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Registro não encontrado: " + recordId));
        if (CurrentUser.role() == UserRole.FUNCIONARIO && !staffCanRead(collection).test(record)) {
            throw new ForbiddenException(RESTRICTED_DOCUMENT);
        }
        return record;
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
        AppRecordId id = new AppRecordId(collection.slug(), recordId);
        AppRecord record = repository.findById(id).orElse(null);
        if (CurrentUser.role() == UserRole.FUNCIONARIO) {
            checkStaffWrite(collection, record, data);
        }
        return persist(collection, id, record, data);
    }

    /**
     * Gravação que o próprio servidor já validou (ex.: ponto em StaffService, com CPF conferido): não passa pelas
     * regras por papel do upsert, mas respeita os limites de tamanho e de quantidade da coleção.
     */
    @Transactional
    public RecordResponse saveValidated(RecordCollection collection, String recordId, ObjectNode data) {
        data.put("id", recordId);
        AppRecordId id = new AppRecordId(collection.slug(), recordId);
        return persist(collection, id, repository.findById(id).orElse(null), data);
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

    private RecordResponse persist(RecordCollection collection, AppRecordId id, AppRecord existing, ObjectNode data) {
        String payload = objectMapper.writeValueAsString(data);
        if (payload.length() > collection.maxPayloadChars()) {
            throw new IllegalArgumentException("Registro grande demais para " + collection.slug() + ".");
        }
        AppRecord record = existing;
        if (record == null) {
            if (repository.countByIdCollection(collection.slug()) >= collection.maxRecords()) {
                throw new IllegalArgumentException("Limite de registros atingido para " + collection.slug() + ".");
            }
            record = new AppRecord(id);
        }
        record.update(payload, CurrentUser.displayName());
        return toResponse(repository.save(record));
    }

    /**
     * O que o Funcionário lê de cada coleção. As coleções de pessoal (clientes, funcionários, ponto, justificativas)
     * já são barradas no SecurityConfig; aqui ficam as regras que dependem do conteúdo do registro.
     */
    private Predicate<RecordResponse> staffCanRead(RecordCollection collection) {
        return switch (collection) {
            case DOCUMENTS -> {
                Set<String> restricted = documentVisibility.restrictedFolders();
                yield record -> !documentVisibility.isPersonal(record.data(), restricted);
            }
            case FOLDERS -> {
                Set<String> restricted = documentVisibility.restrictedFolders();
                yield record -> !restricted.contains(record.id());
            }
            case DOCUMENT_FILES -> {
                Set<String> restricted = documentVisibility.restrictedFolders();
                // Arquivo sem documento (órfão) também fica fechado: não há como saber se era pessoal.
                yield part -> repository.findById(new AppRecordId(
                                RecordCollection.DOCUMENTS.slug(), DocumentVisibility.text(part.data(), "docId")))
                        .map(document -> !documentVisibility.isPersonal(objectMapper.readTree(document.getPayload()), restricted))
                        .orElse(false);
            }
            default -> record -> true;
        };
    }

    /**
     * Funcionário grava só o dia a dia: justificativa nova (pendente), documento novo (com seu arquivo),
     * retirada/descarte do estoque (baixando a quantidade). O ponto vai por /api/v1/staff/{id}/punch, com o CPF
     * conferido no servidor. Aprovar, editar cadastros e excluir fica com Gerente/Administrador.
     */
    private void checkStaffWrite(RecordCollection collection, AppRecord existing, ObjectNode data) {
        switch (collection) {
            case DOCUMENT_FILES -> {
                if (existing == null && isPartOfNewDocument(data)) return;
                throw new ForbiddenException("Funcionário só envia arquivos de documentos novos.");
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

    /**
     * O envio grava as partes ("{docId}-p{n}") antes do documento. Exigir o id nesse formato e o documento ainda
     * inexistente impede o Funcionário de trocar o arquivo de um documento que já existe.
     */
    private boolean isPartOfNewDocument(ObjectNode part) {
        String docId = DocumentVisibility.text(part, "docId");
        JsonNode index = part.path("index");
        return !docId.isEmpty()
                && index.isIntegralNumber()
                && DocumentVisibility.text(part, "id").equals(docId + "-p" + index.asLong())
                && !repository.existsById(new AppRecordId(RecordCollection.DOCUMENTS.slug(), docId));
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
