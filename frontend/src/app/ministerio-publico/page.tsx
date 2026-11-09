"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Download, Eye, FilePlus2, FileText, MoreVertical, Plus, Search, Send, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { folderPathOf } from "@/components/documents/DocumentViewer";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { FOLDER_IDS, documentHref } from "@/lib/documents";
import { downloadDataUrl, downloadText, loadFileContent } from "@/lib/files";
import { errorMessage } from "@/lib/financial-api";
import { MONTHS, addDaysIso, daysUntil, formatDate, formatDateTime, newId, normalizeText, todayIso } from "@/lib/format";
import { useRecords } from "@/lib/records";
import { MP_CATEGORIES, MP_STATUSES, documentSchema, folderSchema, mpSubmissionSchema, type DocumentItem, type Folder, type MpSubmission } from "@/lib/schemas";
import { useSession } from "@/lib/session";
import { findTemplate, renderTemplateHtml } from "@/lib/templates";
import { deadlineError, lengthError } from "@/lib/validation";

const STATUS_TONE: Record<MpSubmission["status"], string> = {
  Pendente: "ui-badge-warning",
  "Em revisão": "ui-badge-info",
  Enviado: "ui-badge-success",
  Confirmado: "ui-badge-success",
};

type Filters = { category: string; month: string; status: string; search: string };
const EMPTY_FILTERS: Filters = { category: "ALL", month: "ALL", status: "ALL", search: "" };

function submissionYear(item: MpSubmission) {
  return (item.sentAt ?? item.dueDate).slice(0, 4);
}

