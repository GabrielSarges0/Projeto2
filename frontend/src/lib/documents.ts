import { newId, todayIso } from "./format";
import { fileTooLargeMessage, readFileAsDataUrl, storeFileContent } from "./files";
import { applyLocalUpsert, putRecord } from "./records";
import type { DocumentCategory, DocumentItem } from "./schemas";
import { getSession } from "./session";

/** Pastas fixas criadas pela migration V9; outras pastas são criadas pelos usuários. */
export const FOLDER_IDS = {
  ministerioPublico: "fld-mp",
  contratos: "fld-contratos",
  comprovantes: "fld-comprovantes",
  governanca: "fld-governanca",
  funcionarios: "fld-funcionarios",
  estoque: "fld-estoque",
  clientes: "fld-clientes",
} as const;

export function newProtocol(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `FMC-${year}-${random}`;
}

type CreateDocumentInput = {
  name: string;
  folderId: string | null;
  category: DocumentCategory;
  description?: string;
  file?: File;
  template?: string;
  templateData?: Record<string, string>;
  clientId?: string | null;
  movementId?: number | null;
  signed?: boolean;
};

/** Cria o documento (e grava o arquivo em partes, se houver) e atualiza as telas abertas. */
export async function createDocument(input: CreateDocumentInput): Promise<DocumentItem> {
  const id = newId("doc");
  let fileParts = 0;
  let mimeType: string | null = null;
  let sizeBytes = 0;

  if (input.file) {
    const tooLarge = fileTooLargeMessage(input.file);
    if (tooLarge) throw new Error(tooLarge);
    const dataUrl = await readFileAsDataUrl(input.file);
    fileParts = await storeFileContent(id, dataUrl);
    mimeType = input.file.type || null;
    sizeBytes = input.file.size;
  }

  const document: DocumentItem = {
    id,
    name: input.name.trim(),
    folderId: input.folderId,
    category: input.category,
    createdAt: todayIso(),
    sizeBytes,
    mimeType,
    fileParts,
    protocol: newProtocol(),
    signed: input.signed ?? false,
    description: input.description?.trim() ?? "",
    template: input.template ?? null,
    templateData: input.templateData ?? null,
    clientId: input.clientId ?? null,
    movementId: input.movementId ?? null,
    createdBy: getSession()?.user.name ?? "",
  };
  await putRecord("documents", document);
  applyLocalUpsert("documents", document);
  return document;
}

export async function updateDocument(document: DocumentItem): Promise<void> {
  await putRecord("documents", document);
  applyLocalUpsert("documents", document);
}

export function documentHref(id: string): string {
  return `/documentos?doc=${encodeURIComponent(id)}`;
}
