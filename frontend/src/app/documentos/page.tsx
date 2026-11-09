"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ChevronRight, Download, Eye, FileText, Folder as FolderIcon, FolderPlus, MoreVertical, Pencil, Plus, ScanLine, Search, Trash2, Upload } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DocumentViewer, folderPathOf } from "@/components/documents/DocumentViewer";
import { NewDocumentModal } from "@/components/documents/NewDocumentModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { FOLDER_IDS, createDocument } from "@/lib/documents";
import { deleteFileContent, downloadDataUrl, downloadText, loadFileContent } from "@/lib/files";
import { errorMessage } from "@/lib/financial-api";
import { formatDate, newId, normalizeText, todayIso } from "@/lib/format";
import { useCan } from "@/lib/permissions";
import { useRecords } from "@/lib/records";
import { DOCUMENT_CATEGORIES, clientSchema, documentSchema, folderSchema, type DocumentCategory, type DocumentItem, type Folder } from "@/lib/schemas";
import { findTemplate, renderTemplateHtml } from "@/lib/templates";

// Pastas usadas por outras telas (anexos, MP, clientes): podem receber arquivos, mas não ser renomeadas/excluídas.
const PROTECTED_FOLDERS = new Set<string>([...Object.values(FOLDER_IDS), "fld-mp-anos", "fld-mp-2026", "fld-mp-2026-atas", "fld-mp-2026-relatorios"]);

type NewDocState = { templateId: string | null; prefill?: Record<string, string>; clientId?: string | null } | null;

