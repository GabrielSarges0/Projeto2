"use client";

import { useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { FileText, Pencil, Upload } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { FOLDER_IDS, createDocument, documentHref } from "@/lib/documents";
import { ACCEPTED_FILE_TYPES, fileTooLargeMessage } from "@/lib/files";
import { USER_ROLE_LABEL, errorMessage, type TeamMember } from "@/lib/financial-api";
import { formatDate, formatDateTime, todayIso } from "@/lib/format";
import type { DocumentItem } from "@/lib/schemas";
import { validateTeamProfile, type TeamProfile, type TeamProfileErrors } from "@/lib/team-profiles";
import { formatCpf, formatPhone } from "@/lib/validation";

type TextKey = "fullName" | "position" | "cpf" | "rg" | "phone" | "address" | "emergencyContactName" | "emergencyContactPhone";

type Props = {
  member: TeamMember;
  profile: TeamProfile;
  documents: DocumentItem[];
  onClose: () => void;
  onSave: (profile: TeamProfile) => Promise<void>;
};

/** Ficha do membro da equipe: dados pessoais, edição e contrato vinculado (relatório de teste, item 4.2). */
export function TeamMemberSheet({ member, profile, documents, onClose, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const contract = profile.contractDocId ? documents.find((doc) => doc.id === profile.contractDocId) ?? null : null;

  return (
    <Modal
      title={editing ? `Editar ficha de ${member.name}` : `Ficha de ${member.name}`}
      wide
      onClose={onClose}
      busy={saving}
      footer={
        editing ? undefined : (
          <>
            <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose}>
              Fechar
            </button>
            <button type="button" className="ui-btn ui-btn-primary" onClick={() => setEditing(true)} data-autofocus>
              <Pencil size={16} aria-hidden="true" /> Editar dados
            </button>
          </>
        )
      }
    >
      {editing ? (
        <ProfileForm
          member={member}
          profile={profile}
          documents={documents}
          onCancel={() => setEditing(false)}
          onSavingChange={setSaving}
          onSave={async (next) => {
            await onSave(next);
            setEditing(false);
          }}
        />
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          <section aria-labelledby="ficha-conta">
            <h3 id="ficha-conta" style={sectionTitle}>
              Conta
            </h3>
            <dl style={infoGrid}>
              <Info label="E-mail de acesso" value={member.email} />
              <Info label="Papel" value={USER_ROLE_LABEL[member.role]} />
              <Info label="Situação" value={member.active ? "Ativa" : "Desativada"} />
              <Info label="Último acesso" value={formatDateTime(member.lastLoginAt)} />
            </dl>
          </section>

          <section aria-labelledby="ficha-pessoal">
            <h3 id="ficha-pessoal" style={sectionTitle}>
              Dados pessoais
            </h3>
            <dl style={infoGrid}>
              <Info label="Nome completo" value={profile.fullName || member.name} />
              <Info label="CPF" value={profile.cpf} />
              <Info label="RG" value={profile.rg} />
              <Info label="Nascimento" value={profile.birthDate ? formatDate(profile.birthDate) : ""} />
              <Info label="Telefone" value={profile.phone} />
              <Info label="Cargo" value={profile.position} />
              <Info label="Admissão" value={profile.admissionDate ? formatDate(profile.admissionDate) : ""} />
              <Info label="Contato de emergência" value={[profile.emergencyContactName, profile.emergencyContactPhone].filter(Boolean).join(" · ")} />
            </dl>
            <dl style={{ ...infoGrid, marginTop: 10 }}>
              <Info label="Endereço" value={profile.address} wide />
              <Info label="Observações" value={profile.notes} wide />
            </dl>
          </section>

          <section aria-labelledby="ficha-contrato">
            <h3 id="ficha-contrato" style={sectionTitle}>
              Contrato
            </h3>
            {profile.contractDocId ? (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <FileText size={18} aria-hidden="true" color="#092a54" />
                  <strong>{contract?.name ?? profile.contractName ?? "Contrato"}</strong>
                  {contract ? <span className="ui-field-hint">· {contract.protocol}</span> : null}
                </span>
                {contract ? (
                  <Link href={documentHref(contract.id)} className="ui-btn ui-btn-secondary ui-btn-sm">
                    <FileText size={14} aria-hidden="true" /> Ver contrato
                  </Link>
                ) : (
                  <span className="ui-alert ui-alert-error" role="status">
                    O documento do contrato não foi encontrado (pode ter sido excluído).
                  </span>
                )}
              </div>
            ) : (
              <p className="ui-empty" style={{ padding: "12px 0" }}>
                Nenhum contrato vinculado. Use “Editar dados” para escolher um documento ou enviar o arquivo.
              </p>
            )}
          </section>
          {profile.updatedAt ? <span className="ui-field-hint">Ficha atualizada em {formatDateTime(profile.updatedAt)}.</span> : null}
        </div>
      )}
    </Modal>
  );
}

function ProfileForm({
  member,
  profile,
  documents,
  onCancel,
  onSavingChange,
  onSave,
}: {
  member: TeamMember;
  profile: TeamProfile;
  documents: DocumentItem[];
  onCancel: () => void;
  onSavingChange: (saving: boolean) => void;
  onSave: (profile: TeamProfile) => Promise<void>;
}) {
  const formId = useId();
  const [draft, setDraft] = useState<TeamProfile>({ ...profile, fullName: profile.fullName || member.name });
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<TeamProfileErrors & { contractFile?: string }>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const today = todayIso();

  // Contratos e documentos de funcionários primeiro; o resto vem depois, por nome.
  const documentOptions = useMemo(() => {
    const preferred = new Set<string>([FOLDER_IDS.funcionarios, FOLDER_IDS.contratos]);
    return [...documents].sort((a, b) => {
      const rank = (doc: DocumentItem) => (doc.folderId && preferred.has(doc.folderId) ? 0 : doc.category === "Contrato" ? 1 : 2);
      return rank(a) - rank(b) || a.name.localeCompare(b.name);
    });
  }, [documents]);

  function set<K extends keyof TeamProfile>(key: K, value: TeamProfile[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    // O erro some ao corrigir o campo; volta a ser checado no próximo envio.
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: TeamProfileErrors & { contractFile?: string } = validateTeamProfile(draft, today);
    const tooLarge = contractFile ? fileTooLargeMessage(contractFile) : null;
    if (tooLarge) found.contractFile = tooLarge;
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    onSavingChange(true);
    setFormError("");
    try {
      let next: TeamProfile = { ...draft, fullName: draft.fullName.trim().replace(/\s+/g, " "), updatedAt: new Date().toISOString() };
      if (contractFile) {
        const doc = await createDocument({
          name: `Contrato - ${next.fullName}`,
          folderId: FOLDER_IDS.funcionarios,
          category: "Contrato",
          description: `Contrato de ${next.fullName} (${member.email}).`,
          file: contractFile,
        });
        next = { ...next, contractDocId: doc.id, contractName: doc.name };
      } else {
        const linked = documents.find((doc) => doc.id === next.contractDocId);
        next = { ...next, contractName: linked?.name ?? null };
      }
      await onSave(next);
    } catch (err) {
      setFormError(errorMessage(err, "Não foi possível salvar a ficha."));
    } finally {
      setSaving(false);
      onSavingChange(false);
    }
  }

  const text = (key: TextKey, label: string, options: { required?: boolean; hint?: string; maxLength?: number; format?: (v: string) => string; inputMode?: "numeric" | "tel" } = {}) => (
    <Field label={label} required={options.required} hint={options.hint} error={errors[key]}>
      {(props) => (
        <input
          {...props}
          className="ui-input"
          value={draft[key]}
          maxLength={options.maxLength}
          inputMode={options.inputMode}
          onChange={(e) => set(key, options.format ? options.format(e.target.value) : e.target.value)}
        />
      )}
    </Field>
  );

  const date = (key: "birthDate" | "admissionDate", label: string) => (
    <Field label={label} error={errors[key]}>
      {(props) => <input {...props} type="date" className="ui-input" value={draft[key]} max={today} onChange={(e) => set(key, e.target.value)} />}
    </Field>
  );

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 14 }}>
      <fieldset style={fieldsetStyle}>
        <legend style={sectionTitle}>Dados pessoais</legend>
        <div className="ui-form-grid">
          {text("fullName", "Nome completo", { required: true, maxLength: 160 })}
          {text("position", "Cargo", { maxLength: 80 })}
          {text("cpf", "CPF", { format: formatCpf, inputMode: "numeric", maxLength: 14 })}
          {text("rg", "RG", { maxLength: 20 })}
          {date("birthDate", "Data de nascimento")}
          {date("admissionDate", "Data de admissão")}
          {text("phone", "Telefone", { format: formatPhone, inputMode: "tel", maxLength: 15 })}
          {text("address", "Endereço", { maxLength: 200 })}
          {text("emergencyContactName", "Contato de emergência", { maxLength: 120 })}
          {text("emergencyContactPhone", "Telefone do contato", { format: formatPhone, inputMode: "tel", maxLength: 15 })}
        </div>
        <Field label="Observações" error={errors.notes}>
          {(props) => <textarea {...props} className="ui-input" rows={3} maxLength={1000} value={draft.notes} onChange={(e) => set("notes", e.target.value)} />}
        </Field>
      </fieldset>

      <fieldset style={fieldsetStyle}>
        <legend style={sectionTitle}>Contrato</legend>
        <div className="ui-form-grid">
          <Field label="Documento já cadastrado" hint="Escolha um documento de Documentos.">
            {(props) => (
              <select
                {...props}
                className="ui-input"
                value={draft.contractDocId ?? ""}
                disabled={Boolean(contractFile)}
                onChange={(e) => set("contractDocId", e.target.value || null)}
              >
                <option value="">Nenhum</option>
                {documentOptions.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.protocol})
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Ou enviar o arquivo do contrato" hint="Vai para Documentos › Funcionários. PDF, imagem ou Word, até 8 MB." error={errors.contractFile}>
            {(props) => (
              <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <input
                  {...props}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  className="ui-input"
                  onChange={(e) => setContractFile(e.target.files?.[0] ?? null)}
                />
                {contractFile ? (
                  <span className="ui-field-hint" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Upload size={13} aria-hidden="true" /> {contractFile.name}
                  </span>
                ) : null}
              </span>
            )}
          </Field>
        </div>
      </fieldset>

      {formError ? (
        <p className="ui-alert ui-alert-error" role="alert">
          {formError}
        </p>
      ) : null}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="ui-btn ui-btn-secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button type="submit" className="ui-btn ui-btn-primary" disabled={saving} aria-busy={saving}>
          {saving ? "Salvando..." : "Salvar ficha"}
        </button>
      </div>
    </form>
  );
}

function Info({ label, value, wide = false }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div style={{ background: "var(--ui-surface-muted)", padding: "8px 10px", borderRadius: 8, gridColumn: wide ? "1 / -1" : undefined }}>
      <dt style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: 14, fontWeight: 600, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{value || "—"}</dd>
    </div>
  );
}

const sectionTitle = { margin: "0 0 8px", padding: 0, fontSize: 15, fontWeight: 700, color: "var(--ui-primary)" } as const;
const infoGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))", gap: 10, margin: 0 } as const;
const fieldsetStyle = { border: 0, margin: 0, padding: 0, display: "grid", gap: 12, minWidth: 0 } as const;
