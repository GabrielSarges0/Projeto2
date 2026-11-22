package br.org.fundacaomanuelcruz.projeto2.store;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Documentos com dados pessoais (inquilinos, contratos, recibos, atestados) ficam fora do alcance do Funcionário.
 * A regra olha categoria, pasta (com subpastas) e vínculo com cliente, porque um documento pessoal pode ser enviado
 * para qualquer pasta e uma subpasta pode ter o nome de uma pessoa.
 */
@Component
class DocumentVisibility {

    static final Set<String> PERSONAL_CATEGORIES = Set.of("Documento Pessoal", "Contrato", "Recibo", "Justificativa");
    // Pastas fixas da migration V9 (FOLDER_IDS em frontend/src/lib/documents.ts).
    static final Set<String> PERSONAL_FOLDERS = Set.of("fld-clientes", "fld-contratos", "fld-funcionarios");

    private final AppRecordRepository repository;
    private final ObjectMapper objectMapper;

    DocumentVisibility(AppRecordRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    /** Pastas restritas e todas as subpastas delas, a partir da árvore atual. */
    Set<String> restrictedFolders() {
        Map<String, String> parentOf = new HashMap<>();
        for (AppRecord folder : repository.findAllByIdCollectionOrderByCreatedAtAsc(RecordCollection.FOLDERS.slug())) {
            parentOf.put(folder.getId().recordId(), text(objectMapper.readTree(folder.getPayload()), "parentId"));
        }
        Set<String> restricted = new HashSet<>(PERSONAL_FOLDERS);
        for (String folderId : parentOf.keySet()) {
            if (isUnderPersonalFolder(folderId, parentOf)) restricted.add(folderId);
        }
        return restricted;
    }

    boolean isPersonal(JsonNode document, Set<String> restrictedFolders) {
        return PERSONAL_CATEGORIES.contains(text(document, "category"))
                || restrictedFolders.contains(text(document, "folderId"))
                || !text(document, "clientId").isBlank();
    }

    private static boolean isUnderPersonalFolder(String folderId, Map<String, String> parentOf) {
        Set<String> visited = new HashSet<>();
        String current = folderId;
        // "visited" evita laço infinito se a árvore tiver ciclo (pasta movida para dentro de si mesma).
        while (!current.isEmpty() && visited.add(current)) {
            if (PERSONAL_FOLDERS.contains(current)) return true;
            current = parentOf.getOrDefault(current, "");
        }
        return false;
    }

    static String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isString() ? value.asString() : "";
    }
}
