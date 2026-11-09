"use client";

import { useEffect, useState } from "react";
import { Download, Link2, Paperclip, Printer, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { updateDocument } from "@/lib/documents";
import { ACCEPTED_FILE_TYPES, downloadDataUrl, downloadText, fileTooLargeMessage, loadFileContent, readFileAsDataUrl, storeFileContent } from "@/lib/files";
import { errorMessage } from "@/lib/financial-api";
import { formatDate, formatFileSize } from "@/lib/format";
import type { DocumentItem, Folder } from "@/lib/schemas";
import { findTemplate, renderTemplateHtml } from "@/lib/templates";

type Props = {
  document: DocumentItem;
  folderPath: string;
  onClose: () => void;
  onDelete?: () => void;
  canAttach: boolean;
  notify: (message: string, tone?: "success" | "error") => void;
};

export function folderPathOf(folderId: string | null, folders: Folder[]): string {
  const names: string[] = [];
  let current = folders.find((folder) => folder.id === folderId);
  let guard = 0;
  while (current && guard < 20) {
    names.unshift(current.name);
    current = folders.find((folder) => folder.id === current?.parentId);
    guard += 1;
  }
  return names.length ? names.join(" › ") : "Sem pasta";
}

export function DocumentViewer({ document, folderPath, onClose, onDelete, canAttach, notify }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(document.fileParts > 0);
  const [loadError, setLoadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const template = findTemplate(document.template);

  useEffect(() => {
    if (document.fileParts === 0) return;
    let active = true;
    loadFileContent(document.id, document.fileParts)
      .then((value) => active && setContent(value))
      .catch((error: unknown) => active && setLoadError(errorMessage(error, "Não foi possível abrir o arquivo.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [document.id, document.fileParts]);

  function download() {
    if (content) {
      downloadDataUrl(content, document.name);
    } else if (template && document.templateData) {
      downloadText(renderTemplateHtml(template, document.templateData, document.protocol), document.name.replace(/\.pdf$/i, ".html"));
    }
  }

  function print() {
    if (!template || !document.templateData) return;
    const win = window.open("", "_blank");
    if (!win) {
      notify("O navegador bloqueou a janela de impressão. Permita pop-ups para este site.", "error");
      return;
    }
    win.document.write(renderTemplateHtml(template, document.templateData, document.protocol));
    win.document.close();
    win.focus();
    win.print();
  }

  async function copyLink() {
    const url = `${window.location.origin}/documentos?doc=${encodeURIComponent(document.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      notify("Link do documento copiado.");
    } catch {
      notify(`Copie o link: ${url}`);
    }
  }

  async function attachFile(file: File | undefined) {
    if (!file) return;
    const tooLarge = fileTooLargeMessage(file);
    if (tooLarge) {
      notify(tooLarge, "error");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const parts = await storeFileContent(document.id, dataUrl);
      await updateDocument({ ...document, fileParts: parts, mimeType: file.type || null, sizeBytes: file.size });
      setContent(dataUrl);
      notify("Arquivo anexado ao documento.");
    } catch (error) {
      notify(errorMessage(error, "Não foi possível anexar o arquivo."), "error");
    } finally {
      setUploading(false);
    }
  }

  const canDownload = Boolean(content) || Boolean(template && document.templateData);
  const rendered = template && document.templateData ? template.render(document.templateData) : null;

  return (
    <Modal
      title={document.name}
      wide
      onClose={onClose}
      busy={uploading}
      footer={
        <>
          {onDelete ? (
            <button type="button" className="ui-btn ui-btn-secondary" onClick={onDelete} style={{ color: "var(--ui-danger)" }}>
              <Trash2 size={16} aria-hidden="true" /> Excluir
            </button>
          ) : null}
          <button type="button" className="ui-btn ui-btn-secondary" onClick={() => void copyLink()}>
            <Link2 size={16} aria-hidden="true" /> Copiar link
          </button>
          {rendered ? (
            <button type="button" className="ui-btn ui-btn-secondary" onClick={print}>
              <Printer size={16} aria-hidden="true" /> Imprimir / PDF
            </button>
          ) : null}
          <button type="button" className="ui-btn ui-btn-primary" onClick={download} disabled={!canDownload}>
            <Download size={16} aria-hidden="true" /> Baixar
          </button>
        </>
      }
    >
      <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, margin: 0 }}>
        {[
          ["Pasta", folderPath],
          ["Categoria", document.category],
          ["Protocolo", document.protocol],
          ["Criado em", formatDate(document.createdAt)],
          ["Tamanho", document.sizeBytes ? formatFileSize(document.sizeBytes) : "—"],
          ["Autor", document.createdBy || "—"],
        ].map(([label, value]) => (
          <div key={label} style={{ background: "var(--ui-surface-muted)", padding: "6px 10px", borderRadius: 8 }}>
            <dt style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>{label}</dt>
            <dd style={{ margin: 0, fontSize: 13.5, fontWeight: 600, wordBreak: "break-word" }}>{value}</dd>
          </div>
        ))}
      </dl>
      {document.description ? <p style={{ margin: 0, fontSize: 14 }}>{document.description}</p> : null}

      <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, minHeight: 200, background: "#fff" }}>
        {loading ? (
          <div className="ui-skeleton" style={{ height: 180 }} aria-busy="true" />
        ) : loadError ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {loadError}
          </p>
        ) : content?.startsWith("data:image/") ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL local, sem otimização do next/image
          <img src={content} alt={`Pré-visualização de ${document.name}`} style={{ maxWidth: "100%", maxHeight: 520, display: "block", margin: "0 auto" }} />
        ) : content?.startsWith("data:application/pdf") ? (
          <iframe src={content} title={`PDF ${document.name}`} style={{ width: "100%", height: 520, border: 0 }} />
        ) : content ? (
          <p style={{ margin: 0, fontSize: 14 }}>Pré-visualização indisponível para este tipo de arquivo. Use “Baixar”.</p>
        ) : rendered ? (
          <article style={{ fontFamily: "Georgia, serif", lineHeight: 1.6, maxWidth: 640, margin: "0 auto" }}>
            <p style={{ textAlign: "center", fontWeight: 700, margin: 0, fontSize: 13 }}>FUNDAÇÃO MANUEL CRUZ</p>
            <h3 style={{ textAlign: "center", color: "var(--ui-primary)", fontSize: 16 }}>{rendered.title}</h3>
            {rendered.paragraphs.map((paragraph) => (
              <p key={paragraph} style={{ textAlign: "justify", fontSize: 14 }}>
                {paragraph}
              </p>
            ))}
          </article>
        ) : (
          <div className="ui-empty" style={{ display: "grid", gap: 12, justifyItems: "center" }}>
            <p style={{ margin: 0 }}>Este registro ainda não tem arquivo digitalizado.</p>
            {canAttach ? (
            <label className="ui-btn ui-btn-primary" style={{ cursor: "pointer" }}>
              <Paperclip size={16} aria-hidden="true" /> {uploading ? "Enviando..." : "Anexar arquivo"}
              <input
                type="file"
                className="sr-only"
                accept={ACCEPTED_FILE_TYPES}
                disabled={uploading}
                onChange={(e) => void attachFile(e.target.files?.[0])}
              />
            </label>
            ) : (
              <p className="ui-field-hint" style={{ margin: 0 }}>Peça a um Administrador para anexar o arquivo.</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
