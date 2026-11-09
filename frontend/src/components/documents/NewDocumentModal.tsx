"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, FilePlus2, FileText, PenLine, Settings2, ShieldCheck, Upload } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { createDocument } from "@/lib/documents";
import { ACCEPTED_FILE_TYPES, fileTooLargeMessage } from "@/lib/files";
import { errorMessage, propertiesApi, type PropertyItem } from "@/lib/financial-api";
import { formatMoneyInput, isValidIsoDate, parseMoney, todayIso } from "@/lib/format";
import { DOCUMENT_CATEGORIES, type DocumentCategory, type DocumentItem, type DocumentSignature, type Folder } from "@/lib/schemas";
import { useCan } from "@/lib/permissions";
import { DOCUMENT_TEMPLATES, findTemplate, renderTemplate, useTemplateSettings, type DocumentTemplate } from "@/lib/templates";
import { DocumentPreview } from "./DocumentPreview";
import { SignDocumentModal } from "./SignDocumentModal";
import { generateDocumentHash, parseSignaturePrefs, SIGNATURE_TYPE_LABELS } from "@/lib/signatures";
import { useSession } from "@/lib/session";
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
  const canEdit = useCan("edit");

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
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 6 }}>
            <h3 style={{ margin: 0, fontSize: 15, color: "var(--ui-primary)" }}>Criar a partir de um formulário</h3>
            {canEdit ? (
              <Link href="/documentos/modelos" className="ui-link" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                <Settings2 size={16} aria-hidden="true" /> Formatação dos modelos
              </Link>
            ) : null}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 10 }}>
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
  const settings = useTemplateSettings();
  const layout = settings.layoutFor(template.id);
  const needsProperties = template.fields.some((field) => field.type === "property");
  const session = useSession();
  const savedPrefs = parseSignaturePrefs(session?.user?.preferences as Record<string, unknown> | undefined);
  const [signature, setSignature] = useState<DocumentSignature>(() => ({
    type: savedPrefs.defaultType || "hash",
    signedBy: session?.user?.name || "Representante FMC",
    signerRole: savedPrefs.defaultRole || "Representante Legal",
    signerEmail: session?.user?.username || "",
    signedAt: new Date().toISOString(),
    sha256: "calculando...",
    signatureImage: savedPrefs.signatureImage || null,
    cursiveStyle: savedPrefs.cursiveStyle || "classic",
    includeQrCode: true,
  }));
  const [showSignModal, setShowSignModal] = useState(false);

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
      const rendered = renderTemplate(template, trimmed, layout);
      const signedAt = new Date().toISOString();
      const sha256 = await generateDocumentHash({
        protocol: "FMC-EMISSAO",
        title: template.fileName(trimmed),
        paragraphs: rendered.paragraphs,
        signer: signature.signedBy,
        signedAt,
      });
      const finalSignature: DocumentSignature = {
        ...signature,
        signedAt,
        sha256,
      };
      const created = await createDocument({
        name: template.fileName(trimmed),
        folderId: folderId || null,
        category: template.category,
        description: template.description,
        template: template.id,
        templateData: trimmed,
        rendered,
        clientId,
        signed: true,
        signature: finalSignature,
      });
      onCreated(created);
    } catch (error) {
      setFormError(errorMessage(error, "Não foi possível gerar o documento."));
      setSaving(false);
      onSavingChange(false);
    }
  }

  const preview = renderTemplate(template, data, layout, { showMissingRequired: true });
  const settingsBlocked = settings.loading || Boolean(settings.error);

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 14 }}>
      <BackButton onBack={onBack} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 16 }}>
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
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#092a54" }}>
                <ShieldCheck size={16} />
                <span>Assinatura Digital</span>
              </div>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {SIGNATURE_TYPE_LABELS[signature.type]} · {signature.signedBy} ({signature.signerRole})
              </span>
            </div>
            <button
              type="button"
              className="ui-btn ui-btn-secondary ui-btn-sm"
              onClick={() => setShowSignModal(true)}
              style={{ whiteSpace: "nowrap" }}
            >
              <PenLine size={14} aria-hidden="true" /> Alterar
            </button>
          </div>
        </div>
        <aside aria-label="Pré-visualização" className="ui-card" style={{ alignSelf: "start", background: "#fff" }}>
          {settings.loading ? <div className="ui-skeleton" style={{ height: 220 }} aria-busy="true" /> : <DocumentPreview layout={preview} signature={signature} compact />}
        </aside>
      </div>
      {settings.error ? (
        <div className="ui-alert ui-alert-error" role="alert" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
          <span>Não foi possível carregar a formatação deste modelo. O documento só é gerado com a formatação certa.</span>
          <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => void settings.reload()}>
            Tentar de novo
          </button>
        </div>
      ) : null}
      {formError ? (
        <p className="ui-alert ui-alert-error" role="alert">
          {formError}
        </p>
      ) : null}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" className="ui-btn ui-btn-primary" disabled={saving || settingsBlocked} aria-busy={saving}>
          {saving ? "Gerando..." : "Gerar e salvar documento"}
        </button>
      </div>
      {showSignModal ? (
        <SignDocumentModal
          documentTitle={template.fileName(data)}
          protocol="FMC-EMISSAO"
          paragraphs={preview.paragraphs}
          initialSignature={signature}
          onClose={() => setShowSignModal(false)}
          onSign={(newSig) => {
            setSignature(newSig);
            setShowSignModal(false);
          }}
        />
      ) : null}
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
