package br.org.fundacaomanuelcruz.projeto2.store;

import java.util.Arrays;

import br.org.fundacaomanuelcruz.projeto2.api.NotFoundException;

/** Lista fechada de coleções aceitas; cada uma com teto de tamanho por registro e de quantidade. */
public enum RecordCollection {
    CLIENTS("clients", 50_000, 5_000),
    INVENTORY("inventory", 20_000, 5_000),
    INVENTORY_MOVEMENTS("inventory-movements", 20_000, 50_000),
    ATTENDANCE("attendance", 20_000, 50_000),
    EMPLOYEES("employees", 20_000, 2_000),
    JUSTIFICATIONS("justifications", 20_000, 20_000),
    DOCUMENTS("documents", 50_000, 5_000),
    // Conteúdo dos arquivos (data URL) em partes; lido sob demanda, nunca na listagem inicial.
    DOCUMENT_FILES("document-files", AppRecord.MAX_PAYLOAD_CHARS, 100_000),
    FOLDERS("folders", 5_000, 1_000),
    MP_SUBMISSIONS("mp-submissions", 20_000, 10_000),
    // Texto editável dos modelos de documento (Backlog 3), um registro por modelo.
    TEMPLATE_SETTINGS("template-settings", 30_000, 100);

    private final String slug;
    private final int maxPayloadChars;
    private final int maxRecords;

    RecordCollection(String slug, int maxPayloadChars, int maxRecords) {
        this.slug = slug;
        this.maxPayloadChars = maxPayloadChars;
        this.maxRecords = maxRecords;
    }

    public String slug() {
        return slug;
    }

    public int maxPayloadChars() {
        return maxPayloadChars;
    }

    public int maxRecords() {
        return maxRecords;
    }

    public static RecordCollection fromSlug(String slug) {
        return Arrays.stream(values())
                .filter(collection -> collection.slug.equals(slug))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Coleção desconhecida: " + slug));
    }
}