export default function DocumentosPage() {
  const docsStore = useRecords("documents", documentSchema);
  const foldersStore = useRecords("folders", folderSchema);
  const clientsStore = useRecords("clients", clientSchema);
  const documents = docsStore.items;
  const folders = foldersStore.items;
  const { show, node: toast } = useToast();
  const canEdit = useCan("edit");
  const canDelete = useCan("delete");

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<DocumentCategory | "ALL">("ALL");
  const [viewing, setViewing] = useState<DocumentItem | null>(null);
  const [newDoc, setNewDoc] = useState<NewDocState>(null);
  const [folderForm, setFolderForm] = useState<Folder | "new" | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<DocumentItem | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const pendingDocId = useRef<string | null>(null);

  // Links vindos de outras telas: ?doc=<id>, ?pasta=<id>, ?novo=<modelo>&cliente=<id>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get("doc");
    const folderId = params.get("pasta");
    const novo = params.get("novo");
    const clienteId = params.get("cliente");
    if (docId) pendingDocId.current = docId;
    // Parâmetros da URL só existem no navegador (a página é pré-renderizada sem eles).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (folderId) setCurrentFolderId(folderId);
    if (novo !== null) {
      setNewDoc({ templateId: novo && novo !== "1" ? novo : null, clientId: clienteId });
    }
  }, []);

  // Abre o documento do link quando a lista chega do servidor.
  useEffect(() => {
    const id = pendingDocId.current;
    if (!id || docsStore.loading) return;
    pendingDocId.current = null;
    const found = documents.find((doc) => doc.id === id);
    if (found) {
      setCurrentFolderId(found.folderId);
      setViewing(found);
    } else {
      show("Documento não encontrado. Ele pode ter sido excluído ou movido.", "error");
    }
    window.history.replaceState(null, "", "/documentos");
  }, [docsStore.loading, documents, show]);

  // Pré-preenche o formulário a partir do cliente (botão "Emitir recibo / termo" em Clientes).
  useEffect(() => {
    if (!newDoc?.clientId || newDoc.prefill || clientsStore.loading) return;
    const client = clientsStore.items.find((item) => item.id === newDoc.clientId);
    if (!client) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dados do cliente chegam depois da abertura
    setNewDoc({
      ...newDoc,
      prefill: {
        imovel: `${client.propertyCode} - ${client.propertyAddress}`,
        inquilino: client.name,
        cpfCnpj: client.cpf,
        fiador: client.guarantorName,
        valor: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.monthlyRent),
      },
    });
  }, [newDoc, clientsStore.loading, clientsStore.items]);

  const currentFolder = folders.find((folder) => folder.id === currentFolderId) ?? null;
  const breadcrumb = useMemo(() => {
    const chain: Folder[] = [];
    let cursor = currentFolder;
    let guard = 0;
    while (cursor && guard < 20) {
      chain.unshift(cursor);
      cursor = folders.find((folder) => folder.id === cursor?.parentId) ?? null;
      guard += 1;
    }
    return chain;
  }, [currentFolder, folders]);

  const term = normalizeText(search);
  const searching = term.length > 0 || category !== "ALL";
  const visibleFolders = searching
    ? []
    : folders.filter((folder) => folder.parentId === currentFolderId).sort((a, b) => a.name.localeCompare(b.name));
  const visibleDocs = documents
    .filter((doc) => {
      if (category !== "ALL" && doc.category !== category) return false;
      if (term) return normalizeText(`${doc.name} ${doc.protocol} ${doc.description}`).includes(term);
      return doc.folderId === currentFolderId;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name));

  function countInside(folderId: string) {
    return {
      docs: documents.filter((doc) => doc.folderId === folderId).length,
      folders: folders.filter((folder) => folder.parentId === folderId).length,
    };
  }

  async function download(doc: DocumentItem) {
    try {
      if (doc.fileParts > 0) {
        downloadDataUrl(await loadFileContent(doc.id, doc.fileParts), doc.name);
        return;
      }
      const template = findTemplate(doc.template);
      if (template && doc.templateData) {
        downloadText(renderTemplateHtml(template, doc.templateData, doc.protocol), doc.name.replace(/\.pdf$/i, ".html"));
        return;
      }
      show("Este documento ainda não tem arquivo. Abra-o e use “Anexar arquivo”.", "error");
    } catch (error) {
      show(errorMessage(error, "Não foi possível baixar."), "error");
    }
  }

  async function confirmDeleteDoc() {
    if (!deletingDoc) return;
    await docsStore.remove(deletingDoc.id);
    void deleteFileContent(deletingDoc.id, deletingDoc.fileParts);
    if (viewing?.id === deletingDoc.id) setViewing(null);
    show(`Documento "${deletingDoc.name}" excluído.`);
    setDeletingDoc(null);
  }

  async function confirmDeleteFolder() {
    if (!deletingFolder) return;
    const parent = deletingFolder.parentId;
    // Conteúdo sobe um nível: nada é apagado junto com a pasta.
    for (const doc of documents.filter((item) => item.folderId === deletingFolder.id)) await docsStore.save({ ...doc, folderId: parent });
    for (const folder of folders.filter((item) => item.parentId === deletingFolder.id)) await foldersStore.save({ ...folder, parentId: parent });
    await foldersStore.remove(deletingFolder.id);
    show(`Pasta "${deletingFolder.name}" excluída.`);
    setDeletingFolder(null);
  }

  const loading = docsStore.loading || foldersStore.loading;
  const loadError = docsStore.error || foldersStore.error;

  return (
    <AppShell>
      <section className="ui-page" aria-labelledby="docs-title">
        <div className="ui-page-header">
          <div>
            <h1 id="docs-title">Documentos</h1>
            <p>Contratos, recibos, prestações de contas e demais arquivos da Fundação.</p>
          </div>
          <div className="ui-row-actions">
            <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setScanOpen(true)}>
              <ScanLine size={18} aria-hidden="true" /> Digitalizar
            </button>
            {canEdit ? (
              <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setFolderForm("new")}>
                <FolderPlus size={18} aria-hidden="true" /> Nova pasta
              </button>
            ) : null}
            <button type="button" className="ui-btn ui-btn-primary" onClick={() => setNewDoc({ templateId: null })}>
              <Plus size={18} aria-hidden="true" /> Novo documento
            </button>
          </div>
        </div>

        <div className="ui-toolbar">
          <div className="ui-field" style={{ flex: "3 1 260px" }}>
            <label htmlFor="doc-busca">Buscar documentos</label>
            <div style={{ position: "relative" }}>
              <Search size={16} aria-hidden="true" style={{ position: "absolute", left: 10, top: 12, color: "var(--ui-text-muted)" }} />
              <input
                id="doc-busca"
                className="ui-input"
                style={{ paddingLeft: 32 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, protocolo ou descrição (busca em todas as pastas)"
              />
            </div>
          </div>
          <div className="ui-field">
            <label htmlFor="doc-categoria">Categoria</label>
            <select id="doc-categoria" className="ui-input" value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory | "ALL")}>
              <option value="ALL">Todas</option>
              {DOCUMENT_CATEGORIES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>

        <nav aria-label="Caminho da pasta" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, fontSize: 14 }}>
          <button type="button" className="ui-link" onClick={() => setCurrentFolderId(null)} aria-current={currentFolderId === null ? "page" : undefined}>
            Documentos
          </button>
          {breadcrumb.map((folder) => (
            <span key={folder.id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ChevronRight size={14} aria-hidden="true" />
              <button type="button" className="ui-link" onClick={() => setCurrentFolderId(folder.id)} aria-current={folder.id === currentFolderId ? "page" : undefined}>
                {folder.name}
              </button>
            </span>
          ))}
          {searching ? <span className="ui-field-hint" style={{ marginLeft: 8 }}>· mostrando resultados de todas as pastas</span> : null}
        </nav>

        {loadError ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {loadError}{" "}
            <button type="button" className="ui-link" onClick={() => { void docsStore.reload(); void foldersStore.reload(); }}>
              Tentar de novo
            </button>
          </p>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: searching ? "1fr" : "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 16, alignItems: "start" }}>
          {!searching ? (
            <section className="ui-card" aria-labelledby="pastas-title">
              <h2 id="pastas-title" style={{ margin: "0 0 10px", fontSize: 17, color: "var(--ui-primary)" }}>
                Pastas
              </h2>
              {loading ? (
                <div className="ui-skeleton" style={{ height: 120 }} />
              ) : visibleFolders.length === 0 ? (
                <p className="ui-empty">Nenhuma subpasta aqui.</p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
                  {visibleFolders.map((folder) => {
                    const count = countInside(folder.id);
                    const locked = PROTECTED_FOLDERS.has(folder.id) || !canEdit;
                    return (
                      <li key={folder.id} style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f1f5f9", padding: "6px 0" }}>
                        <button
                          type="button"
                          onClick={() => setCurrentFolderId(folder.id)}
                          style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "none", border: 0, cursor: "pointer", textAlign: "left", minHeight: 40, font: "inherit", color: "var(--ui-text)" }}
                        >
                          <FolderIcon size={22} aria-hidden="true" color="#c3a95e" />
                          <span>
                            <strong style={{ display: "block", fontSize: 14 }}>{folder.name}</strong>
                            <span className="ui-field-hint">
                              {count.docs} documento(s){count.folders ? ` · ${count.folders} subpasta(s)` : ""}
                            </span>
                          </span>
                        </button>
                        {!locked ? (
                          <>
                            <button type="button" className="ui-icon-btn" onClick={() => setFolderForm(folder)} aria-label={`Renomear pasta ${folder.name}`} title="Renomear">
                              <Pencil size={16} aria-hidden="true" />
                            </button>
                            <button type="button" className="ui-icon-btn" onClick={() => setDeletingFolder(folder)} aria-label={`Excluir pasta ${folder.name}`} title="Excluir pasta">
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          </>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ) : null}

          <section className="ui-card" aria-labelledby="docs-list-title">
            <h2 id="docs-list-title" style={{ margin: "0 0 10px", fontSize: 17, color: "var(--ui-primary)" }}>
              {searching ? `Resultados (${visibleDocs.length})` : currentFolder ? `Documentos em ${currentFolder.name}` : "Documentos sem pasta"}
            </h2>
            {loading ? (
              <div className="ui-skeleton" style={{ height: 160 }} />
            ) : visibleDocs.length === 0 ? (
              <p className="ui-empty">{searching ? "Nenhum documento encontrado." : "Nenhum documento nesta pasta."}</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 2 }}>
                {visibleDocs.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    path={searching ? folderPathOf(doc.folderId, folders) : null}
                    onOpen={() => setViewing(doc)}
                    onDownload={() => void download(doc)}
                    onEdit={canEdit ? () => setEditingDoc(doc) : undefined}
                    onDelete={canDelete ? () => setDeletingDoc(doc) : undefined}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>

      {viewing ? (
        <DocumentViewer
          key={viewing.id}
          document={documents.find((doc) => doc.id === viewing.id) ?? viewing}
          folderPath={folderPathOf(viewing.folderId, folders)}
          onClose={() => setViewing(null)}
          onDelete={canDelete ? () => setDeletingDoc(viewing) : undefined}
          canAttach={canEdit}
          notify={show}
        />
      ) : null}

      {newDoc ? (
        <NewDocumentModal
          key={`${newDoc.templateId}-${newDoc.prefill ? "p" : "n"}`}
          folders={folders}
          defaultFolderId={currentFolderId}
          initialTemplateId={newDoc.templateId}
          prefill={newDoc.prefill}
          clientId={newDoc.clientId ?? null}
          onClose={() => setNewDoc(null)}
          onCreated={(doc) => {
            setNewDoc(null);
            show(`Documento "${doc.name}" salvo.`);
            setCurrentFolderId(doc.folderId);
            setViewing(doc);
          }}
        />
      ) : null}

      {folderForm ? (
        <FolderFormModal
          folder={folderForm === "new" ? null : folderForm}
          parentId={currentFolderId}
          siblings={folders}
          onClose={() => setFolderForm(null)}
          onSave={async (folder) => {
            await foldersStore.save(folder);
            setFolderForm(null);
            show(folderForm === "new" ? `Pasta "${folder.name}" criada.` : "Pasta renomeada.");
          }}
        />
      ) : null}

      {editingDoc ? (
        <EditDocumentModal
          doc={editingDoc}
          folders={folders}
          onClose={() => setEditingDoc(null)}
          onSave={async (doc) => {
            await docsStore.save(doc);
            setEditingDoc(null);
            show("Documento atualizado.");
          }}
        />
      ) : null}

      {scanOpen ? (
        <ScanModal
          folders={folders}
          defaultFolderId={currentFolderId}
          onClose={() => setScanOpen(false)}
          onSaved={(doc) => {
            setScanOpen(false);
            show(`Digitalização "${doc.name}" salva.`);
            setCurrentFolderId(doc.folderId);
          }}
        />
      ) : null}

      {deletingDoc ? (
        <ConfirmDialog
          title="Excluir documento"
          danger
          confirmLabel="Excluir definitivamente"
          message={
            <>
              Tem certeza de que deseja excluir <strong>{deletingDoc.name}</strong> (protocolo {deletingDoc.protocol})? O arquivo será
              apagado e a ação não pode ser desfeita.
            </>
          }
          onConfirm={confirmDeleteDoc}
          onCancel={() => setDeletingDoc(null)}
        />
      ) : null}

      {deletingFolder ? (
        <ConfirmDialog
          title="Excluir pasta"
          danger
          confirmLabel="Excluir pasta"
          message={(() => {
            const count = countInside(deletingFolder.id);
            return count.docs || count.folders ? (
              <>
                A pasta <strong>{deletingFolder.name}</strong> tem {count.docs} documento(s) e {count.folders} subpasta(s). Eles serão movidos para a
                pasta de cima; nada é apagado.
              </>
            ) : (
              <>
                Excluir a pasta vazia <strong>{deletingFolder.name}</strong>?
              </>
            );
          })()}
          onConfirm={confirmDeleteFolder}
          onCancel={() => setDeletingFolder(null)}
        />
      ) : null}

      {toast}
    </AppShell>
  );
}

function DocumentRow({
  doc,
  path,
  onOpen,
  onDownload,
  onEdit,
  onDelete,
}: {
  doc: DocumentItem;
  path: string | null;
  onOpen: () => void;
  onDownload: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <li style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f1f5f9", padding: "6px 0" }}>
      <button
        type="button"
        onClick={onOpen}
        style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10, background: "none", border: 0, cursor: "pointer", textAlign: "left", minHeight: 40, font: "inherit", color: "var(--ui-text)" }}
      >
        <FileText size={20} aria-hidden="true" color="#092a54" style={{ flexShrink: 0 }} />
        <span style={{ minWidth: 0 }}>
          <strong style={{ display: "block", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</strong>
          <span className="ui-field-hint">
            {doc.category} · {doc.protocol} · {formatDate(doc.createdAt)}
            {path ? ` · ${path}` : ""}
            {doc.fileParts === 0 && !doc.template ? " · sem arquivo" : ""}
          </span>
        </span>
      </button>
      <button type="button" className="ui-icon-btn" onClick={onDownload} aria-label={`Baixar ${doc.name}`} title="Baixar">
        <Download size={16} aria-hidden="true" />
      </button>
      <div style={{ position: "relative" }}>
        <button type="button" className="ui-icon-btn" aria-label={`Mais ações para ${doc.name}`} aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
          <MoreVertical size={16} aria-hidden="true" />
        </button>
        {menuOpen ? (
          <div className="ui-menu" role="menu" onMouseLeave={() => setMenuOpen(false)}>
            <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onOpen(); }}>
              <Eye size={15} aria-hidden="true" /> Abrir
            </button>
            {onEdit ? (
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onEdit(); }}>
                <Pencil size={15} aria-hidden="true" /> Renomear / mover
              </button>
            ) : null}
            {onDelete ? (
              <button type="button" role="menuitem" className="ui-menu-danger" onClick={() => { setMenuOpen(false); onDelete(); }}>
                <Trash2 size={15} aria-hidden="true" /> Excluir
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

function FolderFormModal({
  folder,
  parentId,
  siblings,
  onClose,
  onSave,
}: {
  folder: Folder | null;
  parentId: string | null;
  siblings: Folder[];
  onClose: () => void;
  onSave: (folder: Folder) => Promise<void>;
}) {
  const [name, setName] = useState(folder?.name ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const targetParent = folder ? folder.parentId : parentId;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
      setError("O nome deve ter entre 2 e 80 caracteres.");
      return;
    }
    const duplicate = siblings.some((item) => item.parentId === targetParent && item.id !== folder?.id && normalizeText(item.name) === normalizeText(trimmed));
    if (duplicate) {
      setError("Já existe uma pasta com esse nome aqui.");
      return;
    }
    setSaving(true);
    try {
      await onSave(folder ? { ...folder, name: trimmed } : { id: newId("fld"), name: trimmed, parentId, createdAt: todayIso() });
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal
      title={folder ? "Renomear pasta" : "Nova pasta"}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="folder-form" className="ui-btn ui-btn-primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <form id="folder-form" onSubmit={handleSubmit} noValidate>
        <Field label="Nome da pasta" error={error} required>
          {(props) => <input {...props} data-autofocus className="ui-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />}
        </Field>
      </form>
    </Modal>
  );
}

function EditDocumentModal({
  doc,
  folders,
  onClose,
  onSave,
}: {
  doc: DocumentItem;
  folders: Folder[];
  onClose: () => void;
  onSave: (doc: DocumentItem) => Promise<void>;
}) {
  const [name, setName] = useState(doc.name);
  const [category, setCategory] = useState<DocumentCategory>(doc.category);
  const [folderId, setFolderId] = useState(doc.folderId ?? "");
  const [description, setDescription] = useState(doc.description);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const options = folders.map((folder) => ({ id: folder.id, label: folderPathOf(folder.id, folders) })).sort((a, b) => a.label.localeCompare(b.label));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 3 || name.trim().length > 160) {
      setError("O nome deve ter entre 3 e 160 caracteres.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...doc, name: name.trim(), category, folderId: folderId || null, description: description.trim() });
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Renomear / mover documento"
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="edit-doc-form" className="ui-btn ui-btn-primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <form id="edit-doc-form" onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 12 }}>
        <Field label="Nome" error={error} required>
          {(props) => <input {...props} data-autofocus className="ui-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={160} />}
        </Field>
        <div className="ui-form-grid">
          <Field label="Categoria">
            {(props) => (
              <select {...props} className="ui-input" value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
                {DOCUMENT_CATEGORIES.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Pasta">
            {(props) => (
              <select {...props} className="ui-input" value={folderId} onChange={(e) => setFolderId(e.target.value)}>
                <option value="">Sem pasta</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <Field label="Descrição">
          {(props) => <textarea {...props} className="ui-input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />}
        </Field>
      </form>
    </Modal>
  );
}

/** Digitalizar (Backlog 4): câmera do celular ou galeria; o usuário escolhe a pasta. */
function ScanModal({
  folders,
  defaultFolderId,
  onClose,
  onSaved,
}: {
  folders: Folder[];
  defaultFolderId: string | null;
  onClose: () => void;
  onSaved: (doc: DocumentItem) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState(`Digitalizacao_${todayIso()}`);
  const [folderId, setFolderId] = useState(defaultFolderId ?? "");
  const [category, setCategory] = useState<DocumentCategory>("Outro");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const options = folders.map((folder) => ({ id: folder.id, label: folderPathOf(folder.id, folders) })).sort((a, b) => a.label.localeCompare(b.label));

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL temporária da imagem escolhida
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Tire uma foto ou escolha uma imagem.");
      return;
    }
    if (name.trim().length < 3) {
      setError("Informe um nome com ao menos 3 caracteres.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const extension = file.type === "application/pdf" ? ".pdf" : file.type === "image/png" ? ".png" : ".jpg";
      const doc = await createDocument({
        name: name.trim().endsWith(extension) ? name.trim() : `${name.trim()}${extension}`,
        folderId: folderId || null,
        category,
        description: "Documento digitalizado pelo painel.",
        file,
      });
      onSaved(doc);
    } catch (err) {
      setError(errorMessage(err, "Não foi possível salvar a digitalização."));
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Digitalizar documento"
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="scan-form" className="ui-btn ui-btn-primary" disabled={saving} aria-busy={saving}>
            {saving ? "Salvando..." : "Salvar digitalização"}
          </button>
        </>
      }
    >
      <form id="scan-form" onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 12 }}>
        <div className="ui-row-actions">
          <label className="ui-btn ui-btn-primary" style={{ cursor: "pointer" }}>
            <ScanLine size={16} aria-hidden="true" /> Usar câmera
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <label className="ui-btn ui-btn-secondary" style={{ cursor: "pointer" }}>
            <Upload size={16} aria-hidden="true" /> Escolher da galeria
            <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        {preview && file?.type.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element -- pré-visualização local (blob:)
          <img src={preview} alt="Pré-visualização da digitalização" style={{ maxWidth: "100%", maxHeight: 260, borderRadius: 8, border: "1px solid #e2e8f0" }} />
        ) : file ? (
          <p className="ui-field-hint">Arquivo selecionado: {file.name}</p>
        ) : null}
        <Field label="Nome do documento" required>
          {(props) => <input {...props} className="ui-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={160} />}
        </Field>
        <div className="ui-form-grid">
          <Field label="Salvar na pasta">
            {(props) => (
              <select {...props} className="ui-input" value={folderId} onChange={(e) => setFolderId(e.target.value)}>
                <option value="">Sem pasta</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Categoria">
            {(props) => (
              <select {...props} className="ui-input" value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
                {DOCUMENT_CATEGORIES.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            )}
          </Field>
        </div>
        {error ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