export default function MinisterioPublicoPage() {
  const store = useRecords("mp-submissions", mpSubmissionSchema);
  const { items: documents } = useRecords("documents", documentSchema);
  const { items: folders } = useRecords("folders", folderSchema);
  const session = useSession();
  const { show, node: toast } = useToast();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [formTarget, setFormTarget] = useState<MpSubmission | "new" | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<MpSubmission | null>(null);
  const detail = store.items.find((item) => item.id === detailId) ?? null;
  const userName = session?.user.name ?? "Usuário";

  const years = Array.from(new Set([String(new Date().getFullYear()), ...store.items.map(submissionYear)])).sort().reverse();
  const ofYear = store.items.filter((item) => submissionYear(item) === year);
  const docsById = useMemo(() => new Map(documents.map((doc) => [doc.id, doc])), [documents]);

  const rows = useMemo(() => {
    const term = normalizeText(filters.search);
    return ofYear
      .filter((item) => {
        if (filters.category !== "ALL" && item.category !== filters.category) return false;
        if (filters.status !== "ALL" && item.status !== filters.status) return false;
        if (filters.month !== "ALL" && Number((item.sentAt ?? item.dueDate).slice(5, 7)) !== Number(filters.month)) return false;
        if (!term) return true;
        const docNames = item.documentIds.map((id) => docsById.get(id)?.name ?? "").join(" ");
        return normalizeText(`${item.title} ${item.referencePeriod} ${item.responsible} ${item.protocol ?? ""} ${docNames}`).includes(term);
      })
      .sort((a, b) => (b.sentAt ?? b.dueDate).localeCompare(a.sentAt ?? a.dueDate));
  }, [ofYear, filters, docsById]);

  const upcoming = store.items
    .filter((item) => item.status === "Pendente" || item.status === "Em revisão")
    .filter((item) => daysUntil(item.dueDate) <= 7)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  async function update(item: MpSubmission, patch: Partial<MpSubmission>, action: string) {
    await store.save({ ...item, ...patch, history: [...item.history, { at: new Date().toISOString(), by: userName, action }] });
  }

  async function downloadAll(item: MpSubmission) {
    const docs = item.documentIds.map((id) => docsById.get(id)).filter((doc): doc is DocumentItem => Boolean(doc));
    if (docs.length === 0) {
      show("Este envio não tem documentos anexados.", "error");
      return;
    }
    try {
      for (const doc of docs) {
        if (doc.fileParts > 0) downloadDataUrl(await loadFileContent(doc.id, doc.fileParts), doc.name);
        else {
          const template = findTemplate(doc.template);
          if (template && doc.templateData) downloadText(renderTemplateHtml(template, doc.templateData, doc.protocol), doc.name.replace(/\.pdf$/i, ".html"));
        }
      }
      show(`${docs.length} documento(s) baixado(s).`);
    } catch (error) {
      show(errorMessage(error, "Falha ao baixar."), "error");
    }
  }

  const cards = [
    { label: "Envios cadastrados", value: ofYear.length, icon: FileText, bg: "#dbeafe", color: "#1d4ed8" },
    { label: "Pendentes de revisão", value: ofYear.filter((item) => item.status === "Pendente" || item.status === "Em revisão").length, icon: Clock, bg: "#fef3c7", color: "#a16207" },
    { label: "Confirmados pelo MP", value: ofYear.filter((item) => item.status === "Confirmado").length, icon: Send, bg: "#dcfce7", color: "#15803d" },
  ];

  return (
    <AppShell>
      <section className="ui-page" aria-labelledby="mp-title">
        <div className="ui-page-header">
          <div>
            <h1 id="mp-title">Ministério Público</h1>
            <p>Prestação de contas: documentos, conferência, envio e confirmação.</p>
          </div>
          <div className="ui-row-actions">
            <Link href={`/documentos?pasta=${FOLDER_IDS.ministerioPublico}`} className="ui-btn ui-btn-secondary">
              <FileText size={16} aria-hidden="true" /> Pasta do MP
            </Link>
            <Link href="/documentos?novo=prestacao" className="ui-btn ui-btn-secondary">
              <FilePlus2 size={16} aria-hidden="true" /> Gerar documento
            </Link>
            <button type="button" className="ui-btn ui-btn-primary" onClick={() => setFormTarget("new")}>
              <Plus size={16} aria-hidden="true" /> Novo envio
            </button>
          </div>
        </div>

        <div className="ui-toolbar">
          <div className="ui-field" style={{ maxWidth: 160 }}>
            <label htmlFor="mp-ano">Total por ano de</label>
            <select id="mp-ano" className="ui-input" value={year} onChange={(e) => setYear(e.target.value)}>
              {years.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="ui-stat-grid">
          {cards.map(({ label, value, icon: Icon, bg, color }) => (
            <div key={label} className="ui-card ui-stat">
              <span className="ui-stat-icon" style={{ background: bg, color }} aria-hidden="true">
                <Icon size={22} />
              </span>
              <div>
                <div className="ui-stat-label">{label}</div>
                <div className="ui-stat-value">{store.loading ? "…" : String(value).padStart(2, "0")}</div>
              </div>
            </div>
          ))}
        </div>

        {upcoming.length > 0 ? (
          <div className="ui-alert ui-alert-info" role="status">
            <strong>Prazos próximos:</strong>{" "}
            {upcoming.map((item, index) => {
              const days = daysUntil(item.dueDate);
              return (
                <span key={item.id}>
                  {index > 0 ? " · " : ""}
                  <button type="button" className="ui-link" onClick={() => setDetailId(item.id)}>
                    {item.title} ({item.referencePeriod})
                  </button>{" "}
                  {days < 0 ? `atrasado há ${-days} dia(s)` : days === 0 ? "vence hoje" : `vence em ${days} dia(s)`}
                </span>
              );
            })}
          </div>
        ) : null}

        <form
          className="ui-card ui-toolbar"
          onSubmit={(event) => {
            event.preventDefault();
            setFilters(draft);
          }}
        >
          <div className="ui-field">
            <label htmlFor="mp-tipo">Tipo de documento</label>
            <select id="mp-tipo" className="ui-input" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              <option value="ALL">Todos os tipos</option>
              {MP_CATEGORIES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="ui-field">
            <label htmlFor="mp-periodo">Período</label>
            <select id="mp-periodo" className="ui-input" value={draft.month} onChange={(e) => setDraft({ ...draft, month: e.target.value })}>
              <option value="ALL">Todos os períodos</option>
              {MONTHS.map((label, index) => (
                <option key={label} value={index + 1}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="ui-field">
            <label htmlFor="mp-status">Status</label>
            <select id="mp-status" className="ui-input" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
              <option value="ALL">Todos os status</option>
              {MP_STATUSES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="ui-field" style={{ flex: "2 1 200px" }}>
            <label htmlFor="mp-busca">Buscar documentos</label>
            <input id="mp-busca" className="ui-input" value={draft.search} onChange={(e) => setDraft({ ...draft, search: e.target.value })} placeholder="Título, documento, protocolo..." />
          </div>
          <div className="ui-row-actions">
            <button type="submit" className="ui-btn ui-btn-primary">
              <Search size={16} aria-hidden="true" /> Filtrar
            </button>
            <button
              type="button"
              className="ui-btn ui-btn-secondary"
              onClick={() => {
                setDraft(EMPTY_FILTERS);
                setFilters(EMPTY_FILTERS);
              }}
            >
              Limpar
            </button>
          </div>
        </form>

        {store.error ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {store.error}
          </p>
        ) : null}

        <div className="ui-table-wrap">
          <table className="ui-table">
            <caption className="sr-only">Envios ao Ministério Público em {year}</caption>
            <thead>
              <tr>
                <th scope="col">Documento</th>
                <th scope="col">Categoria</th>
                <th scope="col">Data de envio</th>
                <th scope="col">Prazo</th>
                <th scope="col">Responsável</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {store.loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="ui-skeleton" style={{ height: 22 }} />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="ui-empty">
                    Nenhum envio encontrado para {year} com esses filtros.
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <button type="button" className="ui-link" style={{ textDecoration: "none", color: "var(--ui-text)", fontWeight: 600 }} onClick={() => setDetailId(item.id)}>
                        {item.title}
                      </button>
                      <div className="ui-field-hint">
                        {item.referencePeriod} · {item.documentIds.length} documento(s)
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.sentAt ? formatDate(item.sentAt) : "—"}</td>
                    <td>{formatDate(item.dueDate)}</td>
                    <td>{item.responsible}</td>
                    <td>
                      <span className={`ui-badge ${STATUS_TONE[item.status]}`}>{item.status}</span>
                    </td>
                    <td>
                      <RowMenu
                        item={item}
                        onOpen={() => setDetailId(item.id)}
                        onEdit={() => setFormTarget(item)}
                        onDownload={() => void downloadAll(item)}
                        onMarkReview={() => void update(item, { status: item.status === "Em revisão" ? "Pendente" : "Em revisão" }, item.status === "Em revisão" ? "Voltou para pendente" : "Marcado para revisão").catch((err) => show(errorMessage(err), "error"))}
                        onDelete={() => setDeleting(item)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {formTarget ? (
        <SubmissionForm
          item={formTarget === "new" ? null : formTarget}
          documents={documents}
          folders={folders}
          userName={userName}
          onClose={() => setFormTarget(null)}
          onSave={async (item, created) => {
            await store.save(item);
            setFormTarget(null);
            setDetailId(item.id);
            show(created ? "Envio criado. Confira os documentos e envie ao MP." : "Envio atualizado.");
          }}
        />
      ) : null}

      {detail && !formTarget && !deleting ? (
        <SubmissionDetail
          item={detail}
          docsById={docsById}
          onClose={() => setDetailId(null)}
          onEdit={() => setFormTarget(detail)}
          onSend={async (protocol) => {
            await update(detail, { status: "Enviado", sentAt: new Date().toISOString(), protocol }, `Enviado ao Ministério Público (protocolo ${protocol})`);
            show("Envio registrado. Aguarde a confirmação do MP.");
          }}
          onConfirm={async () => {
            await update(detail, { status: "Confirmado" }, "Recebimento confirmado pelo Ministério Público");
            show("Recebimento confirmado.");
          }}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Excluir envio"
          danger
          confirmLabel="Excluir"
          message={
            <>
              Excluir o envio <strong>{deleting.title}</strong> ({deleting.referencePeriod})? Os documentos anexados continuam em Documentos.
            </>
          }
          onConfirm={async () => {
            await store.remove(deleting.id);
            setDeleting(null);
            setDetailId(null);
            show("Envio excluído.");
          }}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
      {toast}
    </AppShell>
  );
}

function RowMenu({
  item,
  onOpen,
  onEdit,
  onDownload,
  onMarkReview,
  onDelete,
}: {
  item: MpSubmission;
  onOpen: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onMarkReview: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };
  const editable = item.status === "Pendente" || item.status === "Em revisão";
  return (
    <div style={{ position: "relative" }}>
      <button type="button" className="ui-icon-btn" aria-label={`Ações de ${item.title}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <MoreVertical size={18} aria-hidden="true" />
      </button>
      {open ? (
        <div className="ui-menu" role="menu" onMouseLeave={() => setOpen(false)}>
          <button type="button" role="menuitem" onClick={run(onOpen)}>
            <Eye size={15} aria-hidden="true" /> Ver / conferir
          </button>
          {editable ? (
            <>
              <button type="button" role="menuitem" onClick={run(onEdit)}>
                <FileText size={15} aria-hidden="true" /> Editar / mover documentos
              </button>
              <button type="button" role="menuitem" onClick={run(onMarkReview)}>
                <Clock size={15} aria-hidden="true" /> {item.status === "Em revisão" ? "Marcar como pendente" : "Marcar para revisão"}
              </button>
            </>
          ) : null}
          <button type="button" role="menuitem" onClick={run(onDownload)}>
            <Download size={15} aria-hidden="true" /> Baixar documentos
          </button>
          {editable ? (
            <button type="button" role="menuitem" className="ui-menu-danger" onClick={run(onDelete)}>
              <Trash2 size={15} aria-hidden="true" /> Excluir
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SubmissionForm({
  item,
  documents,
  folders,
  userName,
  onClose,
  onSave,
}: {
  item: MpSubmission | null;
  documents: DocumentItem[];
  folders: Folder[];
  userName: string;
  onClose: () => void;
  onSave: (item: MpSubmission, created: boolean) => Promise<void>;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [category, setCategory] = useState<MpSubmission["category"]>(item?.category ?? "Prestação de Contas");
  const [referencePeriod, setReferencePeriod] = useState(item?.referencePeriod ?? "");
  const [dueDate, setDueDate] = useState(item?.dueDate ?? addDaysIso(todayIso(), 15));
  const [responsible, setResponsible] = useState(item?.responsible ?? userName);
  const [documentIds, setDocumentIds] = useState<string[]>(item?.documentIds ?? []);
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [docSearch, setDocSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Documentos da pasta do MP aparecem primeiro; a busca alcança qualquer documento.
  const mpFolderIds = new Set(folders.filter((folder) => folderPathOf(folder.id, folders).startsWith("Ministério Público")).map((folder) => folder.id));
  const term = normalizeText(docSearch);
  const candidates = documents
    .filter((doc) => (term ? normalizeText(`${doc.name} ${doc.protocol}`).includes(term) : mpFolderIds.has(doc.folderId ?? "") || documentIds.includes(doc.id)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 40);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: Record<string, string> = {};
    const titleError = lengthError(title, "o título", 3, 120);
    if (titleError) found.title = titleError;
    const periodError = lengthError(referencePeriod, "o período de referência", 3, 40);
    if (periodError) found.referencePeriod = periodError;
    const dueError = deadlineError(dueDate, { allowPast: item !== null && dueDate === item.dueDate });
    if (dueError) found.dueDate = dueError;
    if (responsible.trim().length < 3) found.responsible = "Informe o responsável.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    const now = new Date().toISOString();
    try {
      await onSave(
        {
          id: item?.id ?? newId("mp"),
          title: title.trim(),
          category,
          referencePeriod: referencePeriod.trim(),
          dueDate,
          responsible: responsible.trim(),
          status: item?.status ?? "Pendente",
          documentIds,
          sentAt: item?.sentAt ?? null,
          protocol: item?.protocol ?? null,
          notes: notes.trim(),
          history: [...(item?.history ?? []), { at: now, by: userName, action: item ? "Envio editado" : "Envio criado" }],
          createdAt: item?.createdAt ?? now,
        },
        item === null
      );
    } catch (err) {
      setErrors({ form: errorMessage(err) });
      setSaving(false);
    }
  }

  return (
    <Modal
      title={item ? "Editar envio" : "Novo envio ao Ministério Público"}
      wide
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="mp-form" className="ui-btn ui-btn-primary" disabled={saving} aria-busy={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <form id="mp-form" onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 12 }}>
        <div className="ui-form-grid">
          <Field label="Título" error={errors.title} required>
            {(props) => <input {...props} data-autofocus className="ui-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Ex.: Prestação de contas - 4º trimestre" />}
          </Field>
          <Field label="Categoria">
            {(props) => (
              <select {...props} className="ui-input" value={category} onChange={(e) => setCategory(e.target.value as MpSubmission["category"])}>
                {MP_CATEGORIES.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Período de referência" error={errors.referencePeriod} required>
            {(props) => <input {...props} className="ui-input" value={referencePeriod} onChange={(e) => setReferencePeriod(e.target.value)} maxLength={40} placeholder="Ex.: 4º trimestre/2026" />}
          </Field>
          <Field label="Data limite de envio" error={errors.dueDate} required>
            {(props) => <input {...props} type="date" className="ui-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />}
          </Field>
          <Field label="Responsável" error={errors.responsible} required>
            {(props) => <input {...props} className="ui-input" value={responsible} onChange={(e) => setResponsible(e.target.value)} maxLength={120} />}
          </Field>
        </div>
        <fieldset className="ui-card" style={{ margin: 0, display: "grid", gap: 8 }}>
          <legend className="ui-label" style={{ padding: "0 4px" }}>
            Documentos do envio ({documentIds.length} selecionado(s))
          </legend>
          <input className="ui-input" aria-label="Buscar documentos para anexar" value={docSearch} onChange={(e) => setDocSearch(e.target.value)} placeholder="Buscar em todos os documentos..." />
          {candidates.length === 0 ? (
            <p className="ui-field-hint">Nenhum documento encontrado. Gere ou envie documentos em Documentos.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 220, overflowY: "auto", display: "grid", gap: 4 }}>
              {candidates.map((doc) => (
                <li key={doc.id}>
                  <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14, minHeight: 28 }}>
                    <input
                      type="checkbox"
                      checked={documentIds.includes(doc.id)}
                      onChange={(e) => setDocumentIds((current) => (e.target.checked ? [...current, doc.id] : current.filter((id) => id !== doc.id)))}
                      style={{ marginTop: 3 }}
                    />
                    <span>
                      {doc.name}
                      <span className="ui-field-hint" style={{ display: "block" }}>
                        {folderPathOf(doc.folderId, folders)} · {doc.protocol}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
        <Field label="Observações">
          {(props) => <textarea {...props} className="ui-input" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />}
        </Field>
        {errors.form ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {errors.form}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

function SubmissionDetail({
  item,
  docsById,
  onClose,
  onEdit,
  onSend,
  onConfirm,
}: {
  item: MpSubmission;
  docsById: Map<string, DocumentItem>;
  onClose: () => void;
  onEdit: () => void;
  onSend: (protocol: string) => Promise<void>;
  onConfirm: () => Promise<void>;
}) {
  const [checked, setChecked] = useState<Set<string>>(() => new Set(item.status === "Enviado" || item.status === "Confirmado" ? item.documentIds : []));
  const [pendingProtocol, setPendingProtocol] = useState<string | null>(null);
  const [confirmReceipt, setConfirmReceipt] = useState(false);
  const docs = item.documentIds.map((id) => ({ id, doc: docsById.get(id) }));
  const missing = docs.filter((entry) => !entry.doc).length;
  const editable = item.status === "Pendente" || item.status === "Em revisão";
  const allChecked = docs.length > 0 && docs.every((entry) => entry.doc && checked.has(entry.id));
  const days = daysUntil(item.dueDate);

  if (pendingProtocol) {
    const protocol = pendingProtocol;
    return (
      <ConfirmDialog
        title="Confirmar envio ao Ministério Público"
        confirmLabel="Confirmar envio"
        message={
          <>
            Enviar <strong>{item.title}</strong> ({item.referencePeriod}) com {docs.length} documento(s) conferido(s)? O envio recebe o protocolo{" "}
            <strong>{protocol}</strong> e não poderá mais ser editado.
          </>
        }
        onConfirm={async () => {
          await onSend(protocol);
          setPendingProtocol(null);
        }}
        onCancel={() => setPendingProtocol(null)}
      />
    );
  }
  if (confirmReceipt) {
    return (
      <ConfirmDialog
        title="Registrar confirmação do MP"
        confirmLabel="Registrar confirmação"
        message={<>O Ministério Público confirmou o recebimento de <strong>{item.title}</strong> (protocolo {item.protocol})?</>}
        onConfirm={async () => {
          await onConfirm();
          setConfirmReceipt(false);
        }}
        onCancel={() => setConfirmReceipt(false)}
      />
    );
  }

  return (
    <Modal
      title={item.title}
      wide
      onClose={onClose}
      footer={
        <>
          {editable ? (
            <>
              <button type="button" className="ui-btn ui-btn-secondary" onClick={onEdit}>
                Editar
              </button>
              <button type="button" className="ui-btn ui-btn-primary" disabled={!allChecked || missing > 0} onClick={() => setPendingProtocol(`MP-PE-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`)} title={!allChecked ? "Confira todos os documentos antes de enviar" : undefined}>
                <Send size={16} aria-hidden="true" /> Enviar ao MP
              </button>
            </>
          ) : item.status === "Enviado" ? (
            <button type="button" className="ui-btn ui-btn-primary" onClick={() => setConfirmReceipt(true)}>
              <CheckCircle2 size={16} aria-hidden="true" /> Registrar confirmação do MP
            </button>
          ) : (
            <button type="button" className="ui-btn ui-btn-primary" onClick={onClose}>
              Fechar
            </button>
          )}
        </>
      }
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span className={`ui-badge ${STATUS_TONE[item.status]}`}>{item.status}</span>
        <span className="ui-field-hint">
          {item.category} · {item.referencePeriod} · responsável {item.responsible}
        </span>
        {editable ? (
          <span className={`ui-badge ${days < 0 ? "ui-badge-danger" : days <= 7 ? "ui-badge-warning" : "ui-badge-neutral"}`}>
            {days < 0 ? `Prazo vencido há ${-days} dia(s)` : `Prazo ${formatDate(item.dueDate)} (${days} dia(s))`}
          </span>
        ) : null}
        {item.protocol ? <span className="ui-field-hint">Protocolo {item.protocol}</span> : null}
      </div>

      <section>
        <h3 style={{ fontSize: 15, margin: "4px 0 6px", color: "var(--ui-primary)" }}>Checklist de documentos</h3>
        <p className="ui-field-hint" style={{ marginTop: 0 }}>
          Confira cada documento e a data da última atualização antes de enviar.
        </p>
        {docs.length === 0 ? (
          <p className="ui-alert ui-alert-info">Nenhum documento anexado. Use “Editar” para escolher os documentos.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
            {docs.map(({ id, doc }) => (
              <li key={id} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, minHeight: 28 }}>
                  <input
                    type="checkbox"
                    disabled={!editable || !doc}
                    checked={checked.has(id)}
                    onChange={(e) =>
                      setChecked((current) => {
                        const next = new Set(current);
                        if (e.target.checked) next.add(id);
                        else next.delete(id);
                        return next;
                      })
                    }
                  />
                  {doc ? doc.name : <span style={{ color: "var(--ui-danger)" }}>Documento removido de Documentos</span>}
                </label>
                {doc ? (
                  <span className="ui-field-hint">
                    Atualizado em {formatDate(doc.createdAt)} ·{" "}
                    <Link href={documentHref(doc.id)} className="ui-link">
                      abrir
                    </Link>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {item.notes ? <p style={{ margin: 0, fontSize: 14 }}>{item.notes}</p> : null}

      <section>
        <h3 style={{ fontSize: 15, margin: "4px 0 6px", color: "var(--ui-primary)" }}>Histórico</h3>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>
          {[...item.history].reverse().map((entry) => (
            <li key={`${entry.at}-${entry.action}`}>
              {formatDateTime(entry.at)} — {entry.action} ({entry.by})
            </li>
          ))}
        </ul>
      </section>
    </Modal>
  );
}
