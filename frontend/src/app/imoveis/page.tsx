"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Building2, Eye, House, KeyRound, Pencil, Plus, Wrench } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  PROPERTY_STATUSES,
  PROPERTY_STATUS_LABEL,
  errorMessage,
  financialApi,
  isApiError,
  notifyFinanceChanged,
  propertiesApi,
  type FinancialMovement,
  type PropertyItem,
  type PropertyMetrics,
  type PropertyRequest,
  type PropertyStatus,
} from "@/lib/financial-api";
import { formatCurrency, formatDate, formatDateTime, formatMoneyInput, normalizeText, parseMoney, toCents } from "@/lib/format";
import { useCan } from "@/lib/permissions";
import { rowClickHandler } from "@/lib/row-click";
import { useRecords } from "@/lib/records";
import { clientSchema } from "@/lib/schemas";
import { amountError, lengthError, personNameError } from "@/lib/validation";

const STATUS_BADGE: Record<PropertyStatus, string> = {
  OCUPADO: "ui-badge-success",
  DISPONIVEL: "ui-badge-warning",
  MANUTENCAO: "ui-badge-danger",
};

const PRICE_RANGES = [
  { value: "ALL", label: "Todos os valores", test: () => true },
  { value: "LT2000", label: "Até R$ 2.000", test: (v: number) => v <= 2000 },
  { value: "2000-4000", label: "R$ 2.000 a R$ 4.000", test: (v: number) => v > 2000 && v <= 4000 },
  { value: "GT4000", label: "Acima de R$ 4.000", test: (v: number) => v > 4000 },
] as const;

