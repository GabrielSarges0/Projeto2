import { deleteRecord, fetchRecord, putRecord } from "./records";
import { documentFilePartSchema } from "./schemas";

// Cada parte cabe no limite de 1 milhão de caracteres por registro do backend.
const PART_SIZE = 900_000;
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = "application/pdf,image/png,image/jpeg,image/webp,.doc,.docx,.xls,.xlsx,.txt";

export function fileTooLargeMessage(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) return `O arquivo "${file.name}" passa de 8 MB. Reduza o tamanho e tente de novo.`;
  if (file.size === 0) return `O arquivo "${file.name}" está vazio.`;
  return null;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Leitura falhou")));
    reader.onerror = () => reject(reader.error ?? new Error("Leitura falhou"));
    reader.readAsDataURL(file);
  });
}

export async function storeFileContent(docId: string, dataUrl: string): Promise<number> {
  const parts = Math.max(1, Math.ceil(dataUrl.length / PART_SIZE));
  for (let index = 0; index < parts; index += 1) {
    await putRecord("document-files", {
      id: `${docId}-p${index}`,
      docId,
      index,
      content: dataUrl.slice(index * PART_SIZE, (index + 1) * PART_SIZE),
    });
  }
  return parts;
}

export async function loadFileContent(docId: string, parts: number): Promise<string> {
  const chunks: string[] = [];
  for (let index = 0; index < parts; index += 1) {
    const part = await fetchRecord("document-files", `${docId}-p${index}`, documentFilePartSchema);
    chunks.push(part.content);
  }
  return chunks.join("");
}

export async function deleteFileContent(docId: string, parts: number): Promise<void> {
  for (let index = 0; index < parts; index += 1) {
    try {
      await deleteRecord("document-files", `${docId}-p${index}`);
    } catch {
      // Parte já removida: segue com as demais.
    }
  }
}

export function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function downloadText(content: string, fileName: string, mimeType = "text/html;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  downloadDataUrl(url, fileName);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
