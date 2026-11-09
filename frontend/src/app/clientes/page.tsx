"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, FilePlus2, Paperclip, Pencil, Plus, RefreshCw, Trash2, UserCheck, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { FOLDER_IDS, createDocument, documentHref } from "@/lib/documents";
import { ACCEPTED_FILE_TYPES } from "@/lib/files";
import { errorMessage, notifyFinanceChanged, propertiesApi, type PropertyItem } from "@/lib/financial-api";
import { daysUntil, formatCurrency, formatDate, formatMoneyInput, isValidIsoDate, newId, normalizeText, parseMoney, toCents, todayIso } from "@/lib/format";
import { useCan } from "@/lib/permissions";
import { useRecords } from "@/lib/records";
import { clientSchema, documentSchema, type Client } from "@/lib/schemas";
import {
  amountError,
  formatCnpj,
  formatCpf,
  formatPhone,
  isValidCnpj,
  isValidCpf,
  isValidEmail,
  isValidPhone,
  lengthError,
  personNameError,
} from "@/lib/validation";

type DisplayStatus = "Ativo" | "Próximo ao Vencimento" | "Renovado" | "Em Análise" | "Encerrado";

/** A situação mostrada vem das datas: um contrato não fica "Ativo" depois de vencer. */
function displayStatus(client: Client): DisplayStatus {
  const days = daysUntil(client.contractEndDate);
  if (client.contractStatus === "Encerrado" || days < 0) return "Encerrado";
  if (days <= 30) return "Próximo ao Vencimento";
  return client.contractStatus;
}

const STATUS_BADGE: Record<DisplayStatus, string> = {
  Ativo: "ui-badge-success",
  Renovado: "ui-badge-success",
  "Próximo ao Vencimento": "ui-badge-warning",
  "Em Análise": "ui-badge-info",
  Encerrado: "ui-badge-neutral",
};

