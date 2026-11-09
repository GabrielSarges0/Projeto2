"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, FilePlus2, FileText, Upload } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { createDocument } from "@/lib/documents";
import { ACCEPTED_FILE_TYPES, fileTooLargeMessage } from "@/lib/files";
import { errorMessage, propertiesApi, type PropertyItem } from "@/lib/financial-api";
import { formatMoneyInput, isValidIsoDate, parseMoney, todayIso } from "@/lib/format";
import { DOCUMENT_CATEGORIES, type DocumentCategory, type DocumentItem, type Folder } from "@/lib/schemas";
import { DOCUMENT_TEMPLATES, findTemplate, type DocumentTemplate } from "@/lib/templates";
import { folderPathOf } from "./DocumentViewer";

type Step = { kind: "choose" } | { kind: "template"; template: DocumentTemplate } | { kind: "upload" } | { kind: "blank" };

type Props = {
  folders: Folder[];
  defaultFolderId: string | null;
  initialTemplateId?: string | null;
  prefill?: Record<string, string>;
  clientId?: string | null;
  onClose: () => void;
  onCreated: (document: DocumentItem) => void;
};

/** Formulários de documento ficam aqui, dentro de Documentos → Novo documento (Relatório Sprint 3). */
export function NewDocumentModal({ folders, defaultFolderId, initialTemplateId, prefill, clientId, onClose, onCreated }: Props) {
  const initialTemplate = findTemplate(initialTemplateId);
  const [step, setStep] = useState<Step>(initialTemplate ? { kind: "template", template: initialTemplate } : { kind: "choose" });
  const [saving, setSaving] = useState(false);

  const title =
    step.kind === "template" ? step.template.label : step.kind === "upload" ? "Enviar arquivo" : step.kind === "blank" ? "Registro sem arquivo" : "Novo documento";

  return (
    <Modal title={title} wide onClose={onClose} busy={saving}>
      {step.kind === "choose" ? (
        <div style={{ display: "grid", gap: 14 }}>
          <div className="ui-form-grid">
            <button type="button" className="ui-card" style={choiceStyle} onClick={() => setStep({ kind: "upload" })}>
              <Upload size={22} aria-hidden="true" />
              <strong>Enviar arquivo</strong>
              <span className="ui-field-hint">PDF, imagem ou planilha já pronta (até 8 MB).</span>
            </button>
            <button type="button" className="ui-card" style={choiceStyle} onClick={() => setStep({ kind: "blank" })}>
              <FilePlus2 size={22} aria-hidden="true" />
              <strong>Registro sem arquivo</strong>
              <span className="ui-field-hint">Cadastra o documento agora e anexa o arquivo depois.</span>
            </button>
          </div>
          <h3 style={{ margin: "6px 0 0", fontSize: 15, color: "var(--ui-primary)" }}>Criar a partir de um formulário</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {DOCUMENT_TEMPLATES.map((template) => (
              <button key={template.id} type="button" className="ui-card" style={choiceStyle} onClick={() => setStep({ kind: "template", template })}>
                <FileText size={20} aria-hidden="true" />
                <strong>{template.label}</strong>
                <span className="ui-field-hint">{template.description}</span>
              </button>
            ))}
          </div>
        </div>
      ) : step.kind === "template" ? (
        <TemplateForm
          template={step.template}
          folders={folders}
          defaultFolderId={defaultFolderId ?? step.template.folderId}
          prefill={prefill}
          clientId={clientId ?? null}
          onBack={initialTemplate ? undefined : () => setStep({ kind: "choose" })}
          onSavingChange={setSaving}
          onCreated={onCreated}
        />
      ) : (
        <FileForm
          withFile={step.kind === "upload"}
          folders={folders}
          defaultFolderId={defaultFolderId}
          clientId={clientId ?? null}
          onBack={() => setStep({ kind: "choose" })}
          onSavingChange={setSaving}
          onCreated={onCreated}
        />
      )}
    </Modal>
  );
}

const choiceStyle = {
  display: "grid",
  gap: 6,
  justifyItems: "start",
  textAlign: "left" as const,
  cursor: "pointer",
  color: "var(--ui-text)",
  font: "inherit",
};

