"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { Paperclip, Plus, X } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { FOLDER_IDS, createDocument, updateDocument } from "@/lib/documents";
import { ACCEPTED_FILE_TYPES, fileTooLargeMessage } from "@/lib/files";
import {
  PROPERTY_STATUS_LABEL,
  errorMessage,
  financialApi,
  isApiError,
  type FinancialMovement,
  type PropertyItem,
} from "@/lib/financial-api";
import { formatCurrency, formatMoneyInput, parseMoney, toCents, todayIso } from "@/lib/format";
import type { DocumentItem } from "@/lib/schemas";
import {
  EARLIEST_DATE,
  amountError,
  formatCnpj,
  formatCpf,
  isValidCnpj,
  isValidCpf,
  lengthError,
  pastDateError,
  personNameError,
} from "@/lib/validation";

type CommonProps = {
  properties: PropertyItem[];
  documents: DocumentItem[];
  onClose: () => void;
  onSaved: (movement: FinancialMovement, warning?: string) => void;
};

type ReceiptChoice = { mode: "none" } | { mode: "existing"; docId: string } | { mode: "upload"; file: File };

function ReceiptPicker({
  documents,
  value,
  onChange,
  error,
  label,
}: {
  documents: DocumentItem[];
  value: ReceiptChoice;
  onChange: (value: ReceiptChoice) => void;
  error?: string;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const available = documents.filter((doc) => doc.movementId === null);
  return (
    <fieldset className="ui-card" style={{ margin: 0, display: "grid", gap: 10, background: "var(--ui-surface-muted)" }}>
      <legend className="ui-label" style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 4px" }}>
        <Paperclip size={15} aria-hidden="true" /> {label} (opcional)
      </legend>
      <div className="ui-form-grid">
        <Field label="Documento já cadastrado">
          {(props) => (
            <select
              {...props}
              className="ui-input"
              value={value.mode === "existing" ? value.docId : ""}
              onChange={(e) => onChange(e.target.value ? { mode: "existing", docId: e.target.value } : { mode: "none" })}
            >
              <option value="">Nenhum</option>
              {available.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.protocol})
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Ou enviar novo arquivo" error={error} hint="PDF ou imagem, até 8 MB.">
          {(props) => (
            <input
              {...props}
              ref={inputRef}
              type="file"
              className="ui-input"
              accept={ACCEPTED_FILE_TYPES}
              onChange={(e) => {
                const file = e.target.files?.[0];
                onChange(file ? { mode: "upload", file } : { mode: "none" });
              }}
            />
          )}
        </Field>
      </div>
      {value.mode !== "none" ? (
        <button
          type="button"
          className="ui-link"
          style={{ justifySelf: "start" }}
          onClick={() => {
            if (inputRef.current) inputRef.current.value = "";
            onChange({ mode: "none" });
          }}
        >
          Remover vínculo
        </button>
      ) : null}
    </fieldset>
  );
}

async function linkReceipt(
  choice: ReceiptChoice,
  documents: DocumentItem[],
  movement: FinancialMovement,
  description: string,
  category: "Recibo" | "Comprovante"
) {
  if (choice.mode === "existing") {
    const doc = documents.find((item) => item.id === choice.docId);
    if (doc) await updateDocument({ ...doc, movementId: movement.id, description: doc.description || description });
  } else if (choice.mode === "upload") {
    await createDocument({
      name: choice.file.name,
      folderId: FOLDER_IDS.comprovantes,
      category,
      description,
      file: choice.file,
      movementId: movement.id,
    });
  }
}

function propertyLabel(property: PropertyItem) {
  return `${property.registrationCode} — ${property.address} (${PROPERTY_STATUS_LABEL[property.status]})`;
}

// ---------------------------------------------------------------- Entrada
type EntryErrors = Partial<Record<"tenantName" | "document" | "property" | "date" | "rent" | "charges" | "fines" | "receipt", string>>;

export function EntryModal({ properties, documents, onClose, onSaved }: CommonProps) {
  const [documentType, setDocumentType] = useState<"CPF" | "CNPJ">("CPF");
  const [tenantName, setTenantName] = useState("");
  const [document, setDocument] = useState("");
  const [property, setProperty] = useState("");
  const [date, setDate] = useState(todayIso());
  const [rent, setRent] = useState("");
  const [showCharges, setShowCharges] = useState(false);
  const [chargesDesc, setChargesDesc] = useState("");
  const [charges, setCharges] = useState("");
  const [showFines, setShowFines] = useState(false);
  const [finesDesc, setFinesDesc] = useState("");
  const [fines, setFines] = useState("");
  const [receipt, setReceipt] = useState<ReceiptChoice>({ mode: "none" });
  const [errors, setErrors] = useState<EntryErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showNet, setShowNet] = useState(false);

  const rentValue = parseMoney(rent);
  const chargesValue = showCharges ? parseMoney(charges) : 0;
  const finesValue = showFines ? parseMoney(fines) : 0;
  // Soma em centavos: evita 0,1 + 0,2 = 0,30000000000000004.
  const totalCents =
    (Number.isFinite(rentValue) ? toCents(rentValue) : 0) +
    (Number.isFinite(chargesValue) ? toCents(chargesValue) : 0) +
    (Number.isFinite(finesValue) ? toCents(finesValue) : 0);

  function selectProperty(code: string) {
    setProperty(code);
    const selected = properties.find((item) => item.registrationCode === code);
    if (selected?.currentTenant && !tenantName.trim()) setTenantName(selected.currentTenant);
    if (selected && !rent) setRent(formatMoneyInput(String(toCents(selected.monthlyRent))));
  }

  function changeDocumentType(type: "CPF" | "CNPJ") {
    setDocumentType(type);
    setDocument((current) => (type === "CPF" ? formatCpf(current) : formatCnpj(current)));
  }

  function reset() {
    setDocumentType("CPF");
    setTenantName("");
    setDocument("");
    setProperty("");
    setDate(todayIso());
    setRent("");
    setShowCharges(false);
    setChargesDesc("");
    setCharges("");
    setShowFines(false);
    setFinesDesc("");
    setFines("");
    setReceipt({ mode: "none" });
    setErrors({});
    setFormError("");
    setShowNet(false);
  }

  function validate(): EntryErrors {
    const found: EntryErrors = {};
    found.tenantName = personNameError(tenantName, "Nome do inquilino") ?? undefined;
    const validDoc = documentType === "CPF" ? isValidCpf(document) : isValidCnpj(document);
    if (!document.trim()) found.document = `Informe o ${documentType}.`;
    else if (!validDoc) found.document = `${documentType} inválido (confira os dígitos).`;
    if (!properties.some((item) => item.registrationCode === property)) found.property = "Selecione um imóvel cadastrado.";
    found.date = pastDateError(date, "Data da entrada") ?? undefined;
    found.rent = amountError(rentValue, { label: "Valor do aluguel" }) ?? undefined;
    if (showCharges) {
      found.charges =
        lengthError(chargesDesc, "a descrição do encargo", 1, 120) ??
        amountError(chargesValue, { label: "Encargo", max: rentValue || undefined }) ??
        undefined;
    }
    if (showFines) {
      found.fines =
        lengthError(finesDesc, "o motivo da multa", 1, 120) ??
        amountError(finesValue, { label: "Multa", max: rentValue || undefined }) ??
        undefined;
    }
    if (!found.rent && totalCents > 100_000_000) found.rent = "O total (aluguel + encargos + multas) passa de R$ 1.000.000,00.";
    if (receipt.mode === "upload") found.receipt = fileTooLargeMessage(receipt.file) ?? undefined;
    return found;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const found = validate();
    setErrors(found);
    setFormError("");
    if (Object.values(found).some(Boolean)) {
      setFormError("Corrija os campos destacados.");
      return;
    }

    setSaving(true);
    try {
      const movement = await financialApi.createIncome({
        documentType,
        tenantName: tenantName.trim().replace(/\s+/g, " "),
        documentNumber: document,
        propertyRegistration: property,
        transactionDate: date,
        grossAmount: totalCents / 100,
      });
      const details = [
        `Aluguel ${formatCurrency(rentValue)}`,
        showCharges ? `Encargo (${chargesDesc.trim()}) ${formatCurrency(chargesValue)}` : null,
        showFines ? `Multa (${finesDesc.trim()}) ${formatCurrency(finesValue)}` : null,
      ]
        .filter(Boolean)
        .join(" + ");
      let warning: string | undefined;
      try {
        await linkReceipt(receipt, documents, movement, `Entrada de ${movement.tenantName} (${property}): ${details}.`, "Recibo");
      } catch (error) {
        warning = `Entrada salva, mas o recibo não foi anexado: ${errorMessage(error)}`;
      }
      onSaved(movement, warning);
    } catch (error) {
      if (isApiError(error)) {
        const fe = error.fieldErrors;
        setErrors((current) => ({
          ...current,
          tenantName: fe.tenantName ?? current.tenantName,
          document: fe.documentNumber ?? current.document,
          property: fe.propertyRegistration ?? current.property,
          date: fe.transactionDate ?? current.date,
          rent: fe.grossAmount ?? current.rent,
        }));
      }
      setFormError(errorMessage(error));
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Registro de entrada"
      wide
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={reset} disabled={saving}>
            Limpar tudo
          </button>
          <button type="submit" form="entry-form" className="ui-btn ui-btn-primary" disabled={saving} aria-busy={saving}>
            {saving ? "Salvando..." : "Finalizar"}
          </button>
        </>
      }
    >
      <form id="entry-form" onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 14 }}>
        <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 10 }}>
          <legend className="ui-label" style={{ marginBottom: 6 }}>
            Inquilino
          </legend>
          <div role="radiogroup" aria-label="Tipo de documento" style={{ display: "flex", gap: 16 }}>
            {(["CPF", "CNPJ"] as const).map((type) => (
              <label key={type} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, minHeight: 24 }}>
                <input type="radio" name="documentType" checked={documentType === type} onChange={() => changeDocumentType(type)} />
                {type}
              </label>
            ))}
          </div>
          <div className="ui-form-grid">
            <Field label="Nome do inquilino" error={errors.tenantName} required>
              {(props) => (
                <input
                  {...props}
                  data-autofocus
                  className="ui-input"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  maxLength={160}
                  autoComplete="off"
                />
              )}
            </Field>
            <Field label={documentType} error={errors.document} required>
              {(props) => (
                <input
                  {...props}
                  className="ui-input"
                  inputMode="numeric"
                  placeholder={documentType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
                  value={document}
                  onChange={(e) => setDocument(documentType === "CPF" ? formatCpf(e.target.value) : formatCnpj(e.target.value))}
                />
              )}
            </Field>
          </div>
        </fieldset>

        <div className="ui-form-grid">
          <Field label="Imóvel" error={errors.property} required>
            {(props) => (
              <select {...props} className="ui-input" value={property} onChange={(e) => selectProperty(e.target.value)}>
                <option value="">Selecione o imóvel</option>
                {properties.map((item) => (
                  <option key={item.id} value={item.registrationCode}>
                    {propertyLabel(item)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Data da entrada" error={errors.date} required>
            {(props) => (
              <input
                {...props}
                type="date"
                className="ui-input"
                value={date}
                min={EARLIEST_DATE}
                max={todayIso()}
                onChange={(e) => setDate(e.target.value)}
              />
            )}
          </Field>
          <Field label="Valor do aluguel (total bruto)" error={errors.rent} required>
            {(props) => (
              <input
                {...props}
                className="ui-input"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={rent}
                onChange={(e) => setRent(formatMoneyInput(e.target.value))}
              />
            )}
          </Field>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => setShowCharges((v) => !v)} aria-expanded={showCharges}>
            {showCharges ? <X size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />} Encargos
          </button>
          <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => setShowFines((v) => !v)} aria-expanded={showFines}>
            {showFines ? <X size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />} Multas / juros
          </button>
        </div>

        {showCharges ? (
          <div className="ui-form-grid">
            <Field label="Encargo (IPTU, condomínio...)" error={errors.charges} required>
              {(props) => (
                <input {...props} className="ui-input" value={chargesDesc} onChange={(e) => setChargesDesc(e.target.value)} maxLength={120} />
              )}
            </Field>
            <Field label="Valor do encargo" required>
              {(props) => (
                <input {...props} className="ui-input" inputMode="numeric" placeholder="R$ 0,00" value={charges} onChange={(e) => setCharges(formatMoneyInput(e.target.value))} />
              )}
            </Field>
          </div>
        ) : null}

        {showFines ? (
          <div className="ui-form-grid">
            <Field label="Motivo da multa" error={errors.fines} required>
              {(props) => <input {...props} className="ui-input" value={finesDesc} onChange={(e) => setFinesDesc(e.target.value)} maxLength={120} />}
            </Field>
            <Field label="Valor da multa / juros" required>
              {(props) => (
                <input {...props} className="ui-input" inputMode="numeric" placeholder="R$ 0,00" value={fines} onChange={(e) => setFines(formatMoneyInput(e.target.value))} />
              )}
            </Field>
          </div>
        ) : null}

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setShowNet(true)}>
            Valor líquido
          </button>
          {showNet ? (
            <span aria-live="polite" style={{ fontSize: 15 }}>
              Total a registrar: <strong>{formatCurrency(totalCents / 100)}</strong>
            </span>
          ) : null}
        </div>

        <ReceiptPicker documents={documents} value={receipt} onChange={setReceipt} error={errors.receipt} label="Recibo / comprovante" />

        {formError ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {formError}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------- Saída
export const EXPENSE_CATEGORIES = [
  "Manutenção",
  "Reforma",
  "Serviços",
  "Impostos e taxas",
  "Insumos / DML",
  "Administrativo",
  "Outro",
] as const;

type ExpenseErrors = Partial<Record<"description" | "property" | "date" | "amount" | "retention" | "receipt", string>>;

export function ExpenseModal({ properties, documents, onClose, onSaved }: CommonProps) {
  const [category, setCategory] = useState<(typeof EXPENSE_CATEGORIES)[number]>("Manutenção");
  const [description, setDescription] = useState("");
  const [property, setProperty] = useState("");
  const [date, setDate] = useState(todayIso());
  const [amount, setAmount] = useState("");
  const [showRetention, setShowRetention] = useState(false);
  const [retention, setRetention] = useState("");
  const [receipt, setReceipt] = useState<ReceiptChoice>({ mode: "none" });
  const [errors, setErrors] = useState<ExpenseErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const amountValue = parseMoney(amount);
  const retentionValue = showRetention ? parseMoney(retention) : 0;
  const paidCents =
    (Number.isFinite(amountValue) ? toCents(amountValue) : 0) - (Number.isFinite(retentionValue) ? toCents(retentionValue) : 0);
  const propertyOptions = useMemo(() => properties.map((item) => ({ value: item.registrationCode, label: propertyLabel(item) })), [properties]);

  function validate(): ExpenseErrors {
    const found: ExpenseErrors = {};
    found.description = lengthError(description, "a descrição / prestador", 3, 140) ?? undefined;
    if (property !== "GERAL" && !properties.some((item) => item.registrationCode === property)) {
      found.property = "Selecione um imóvel ou “Despesa geral”.";
    }
    found.date = pastDateError(date, "Data da saída") ?? undefined;
    found.amount = amountError(amountValue, { label: "Valor" }) ?? undefined;
    if (showRetention) {
      found.retention = amountError(retentionValue, { label: "Retenção" }) ?? undefined;
      if (!found.retention && !found.amount && retentionValue >= amountValue) found.retention = "A retenção deve ser menor que o valor.";
    }
    if (receipt.mode === "upload") found.receipt = fileTooLargeMessage(receipt.file) ?? undefined;
    return found;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const found = validate();
    setErrors(found);
    setFormError("");
    if (Object.values(found).some(Boolean)) {
      setFormError("Corrija os campos destacados.");
      return;
    }
    setSaving(true);
    try {
      const movement = await financialApi.createExpense({
        description: `${category} · ${description.trim()}`.slice(0, 160),
        propertyRegistration: property,
        transactionDate: date,
        grossAmount: paidCents / 100,
      });
      let warning: string | undefined;
      try {
        await linkReceipt(receipt, documents, movement, `Saída: ${movement.tenantName} (${property}).`, "Comprovante");
      } catch (error) {
        warning = `Saída salva, mas o comprovante não foi anexado: ${errorMessage(error)}`;
      }
      onSaved(movement, warning);
    } catch (error) {
      if (isApiError(error)) {
        const fe = error.fieldErrors;
        setErrors((current) => ({
          ...current,
          description: fe.description ?? current.description,
          property: fe.propertyRegistration ?? current.property,
          date: fe.transactionDate ?? current.date,
          amount: fe.grossAmount ?? current.amount,
        }));
      }
      setFormError(errorMessage(error));
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Registro de saída"
      wide
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="expense-form" className="ui-btn ui-btn-primary" disabled={saving} aria-busy={saving}>
            {saving ? "Salvando..." : "Finalizar"}
          </button>
        </>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 14 }}>
        <div className="ui-form-grid">
          <Field label="Categoria">
            {(props) => (
              <select {...props} className="ui-input" value={category} onChange={(e) => setCategory(e.target.value as (typeof EXPENSE_CATEGORIES)[number])}>
                {EXPENSE_CATEGORIES.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Descrição / prestador" error={errors.description} required>
            {(props) => (
              <input
                {...props}
                data-autofocus
                className="ui-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Reparo hidráulico — Prestador Rocha"
                maxLength={140}
              />
            )}
          </Field>
          <Field label="Imóvel" error={errors.property} required>
            {(props) => (
              <select {...props} className="ui-input" value={property} onChange={(e) => setProperty(e.target.value)}>
                <option value="">Selecione</option>
                <option value="GERAL">Despesa geral da Fundação (sem imóvel)</option>
                {propertyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Data da saída" error={errors.date} required>
            {(props) => (
              <input {...props} type="date" className="ui-input" value={date} min={EARLIEST_DATE} max={todayIso()} onChange={(e) => setDate(e.target.value)} />
            )}
          </Field>
          <Field label="Valor" error={errors.amount} required>
            {(props) => (
              <input {...props} className="ui-input" inputMode="numeric" placeholder="R$ 0,00" value={amount} onChange={(e) => setAmount(formatMoneyInput(e.target.value))} />
            )}
          </Field>
        </div>

        <button
          type="button"
          className="ui-btn ui-btn-secondary ui-btn-sm"
          style={{ justifySelf: "start" }}
          onClick={() => setShowRetention((v) => !v)}
          aria-expanded={showRetention}
        >
          {showRetention ? <X size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />} Retenção de impostos
        </button>
        {showRetention ? (
          <Field label="Valor retido" error={errors.retention} hint="É descontado do valor registrado como saída.">
            {(props) => (
              <input {...props} className="ui-input" inputMode="numeric" placeholder="R$ 0,00" value={retention} onChange={(e) => setRetention(formatMoneyInput(e.target.value))} />
            )}
          </Field>
        ) : null}

        <p style={{ margin: 0, fontSize: 14 }} aria-live="polite">
          Valor a registrar: <strong>{formatCurrency(Math.max(paidCents, 0) / 100)}</strong>
        </p>

        <ReceiptPicker documents={documents} value={receipt} onChange={setReceipt} error={errors.receipt} label="Nota fiscal / comprovante" />

        {formError ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {formError}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