function addMonthsIso(iso: string, months: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1 + months, d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function ClientesPage() {
  const clientsStore = useRecords("clients", clientSchema);
  const { items: documents } = useRecords("documents", documentSchema);
  const clients = clientsStore.items;
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | "TODOS">("TODOS");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<Client | "new" | null>(null);
  const [renewing, setRenewing] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);
  const [uploading, setUploading] = useState(false);
  const { show, node: toast } = useToast();
  const canEdit = useCan("edit");
  const canDelete = useCan("delete");
  const selected = clients.find((client) => client.id === selectedId) ?? null;

  useEffect(() => {
    propertiesApi
      .list()
      .then(setProperties)
      .catch(() => setProperties([]));
    const id = new URLSearchParams(window.location.search).get("cliente");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- parâmetro só existe no navegador
    if (id) setSelectedId(id);
  }, []);

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    return clients
      .filter((client) => {
        if (statusFilter !== "TODOS" && displayStatus(client) !== statusFilter) return false;
        if (!term) return true;
        return normalizeText(`${client.name} ${client.cpf} ${client.propertyCode} ${client.propertyAddress} ${client.guarantorName}`).includes(term);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, search, statusFilter]);

  const expiring = clients
    .filter((client) => displayStatus(client) === "Próximo ao Vencimento")
    .sort((a, b) => a.contractEndDate.localeCompare(b.contractEndDate));

  const counts = {
    total: clients.length,
    active: clients.filter((client) => ["Ativo", "Renovado"].includes(displayStatus(client))).length,
    expiring: expiring.length,
    ended: clients.filter((client) => displayStatus(client) === "Encerrado").length,
  };

  async function confirmRenew() {
    if (!renewing) return;
    const start = renewing.contractEndDate < todayIso() ? todayIso() : renewing.contractEndDate;
    await clientsStore.save({ ...renewing, contractStatus: "Renovado", contractStartDate: start, contractEndDate: addMonthsIso(start, 12), updatedAt: new Date().toISOString() });
    show(`Contrato de ${renewing.name} renovado até ${formatDate(addMonthsIso(start, 12))}.`);
    setRenewing(null);
  }

  async function confirmDelete() {
    if (!deleting) return;
    await clientsStore.remove(deleting.id);
    show(`Cliente ${deleting.name} removido. Os documentos continuam em Documentos.`);
    setSelectedId(null);
    setDeleting(null);
  }

  async function attachDocument(client: Client, file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const doc = await createDocument({
        name: file.name,
        folderId: FOLDER_IDS.clientes,
        category: "Documento Pessoal",
        description: `Documento de ${client.name}.`,
        file,
        clientId: client.id,
      });
      await clientsStore.save({ ...client, documents: [...client.documents, { id: doc.id, name: doc.name, category: doc.category }] });
      show("Documento anexado ao cliente.");
    } catch (error) {
      show(errorMessage(error, "Não foi possível anexar o documento."), "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <AppShell>
      <section className="ui-page" aria-labelledby="clientes-title">
        <div className="ui-page-header">
          <div>
            <h1 id="clientes-title">Clientes</h1>
            <p>Inquilinos, fiadores, imóveis alugados e contratos.</p>
          </div>
          {canEdit ? (
            <button type="button" className="ui-btn ui-btn-primary" onClick={() => setFormTarget("new")}>
              <Plus size={18} aria-hidden="true" /> Novo inquilino / contrato
            </button>
          ) : null}
        </div>

        <div className="ui-stat-grid">
          {[
            { label: "Clientes cadastrados", value: counts.total, icon: Users, bg: "#e0e7ff", color: "#092a54" },
            { label: "Contratos em vigor", value: counts.active, icon: UserCheck, bg: "#dcfce7", color: "#15803d" },
            { label: "Vencendo em 30 dias", value: counts.expiring, icon: AlertTriangle, bg: "#fef3c7", color: "#a16207" },
            { label: "Contratos encerrados", value: counts.ended, icon: RefreshCw, bg: "#f1f5f9", color: "#475569" },
          ].map(({ label, value, icon: Icon, bg, color }) => (
            <div key={label} className="ui-card ui-stat">
              <span className="ui-stat-icon" style={{ background: bg, color }} aria-hidden="true">
                <Icon size={22} />
              </span>
              <div>
                <div className="ui-stat-label">{label}</div>
                <div className="ui-stat-value">{clientsStore.loading ? "…" : value}</div>
              </div>
            </div>
          ))}
        </div>

        {expiring.length > 0 ? (
          <div className="ui-card" style={{ borderColor: "#fcd34d", background: "#fffbeb" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 16, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={18} aria-hidden="true" /> Contratos próximos ao vencimento
            </h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {expiring.map((client) => (
                <li key={client.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>
                    <strong>{client.name}</strong> — {client.propertyCode}, vence em {formatDate(client.contractEndDate)} ({daysUntil(client.contractEndDate)} dia(s))
                  </span>
                  <span className="ui-row-actions">
                    <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => setSelectedId(client.id)}>
                      Ver detalhes
                    </button>
                    {canEdit ? (
                      <button type="button" className="ui-btn ui-btn-primary ui-btn-sm" onClick={() => setRenewing(client)}>
                        Renovar
                      </button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="ui-toolbar">
          <div className="ui-field" style={{ flex: "3 1 240px" }}>
            <label htmlFor="cli-busca">Buscar</label>
            <input id="cli-busca" className="ui-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Inquilino, CPF/CNPJ, imóvel ou fiador" />
          </div>
          <div className="ui-field">
            <label htmlFor="cli-status">Situação do contrato</label>
            <select id="cli-status" className="ui-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as DisplayStatus | "TODOS")}>
              <option value="TODOS">Todos</option>
              {(["Ativo", "Renovado", "Próximo ao Vencimento", "Em Análise", "Encerrado"] as const).map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>

        {clientsStore.error ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {clientsStore.error}{" "}
            <button type="button" className="ui-link" onClick={() => void clientsStore.reload()}>
              Tentar de novo
            </button>
          </p>
        ) : null}

        <div className="ui-table-wrap">
          <table className="ui-table">
            <caption className="sr-only">Clientes e contratos</caption>
            <thead>
              <tr>
                <th scope="col">Inquilino</th>
                <th scope="col">Imóvel</th>
                <th scope="col">Fiador</th>
                <th scope="col">Aluguel</th>
                <th scope="col">Situação</th>
                <th scope="col">Vencimento</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientsStore.loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="ui-skeleton" style={{ height: 24 }} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="ui-empty">
                    {clients.length === 0 ? "Nenhum cliente cadastrado ainda." : "Nenhum cliente encontrado com esses filtros."}
                  </td>
                </tr>
              ) : (
                filtered.map((client) => {
                  const status = displayStatus(client);
                  return (
                    <tr key={client.id}>
                      <td>
                        <strong>{client.name}</strong>
                        <div className="ui-field-hint">{client.cpf}</div>
                      </td>
                      <td>
                        <strong>{client.propertyCode}</strong>
                        <div className="ui-field-hint">{client.propertyAddress}</div>
                      </td>
                      <td>
                        {client.guarantorName}
                        <div className="ui-field-hint">{client.guarantorRelationship}</div>
                      </td>
                      <td>{formatCurrency(client.monthlyRent)}</td>
                      <td>
                        <span className={`ui-badge ${STATUS_BADGE[status]}`}>{status}</span>
                      </td>
                      <td>{formatDate(client.contractEndDate)}</td>
                      <td>
                        <div className="ui-row-actions">
                          <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => setSelectedId(client.id)}>
                            Ver detalhes
                          </button>
                          {canEdit ? (
                            <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => setFormTarget(client)} aria-label={`Editar ${client.name}`}>
                              <Pencil size={14} aria-hidden="true" /> Editar
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && !formTarget && !renewing && !deleting ? (
        <Modal
          title={selected.name}
          wide
          onClose={() => setSelectedId(null)}
          busy={uploading}
          footer={
            <>
              {canDelete ? (
                <button type="button" className="ui-btn ui-btn-secondary" style={{ color: "var(--ui-danger)" }} onClick={() => setDeleting(selected)}>
                  <Trash2 size={16} aria-hidden="true" /> Excluir cliente
                </button>
              ) : null}
              <Link href={`/documentos?novo=recibo&cliente=${selected.id}`} className="ui-btn ui-btn-secondary">
                <FilePlus2 size={16} aria-hidden="true" /> Emitir recibo
              </Link>
              <Link href={`/documentos?novo=contrato&cliente=${selected.id}`} className="ui-btn ui-btn-secondary">
                <FilePlus2 size={16} aria-hidden="true" /> Gerar contrato
              </Link>
              {canEdit && displayStatus(selected) !== "Ativo" && displayStatus(selected) !== "Renovado" ? (
                <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setRenewing(selected)}>
                  <RefreshCw size={16} aria-hidden="true" /> Renovar 12 meses
                </button>
              ) : null}
              {canEdit ? (
                <button type="button" className="ui-btn ui-btn-primary" onClick={() => setFormTarget(selected)}>
                  <Pencil size={16} aria-hidden="true" /> Editar dados
                </button>
              ) : null}
            </>
          }
        >
          <ClientDetails client={selected} />
          <section>
            <h3 style={{ fontSize: 15, margin: "4px 0 8px", color: "var(--ui-primary)" }}>Documentos anexados</h3>
            {selected.documents.length === 0 ? (
              <p className="ui-field-hint">Nenhum documento anexado.</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
                {selected.documents.map((ref) => {
                  const exists = documents.some((doc) => doc.id === ref.id);
                  return (
                    <li key={ref.id} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, fontSize: 14 }}>
                      <span>
                        {ref.name} <span className="ui-field-hint">({ref.category})</span>
                      </span>
                      {exists ? (
                        <Link href={documentHref(ref.id)} className="ui-link">
                          <ExternalLink size={13} aria-hidden="true" /> Abrir em Documentos
                        </Link>
                      ) : (
                        <span className="ui-field-hint">Documento excluído de Documentos</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {canEdit ? (
              <label className="ui-btn ui-btn-secondary ui-btn-sm" style={{ marginTop: 10, cursor: "pointer" }}>
                <Paperclip size={14} aria-hidden="true" /> {uploading ? "Enviando..." : "Anexar documento"}
                <input type="file" className="sr-only" accept={ACCEPTED_FILE_TYPES} disabled={uploading} onChange={(e) => void attachDocument(selected, e.target.files?.[0])} />
              </label>
            ) : null}
          </section>
        </Modal>
      ) : null}

      {formTarget ? (
        <ClientFormModal
          client={formTarget === "new" ? null : formTarget}
          properties={properties}
          clients={clients}
          onClose={() => setFormTarget(null)}
          onSave={async (client, occupyProperty) => {
            await clientsStore.save(client);
            let warning = "";
            if (occupyProperty) {
              const property = properties.find((item) => item.registrationCode === client.propertyCode);
              if (property) {
                try {
                  const updated = await propertiesApi.update(property.id, {
                    address: property.address,
                    currentTenant: client.name,
                    monthlyRent: client.monthlyRent,
                    status: "OCUPADO",
                    notes: property.notes,
                  });
                  setProperties((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                  notifyFinanceChanged();
                } catch (error) {
                  warning = ` (imóvel não atualizado: ${errorMessage(error)})`;
                }
              }
            }
            setFormTarget(null);
            show((formTarget === "new" ? "Cliente cadastrado." : "Dados do cliente atualizados.") + warning, warning ? "error" : "success");
          }}
        />
      ) : null}

      {renewing ? (
        <ConfirmDialog
          title="Renovar contrato"
          confirmLabel="Renovar por 12 meses"
          message={
            <>
              Renovar o contrato de <strong>{renewing.name}</strong> ({renewing.propertyCode}) por mais 12 meses a partir de{" "}
              {formatDate(renewing.contractEndDate < todayIso() ? todayIso() : renewing.contractEndDate)}?
            </>
          }
          onConfirm={confirmRenew}
          onCancel={() => setRenewing(null)}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Excluir cliente"
          danger
          confirmLabel="Excluir"
          message={
            <>
              Excluir <strong>{deleting.name}</strong> da lista de clientes? Os documentos dele continuam em Documentos.
            </>
          }
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
      {toast}
    </AppShell>
  );
}

function ClientDetails({ client }: { client: Client }) {
  const sections: { title: string; rows: [string, string][] }[] = [
    {
      title: "Inquilino",
      rows: [
        ["CPF/CNPJ", client.cpf],
        ["Nascimento", client.birthDate ? formatDate(client.birthDate) : "—"],
        ["Telefone", client.phone],
        ["E-mail", client.email],
        ["Pessoas no imóvel", String(client.residentsCount)],
        ["Profissão / atividade", client.profession],
        ["Bens / garantia de renda", client.assetsDeclared],
      ],
    },
    {
      title: "Imóvel e contrato",
      rows: [
        ["Imóvel", `${client.propertyCode} — ${client.propertyAddress}`],
        ["Aluguel", formatCurrency(client.monthlyRent)],
        ["Início", formatDate(client.contractStartDate)],
        ["Vencimento", formatDate(client.contractEndDate)],
        ["Situação", displayStatus(client)],
      ],
    },
    {
      title: "Fiador",
      rows: [
        ["Nome", client.guarantorName],
        ["CPF", client.guarantorCpf],
        ["Vínculo", client.guarantorRelationship],
        ["Telefone", client.guarantorPhone],
        ["Bens", client.guarantorAssets],
      ],
    },
  ];
  return (
    <>
      {sections.map((section) => (
        <section key={section.title}>
          <h3 style={{ fontSize: 15, margin: "4px 0 8px", color: "var(--ui-primary)" }}>{section.title}</h3>
          <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, margin: 0 }}>
            {section.rows.map(([label, value]) => (
              <div key={label} style={{ background: "var(--ui-surface-muted)", padding: "6px 10px", borderRadius: 8 }}>
                <dt style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>{label}</dt>
                <dd style={{ margin: 0, fontSize: 14, fontWeight: 600, wordBreak: "break-word" }}>{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </>
  );
}

type FormState = {
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  residentsCount: string;
  profession: string;
  assetsDeclared: string;
  propertyCode: string;
  monthlyRent: string;
  contractStartDate: string;
  contractEndDate: string;
  inAnalysis: boolean;
  guarantorName: string;
  guarantorCpf: string;
  guarantorRelationship: string;
  guarantorPhone: string;
  guarantorAssets: string;
};

function toForm(client: Client | null): FormState {
  const start = todayIso();
  return {
    name: client?.name ?? "",
    cpf: client?.cpf ?? "",
    birthDate: client?.birthDate ?? "",
    phone: client?.phone ?? "",
    email: client?.email ?? "",
    residentsCount: client ? String(client.residentsCount) : "1",
    profession: client?.profession ?? "",
    assetsDeclared: client?.assetsDeclared ?? "",
    propertyCode: client?.propertyCode ?? "",
    monthlyRent: client ? formatMoneyInput(String(toCents(client.monthlyRent))) : "",
    contractStartDate: client?.contractStartDate ?? start,
    contractEndDate: client?.contractEndDate ?? addMonthsIso(start, 12),
    inAnalysis: client?.contractStatus === "Em Análise",
    guarantorName: client?.guarantorName ?? "",
    guarantorCpf: client?.guarantorCpf ?? "",
    guarantorRelationship: client?.guarantorRelationship ?? "",
    guarantorPhone: client?.guarantorPhone ?? "",
    guarantorAssets: client?.guarantorAssets ?? "",
  };
}

function ClientFormModal({
  client,
  properties,
  clients,
  onClose,
  onSave,
}: {
  client: Client | null;
  properties: PropertyItem[];
  clients: Client[];
  onClose: () => void;
  onSave: (client: Client, occupyProperty: boolean) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(() => toForm(client));
  const [occupy, setOccupy] = useState(client === null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const digits = form.cpf.replace(/\D/g, "");
  const isCompany = digits.length > 11;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectProperty(code: string) {
    const property = properties.find((item) => item.registrationCode === code);
    setForm((current) => ({
      ...current,
      propertyCode: code,
      monthlyRent: property && !current.monthlyRent ? formatMoneyInput(String(toCents(property.monthlyRent))) : current.monthlyRent,
    }));
  }

  function validate() {
    const found: Partial<Record<keyof FormState, string>> = {};
    found.name = personNameError(form.name, "Nome") ?? undefined;
    if (!(digits.length === 11 ? isValidCpf(digits) : digits.length === 14 ? isValidCnpj(digits) : false)) found.cpf = "CPF ou CNPJ inválido.";
    else if (clients.some((other) => other.id !== client?.id && other.cpf.replace(/\D/g, "") === digits && other.propertyCode === form.propertyCode)) {
      found.cpf = "Este CPF/CNPJ já tem contrato neste imóvel.";
    }
    if (form.birthDate) {
      if (!isValidIsoDate(form.birthDate) || form.birthDate > todayIso()) found.birthDate = "Data de nascimento inválida.";
      else if (!isCompany && form.birthDate > addMonthsIso(todayIso(), -12 * 18)) found.birthDate = "O inquilino precisa ter 18 anos ou mais.";
      else if (form.birthDate < "1900-01-01") found.birthDate = "Data de nascimento inválida.";
    }
    if (!isValidPhone(form.phone)) found.phone = "Telefone com DDD (10 ou 11 dígitos).";
    if (!isValidEmail(form.email)) found.email = "E-mail inválido.";
    const residents = Number(form.residentsCount);
    if (!/^\d{1,2}$/.test(form.residentsCount) || residents > 30) found.residentsCount = "Informe de 0 a 30.";
    found.profession = lengthError(form.profession, "a profissão / atividade", 2, 120) ?? undefined;
    found.assetsDeclared = lengthError(form.assetsDeclared, "os bens / garantia de renda", 3, 300) ?? undefined;
    if (!properties.some((item) => item.registrationCode === form.propertyCode)) found.propertyCode = "Selecione um imóvel cadastrado.";
    found.monthlyRent = amountError(parseMoney(form.monthlyRent), { label: "Aluguel" }) ?? undefined;
    if (!isValidIsoDate(form.contractStartDate)) found.contractStartDate = "Data inválida.";
    if (!isValidIsoDate(form.contractEndDate)) found.contractEndDate = "Data inválida.";
    else if (form.contractEndDate <= form.contractStartDate) found.contractEndDate = "O vencimento deve ser depois do início.";
    else if (form.contractEndDate > addMonthsIso(form.contractStartDate, 120)) found.contractEndDate = "Prazo máximo de 10 anos.";
    found.guarantorName = lengthError(form.guarantorName, "o fiador (ou “Seguro fiança” / “Caução”)", 3, 160) ?? undefined;
    const gDigits = form.guarantorCpf.replace(/\D/g, "");
    if (gDigits && !isValidCpf(gDigits) && !isValidCnpj(gDigits)) found.guarantorCpf = "CPF/CNPJ do fiador inválido.";
    else if (gDigits && gDigits === digits) found.guarantorCpf = "O fiador não pode ser o próprio inquilino.";
    if (form.guarantorPhone && !isValidPhone(form.guarantorPhone)) found.guarantorPhone = "Telefone com DDD.";
    return found;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      setFormError("Corrija os campos destacados.");
      return;
    }
    const property = properties.find((item) => item.registrationCode === form.propertyCode);
    const saved: Client = {
      id: client?.id ?? newId("cli"),
      name: form.name.trim().replace(/\s+/g, " "),
      cpf: isCompany ? formatCnpj(digits) : formatCpf(digits),
      birthDate: form.birthDate || null,
      phone: formatPhone(form.phone),
      email: form.email.trim().toLowerCase(),
      residentsCount: Number(form.residentsCount),
      profession: form.profession.trim(),
      assetsDeclared: form.assetsDeclared.trim(),
      propertyCode: form.propertyCode,
      propertyAddress: property?.address ?? client?.propertyAddress ?? "",
      monthlyRent: toCents(parseMoney(form.monthlyRent)) / 100,
      contractStatus: form.inAnalysis ? "Em Análise" : client?.contractStatus === "Renovado" ? "Renovado" : "Ativo",
      contractStartDate: form.contractStartDate,
      contractEndDate: form.contractEndDate,
      guarantorName: form.guarantorName.trim(),
      guarantorCpf: form.guarantorCpf.replace(/\D/g, "") ? (form.guarantorCpf.replace(/\D/g, "").length > 11 ? formatCnpj(form.guarantorCpf) : formatCpf(form.guarantorCpf)) : "-",
      guarantorRelationship: form.guarantorRelationship.trim() || "—",
      guarantorPhone: form.guarantorPhone ? formatPhone(form.guarantorPhone) : "—",
      guarantorAssets: form.guarantorAssets.trim() || "—",
      documents: client?.documents ?? [],
      updatedAt: new Date().toISOString(),
    };
    setSaving(true);
    setFormError("");
    try {
      await onSave(saved, occupy);
    } catch (error) {
      setFormError(errorMessage(error));
      setSaving(false);
    }
  }

  const text = (key: keyof FormState, label: string, props: { required?: boolean; max?: number; format?: (v: string) => string; hint?: string; type?: string; inputMode?: "numeric" | "email" | "tel" } = {}) => (
    <Field label={label} error={errors[key]} required={props.required} hint={props.hint}>
      {(fieldProps) => (
        <input
          {...fieldProps}
          className="ui-input"
          type={props.type ?? "text"}
          inputMode={props.inputMode}
          value={String(form[key])}
          maxLength={props.max}
          onChange={(e) => set(key, (props.format ? props.format(e.target.value) : e.target.value) as never)}
        />
      )}
    </Field>
  );

  return (
    <Modal
      title={client ? `Editar ${client.name}` : "Novo inquilino / contrato"}
      wide
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="client-form" className="ui-btn ui-btn-primary" disabled={saving} aria-busy={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <form id="client-form" onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 14 }}>
        <h3 style={{ margin: 0, fontSize: 15, color: "var(--ui-primary)" }}>Inquilino</h3>
        <div className="ui-form-grid">
          {text("name", "Nome completo / razão social", { required: true, max: 160 })}
          {text("cpf", "CPF ou CNPJ", { required: true, inputMode: "numeric", format: (v) => (v.replace(/\D/g, "").length > 11 ? formatCnpj(v) : formatCpf(v)) })}
          {text("birthDate", "Data de nascimento", { type: "date", hint: "Opcional; obrigatório ter 18+ se informado." })}
          {text("phone", "Telefone", { required: true, inputMode: "tel", format: formatPhone })}
          {text("email", "E-mail", { required: true, inputMode: "email", max: 160 })}
          {text("residentsCount", "Pessoas no imóvel", { required: true, inputMode: "numeric", format: (v) => v.replace(/\D/g, "").slice(0, 2) })}
          {text("profession", "Profissão / atividade", { required: true, max: 120 })}
          {text("assetsDeclared", "Bens / garantia de renda", { required: true, max: 300 })}
        </div>

        <h3 style={{ margin: "6px 0 0", fontSize: 15, color: "var(--ui-primary)" }}>Imóvel e contrato</h3>
        <div className="ui-form-grid">
          <Field label="Imóvel" error={errors.propertyCode} required>
            {(props) => (
              <select {...props} className="ui-input" value={form.propertyCode} onChange={(e) => selectProperty(e.target.value)}>
                <option value="">Selecione</option>
                {properties.map((item) => (
                  <option key={item.id} value={item.registrationCode}>
                    {item.registrationCode} — {item.address} ({item.status === "DISPONIVEL" ? "disponível" : item.status === "OCUPADO" ? "ocupado" : "manutenção"})
                  </option>
                ))}
              </select>
            )}
          </Field>
          {text("monthlyRent", "Aluguel mensal", { required: true, inputMode: "numeric", format: formatMoneyInput })}
          {text("contractStartDate", "Início do contrato", { required: true, type: "date" })}
          {text("contractEndDate", "Vencimento do contrato", { required: true, type: "date" })}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, minHeight: 24 }}>
          <input type="checkbox" checked={form.inAnalysis} onChange={(e) => set("inAnalysis", e.target.checked)} /> Contrato em análise (ainda não assinado)
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, minHeight: 24 }}>
          <input type="checkbox" checked={occupy} onChange={(e) => setOccupy(e.target.checked)} /> Marcar o imóvel como ocupado por este inquilino
        </label>

        <h3 style={{ margin: "6px 0 0", fontSize: 15, color: "var(--ui-primary)" }}>Fiador</h3>
        <div className="ui-form-grid">
          {text("guarantorName", "Nome do fiador (ou Seguro fiança / Caução)", { required: true, max: 160 })}
          {text("guarantorCpf", "CPF/CNPJ do fiador", { inputMode: "numeric", format: (v) => (v.replace(/\D/g, "").length > 11 ? formatCnpj(v) : formatCpf(v)) })}
          {text("guarantorRelationship", "Vínculo", { max: 60 })}
          {text("guarantorPhone", "Telefone do fiador", { inputMode: "tel", format: formatPhone })}
        </div>
        {text("guarantorAssets", "Bens do fiador", { max: 300 })}

        {formError ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {formError}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