function FolderSelect({ folders, value, onChange }: { folders: Folder[]; value: string; onChange: (value: string) => void }) {
  const options = useMemo(
    () => folders.map((folder) => ({ id: folder.id, label: folderPathOf(folder.id, folders) })).sort((a, b) => a.label.localeCompare(b.label)),
    [folders]
  );
  return (
    <Field label="Salvar na pasta">
      {(props) => (
        <select {...props} className="ui-input" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Sem pasta</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

function BackButton({ onBack }: { onBack?: () => void }) {
  if (!onBack) return null;
  return (
    <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" style={{ justifySelf: "start" }} onClick={onBack}>
      <ArrowLeft size={14} aria-hidden="true" /> Escolher outro tipo
    </button>
  );
}

function TemplateForm({
  template,
  folders,
  defaultFolderId,
  prefill,
  clientId,
  onBack,
  onSavingChange,
  onCreated,
}: {
  template: DocumentTemplate;
  folders: Folder[];
  defaultFolderId: string | null;
  prefill?: Record<string, string>;
  clientId: string | null;
  onBack?: () => void;
  onSavingChange: (saving: boolean) => void;
  onCreated: (document: DocumentItem) => void;
}) {
  const [data, setData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    template.fields.forEach((field) => {
      initial[field.key] = prefill?.[field.key] ?? (field.type === "date" ? todayIso() : field.type === "number" && field.key === "ano" ? String(new Date().getFullYear()) : "");
    });
    return initial;
  });
  const [folderId, setFolderId] = useState(defaultFolderId ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const needsProperties = template.fields.some((field) => field.type === "property");

  useEffect(() => {
    if (!needsProperties) return;
    propertiesApi
      .list()
      .then(setProperties)
      .catch(() => setProperties([]));
  }, [needsProperties]);

  function set(key: string, value: string) {
    setData((current) => ({ ...current, [key]: value }));
  }

  function validate(): Record<string, string> {
    const found: Record<string, string> = {};
    template.fields.forEach((field) => {
      const value = (data[field.key] ?? "").trim();
      if (field.required && !value) {
        found[field.key] = `Preencha ${field.label.toLowerCase()}.`;
        return;
      }
      if (!value) return;
      if (field.maxLength && value.length > field.maxLength) found[field.key] = `Máximo de ${field.maxLength} caracteres.`;
      if (field.type === "money") {
        const amount = parseMoney(value);
        if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) found[field.key] = "Informe um valor entre R$ 0,01 e R$ 10.000.000,00.";
      }
      if (field.type === "number" && !/^\d{1,4}$/.test(value)) found[field.key] = "Informe um número inteiro.";
      if (field.key === "ano" && (Number(value) < 2000 || Number(value) > 2100)) found[field.key] = "Ano entre 2000 e 2100.";
      if (field.key === "prazoMeses" && (Number(value) < 1 || Number(value) > 120)) found[field.key] = "Prazo entre 1 e 120 meses.";
      if (field.type === "date" && !isValidIsoDate(value)) found[field.key] = "Data inválida.";
    });
    return found;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError("Corrija os campos destacados.");
      return;
    }
    setSaving(true);
    onSavingChange(true);
    setFormError("");
    try {
      const trimmed = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value.trim()]));
      const created = await createDocument({
        name: template.fileName(trimmed),
        folderId: folderId || null,
        category: template.category,
        description: template.description,
        template: template.id,
        templateData: trimmed,
        clientId,
        signed: true,
      });
      onCreated(created);
    } catch (error) {
      setFormError(errorMessage(error, "Não foi possível gerar o documento."));
      setSaving(false);
      onSavingChange(false);
    }
  }

  const preview = template.render(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v || `[${k}]`])));

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 14 }}>
      <BackButton onBack={onBack} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
          {template.fields.map((field) => (
            <Field key={field.key} label={field.label} required={field.required} error={errors[field.key]}>
              {(props) =>
                field.type === "textarea" ? (
                  <textarea {...props} className="ui-input" value={data[field.key]} onChange={(e) => set(field.key, e.target.value)} maxLength={field.maxLength} />
                ) : field.type === "select" ? (
                  <select {...props} className="ui-input" value={data[field.key]} onChange={(e) => set(field.key, e.target.value)}>
                    <option value="">Selecione</option>
                    {field.options?.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === "property" ? (
                  <select {...props} className="ui-input" value={data[field.key]} onChange={(e) => set(field.key, e.target.value)}>
                    <option value="">Selecione o imóvel</option>
                    {data[field.key] && !properties.some((p) => `${p.registrationCode} - ${p.address}` === data[field.key]) ? (
                      <option value={data[field.key]}>{data[field.key]}</option>
                    ) : null}
                    {properties.map((property) => (
                      <option key={property.id} value={`${property.registrationCode} - ${property.address}`}>
                        {property.registrationCode} - {property.address}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    {...props}
                    className="ui-input"
                    type={field.type === "date" ? "date" : "text"}
                    inputMode={field.type === "money" || field.type === "number" ? "numeric" : undefined}
                    placeholder={field.type === "money" ? "R$ 0,00" : field.placeholder}
                    value={data[field.key]}
                    maxLength={field.maxLength}
                    onChange={(e) =>
                      set(field.key, field.type === "money" ? formatMoneyInput(e.target.value) : field.type === "number" ? e.target.value.replace(/\D/g, "").slice(0, 4) : e.target.value)
                    }
                  />
                )
              }
            </Field>
          ))}
          <FolderSelect folders={folders} value={folderId} onChange={setFolderId} />
        </div>
        <aside aria-label="Pré-visualização" className="ui-card" style={{ fontFamily: "Georgia, serif", fontSize: 13.5, lineHeight: 1.55, alignSelf: "start" }}>
          <p style={{ textAlign: "center", fontWeight: 700, margin: 0, fontSize: 12 }}>FUNDAÇÃO MANUEL CRUZ</p>
          <h3 style={{ textAlign: "center", color: "var(--ui-primary)", fontSize: 14 }}>{preview.title}</h3>
          {preview.paragraphs.map((paragraph) => (
            <p key={paragraph} style={{ textAlign: "justify" }}>
              {paragraph}
            </p>
          ))}
        </aside>
      </div>
      {formError ? (
        <p className="ui-alert ui-alert-error" role="alert">
          {formError}
        </p>
      ) : null}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" className="ui-btn ui-btn-primary" disabled={saving} aria-busy={saving}>
          {saving ? "Gerando..." : "Gerar e salvar documento"}
        </button>
      </div>
    </form>
  );
}

function FileForm({
  withFile,
  folders,
  defaultFolderId,
  clientId,
  onBack,
  onSavingChange,
  onCreated,
}: {
  withFile: boolean;
  folders: Folder[];
  defaultFolderId: string | null;
  clientId: string | null;
  onBack: () => void;
  onSavingChange: (saving: boolean) => void;
  onCreated: (document: DocumentItem) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("Outro");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState(defaultFolderId ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (withFile && !file) found.file = "Escolha um arquivo.";
    if (file) {
      const tooLarge = fileTooLargeMessage(file);
      if (tooLarge) found.file = tooLarge;
    }
    if (name.trim().length < 3) found.name = "Informe um nome com ao menos 3 caracteres.";
    if (name.trim().length > 160) found.name = "Máximo de 160 caracteres.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    onSavingChange(true);
    setFormError("");
    try {
      const created = await createDocument({
        name: name.trim(),
        folderId: folderId || null,
        category,
        description,
        file: file ?? undefined,
        clientId,
      });
      onCreated(created);
    } catch (error) {
      setFormError(errorMessage(error, "Não foi possível salvar o documento."));
      setSaving(false);
      onSavingChange(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 12 }}>
      <BackButton onBack={onBack} />
      {withFile ? (
        <Field label="Arquivo" required error={errors.file} hint="PDF, imagem, Word ou Excel — até 8 MB.">
          {(props) => (
            <input
              {...props}
              type="file"
              className="ui-input"
              accept={ACCEPTED_FILE_TYPES}
              onChange={(e) => {
                const selected = e.target.files?.[0] ?? null;
                setFile(selected);
                if (selected && !name) setName(selected.name);
              }}
            />
          )}
        </Field>
      ) : null}
      <div className="ui-form-grid">
        <Field label="Nome do documento" required error={errors.name}>
          {(props) => <input {...props} className="ui-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={160} />}
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
      <FolderSelect folders={folders} value={folderId} onChange={setFolderId} />
      <Field label="Descrição" hint="Opcional.">
        {(props) => <textarea {...props} className="ui-input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />}
      </Field>
      {formError ? (
        <p className="ui-alert ui-alert-error" role="alert">
          {formError}
        </p>
      ) : null}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" className="ui-btn ui-btn-primary" disabled={saving} aria-busy={saving}>
          {saving ? "Salvando..." : "Salvar documento"}
        </button>
      </div>
    </form>
  );
}