export default function ImoveisPage() {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [metrics, setMetrics] = useState<PropertyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PropertyStatus | "ALL">("ALL");
  const [price, setPrice] = useState<(typeof PRICE_RANGES)[number]["value"]>("ALL");
  const [editing, setEditing] = useState<PropertyItem | "new" | null>(null);
  const [details, setDetails] = useState<PropertyItem | null>(null);
  const { show, node: toast } = useToast();
  const canEdit = useCan("edit");

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const [list, metricData] = await Promise.all([propertiesApi.list(), propertiesApi.metrics()]);
      setProperties(list);
      setMetrics(metricData);
    } catch (error) {
      setLoadError(errorMessage(error, "Não foi possível carregar os imóveis."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial vinda da API
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    const range = PRICE_RANGES.find((item) => item.value === price) ?? PRICE_RANGES[0];
    return properties.filter((item) => {
      if (status !== "ALL" && item.status !== status) return false;
      if (!range.test(item.monthlyRent)) return false;
      if (!term) return true;
      return normalizeText(`${item.registrationCode} ${item.address} ${item.currentTenant ?? ""}`).includes(term);
    });
  }, [properties, search, status, price]);

  function handleSaved(property: PropertyItem, created: boolean) {
    setProperties((current) => (created ? [...current, property] : current.map((item) => (item.id === property.id ? property : item))));
    setEditing(null);
    setDetails((current) => (current?.id === property.id ? property : current));
    show(created ? `Imóvel ${property.registrationCode} cadastrado.` : `Imóvel ${property.registrationCode} atualizado.`);
    notifyFinanceChanged();
    void load();
  }

  const cards = [
    { label: "Total de imóveis", value: metrics?.totalProperties, icon: Building2, bg: "#e2e8f0", color: "#334155" },
    { label: "Ocupados", value: metrics?.occupied, icon: KeyRound, bg: "#fee2e2", color: "#b91c1c" },
    { label: "Disponíveis", value: metrics?.available, icon: House, bg: "#dcfce7", color: "#15803d" },
    { label: "Manutenções", value: metrics?.underMaintenance, icon: Wrench, bg: "#fef3c7", color: "#a16207" },
  ];

  return (
    <AppShell>
      <section className="ui-page" aria-labelledby="imoveis-title">
        <div className="ui-page-header">
          <div>
            <h1 id="imoveis-title">Imóveis cadastrados</h1>
            <p>Situação de cada imóvel da Fundação: ocupado, disponível ou em manutenção.</p>
          </div>
          {canEdit ? (
            <button type="button" className="ui-btn ui-btn-primary" onClick={() => setEditing("new")}>
              <Plus size={18} aria-hidden="true" /> Adicionar imóvel
            </button>
          ) : null}
        </div>

        <div className="ui-stat-grid" aria-busy={loading}>
          {cards.map(({ label, value, icon: Icon, bg, color }) => (
            <div key={label} className="ui-card ui-stat">
              <span className="ui-stat-icon" style={{ background: bg, color }} aria-hidden="true">
                <Icon size={22} />
              </span>
              <div>
                <div className="ui-stat-label">{label}</div>
                <div className="ui-stat-value">{loading ? "…" : (value ?? "—")}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="ui-toolbar">
          <div className="ui-field" style={{ flex: "2 1 240px" }}>
            <label htmlFor="imovel-busca">Buscar imóvel</label>
            <input
              id="imovel-busca"
              className="ui-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Código, endereço ou inquilino"
            />
          </div>
          <div className="ui-field">
            <label htmlFor="imovel-situacao">Situação</label>
            <select id="imovel-situacao" className="ui-input" value={status} onChange={(e) => setStatus(e.target.value as PropertyStatus | "ALL")}>
              <option value="ALL">Todas</option>
              {PROPERTY_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {PROPERTY_STATUS_LABEL[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="ui-field">
            <label htmlFor="imovel-valor">Valor do aluguel</label>
            <select id="imovel-valor" className="ui-input" value={price} onChange={(e) => setPrice(e.target.value as (typeof PRICE_RANGES)[number]["value"])}>
              {PRICE_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadError ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {loadError}{" "}
            <button type="button" className="ui-link" onClick={() => void load()}>
              Tentar de novo
            </button>
          </p>
        ) : null}

        <div className="ui-table-wrap">
          <table className="ui-table">
            <caption className="sr-only">Lista de imóveis</caption>
            <thead>
              <tr>
                <th scope="col">Imóvel</th>
                <th scope="col">Endereço</th>
                <th scope="col">Situação</th>
                <th scope="col">Inquilino</th>
                <th scope="col">Aluguel</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [0, 1, 2].map((row) => (
                  <tr key={row}>
                    <td colSpan={6}>
                      <div className="ui-skeleton" style={{ height: 22 }} />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ui-empty">
                    {properties.length === 0 ? "Nenhum imóvel cadastrado ainda." : "Nenhum imóvel corresponde aos filtros."}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="ui-row-clickable" onClick={rowClickHandler(() => setDetails(item))}>
                    <td>
                      <strong>{item.registrationCode}</strong>
                    </td>
                    <td>{item.address}</td>
                    <td>
                      <span className={`ui-badge ${STATUS_BADGE[item.status]}`}>{PROPERTY_STATUS_LABEL[item.status]}</span>
                    </td>
                    <td>{item.currentTenant ?? "—"}</td>
                    <td>{formatCurrency(item.monthlyRent)}</td>
                    <td>
                      <div className="ui-row-actions">
                        <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => setDetails(item)}>
                          <Eye size={14} aria-hidden="true" /> Ver
                        </button>
                        {canEdit ? (
                          <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => setEditing(item)}>
                            <Pencil size={14} aria-hidden="true" /> Alterar situação
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editing ? (
        <PropertyFormModal property={editing === "new" ? null : editing} existing={properties} onClose={() => setEditing(null)} onSaved={handleSaved} />
      ) : null}
      {details && !editing ? (
        <PropertyDetailsModal property={details} onClose={() => setDetails(null)} onEdit={canEdit ? () => setEditing(details) : undefined} />
      ) : null}
      {toast}
    </AppShell>
  );
}

type FormErrors = Partial<Record<"code" | "address" | "tenant" | "rent" | "notes", string>>;

function nextCode(existing: PropertyItem[]): string {
  const max = existing.reduce((acc, item) => Math.max(acc, Number(item.registrationCode.replace(/\D/g, "")) || 0), 0);
  return `IM-${String(max + 1).padStart(3, "0")}`;
}

function PropertyFormModal({
  property,
  existing,
  onClose,
  onSaved,
}: {
  property: PropertyItem | null;
  existing: PropertyItem[];
  onClose: () => void;
  onSaved: (property: PropertyItem, created: boolean) => void;
}) {
  const [code, setCode] = useState(property?.registrationCode ?? nextCode(existing));
  const [address, setAddress] = useState(property?.address ?? "");
  const [status, setStatus] = useState<PropertyStatus>(property?.status ?? "DISPONIVEL");
  const [tenant, setTenant] = useState(property?.currentTenant ?? "");
  const [rent, setRent] = useState(property ? formatMoneyInput(String(toCents(property.monthlyRent))) : "");
  const [notes, setNotes] = useState(property?.notes ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const rentValue = parseMoney(rent);
    const found: FormErrors = {};
    if (!property) {
      const normalized = code.trim().toUpperCase();
      if (!/^IM-\d{3,5}$/.test(normalized)) found.code = "Use o formato IM-000.";
      else if (existing.some((item) => item.registrationCode === normalized)) found.code = "Já existe um imóvel com este código.";
    }
    found.address = lengthError(address, "o endereço", 5, 255) ?? undefined;
    if (status === "OCUPADO") found.tenant = personNameError(tenant, "Nome do inquilino") ?? undefined;
    found.rent = amountError(rentValue, { allowZero: true, label: "Aluguel" }) ?? undefined;
    found.notes = notes.trim().length > 1000 ? "Máximo de 1000 caracteres." : undefined;
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    const payload: PropertyRequest = {
      registrationCode: property ? undefined : code.trim().toUpperCase(),
      address: address.trim(),
      currentTenant: status === "OCUPADO" ? tenant.trim() : null,
      monthlyRent: toCents(rentValue) / 100,
      status,
      notes: notes.trim() || null,
    };
    setSaving(true);
    setFormError("");
    try {
      const saved = property ? await propertiesApi.update(property.id, payload) : await propertiesApi.create(payload);
      onSaved(saved, property === null);
    } catch (error) {
      if (isApiError(error)) {
        setErrors((current) => ({
          ...current,
          code: error.fieldErrors.registrationCode ?? current.code,
          address: error.fieldErrors.address ?? current.address,
          rent: error.fieldErrors.monthlyRent ?? current.rent,
        }));
      }
      setFormError(errorMessage(error));
      setSaving(false);
    }
  }

  return (
    <Modal
      title={property ? `Alterar situação — ${property.registrationCode}` : "Adicionar imóvel"}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="property-form" className="ui-btn ui-btn-primary" disabled={saving} aria-busy={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <form id="property-form" onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 12 }}>
        <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
          <legend className="ui-label" style={{ marginBottom: 8 }}>
            Situação
          </legend>
          <div role="radiogroup" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {PROPERTY_STATUSES.map((value) => (
              <label
                key={value}
                className={`ui-btn ${status === value ? "ui-btn-primary" : "ui-btn-secondary"}`}
                style={{ cursor: "pointer" }}
              >
                <input
                  type="radio"
                  name="property-status"
                  value={value}
                  checked={status === value}
                  onChange={() => setStatus(value)}
                  className="sr-only"
                />
                {PROPERTY_STATUS_LABEL[value]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="ui-form-grid">
          <Field label="Código" error={errors.code} required={!property} hint={property ? "O código não muda." : undefined}>
            {(props) => (
              <input {...props} className="ui-input" value={code} onChange={(e) => setCode(e.target.value)} disabled={Boolean(property)} maxLength={9} />
            )}
          </Field>
          <Field label="Aluguel mensal" error={errors.rent} required>
            {(props) => (
              <input {...props} className="ui-input" inputMode="numeric" placeholder="R$ 0,00" value={rent} onChange={(e) => setRent(formatMoneyInput(e.target.value))} />
            )}
          </Field>
        </div>
        <Field label="Endereço" error={errors.address} required>
          {(props) => <input {...props} data-autofocus className="ui-input" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={255} />}
        </Field>
        {status === "OCUPADO" ? (
          <Field label="Inquilino atual" error={errors.tenant} required>
            {(props) => <input {...props} className="ui-input" value={tenant} onChange={(e) => setTenant(e.target.value)} maxLength={160} />}
          </Field>
        ) : null}
        <Field label="Observações" error={errors.notes} hint={status === "MANUTENCAO" ? "Descreva o serviço em andamento." : "Opcional."}>
          {(props) => <textarea {...props} className="ui-input" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />}
        </Field>
        {formError ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {formError}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

function PropertyDetailsModal({ property, onClose, onEdit }: { property: PropertyItem; onClose: () => void; onEdit?: () => void }) {
  const [movements, setMovements] = useState<FinancialMovement[] | null>(null);
  const { items: clients } = useRecords("clients", clientSchema);
  const linkedClients = clients.filter((client) => client.propertyCode === property.registrationCode);

  useEffect(() => {
    financialApi
      .allMovements()
      .then((all) => setMovements(all.filter((item) => item.propertyRegistration === property.registrationCode).slice(0, 8)))
      .catch(() => setMovements([]));
  }, [property.registrationCode]);

  return (
    <Modal
      title={`Imóvel ${property.registrationCode}`}
      wide
      onClose={onClose}
      footer={
        onEdit ? (
          <button type="button" className="ui-btn ui-btn-primary" onClick={onEdit}>
            <Pencil size={16} aria-hidden="true" /> Alterar situação
          </button>
        ) : undefined
      }
    >
      <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, margin: 0 }}>
        {[
          ["Endereço", property.address],
          ["Situação", PROPERTY_STATUS_LABEL[property.status]],
          ["Inquilino", property.currentTenant ?? "—"],
          ["Aluguel", formatCurrency(property.monthlyRent)],
          ["Última alteração", property.updatedAt ? `${formatDateTime(property.updatedAt)} por ${property.updatedBy ?? "—"}` : "—"],
        ].map(([label, value]) => (
          <div key={label} style={{ background: "var(--ui-surface-muted)", padding: "8px 10px", borderRadius: 8 }}>
            <dt style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>{label}</dt>
            <dd style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{value}</dd>
          </div>
        ))}
      </dl>
      {property.notes ? <p style={{ margin: 0, fontSize: 14, whiteSpace: "pre-wrap" }}>{property.notes}</p> : null}

      <div>
        <h3 style={{ fontSize: 15, margin: "4px 0 8px", color: "var(--ui-primary)" }}>Clientes vinculados</h3>
        {linkedClients.length === 0 ? (
          <p className="ui-field-hint">Nenhum cliente cadastrado para este imóvel.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
            {linkedClients.map((client) => (
              <li key={client.id}>
                <Link href={`/clientes?cliente=${client.id}`} className="ui-link">
                  {client.name}
                </Link>{" "}
                — contrato até {formatDate(client.contractEndDate)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: 15, margin: "4px 0 8px", color: "var(--ui-primary)" }}>Últimas movimentações</h3>
        {movements === null ? (
          <div className="ui-skeleton" style={{ height: 22 }} />
        ) : movements.length === 0 ? (
          <p className="ui-field-hint">Sem entradas ou saídas registradas.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
            {movements.map((item) => (
              <li key={item.id}>
                {formatDate(item.date)} — {item.type === "INCOME" ? "Entrada" : "Saída"}: {item.tenantName} ({formatCurrency(item.amount)})
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
