"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, Clock, Eye, History, Pencil, Plus, UserCog, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { FOLDER_IDS, createDocument, documentHref } from "@/lib/documents";
import { ACCEPTED_FILE_TYPES, fileTooLargeMessage } from "@/lib/files";
import { errorMessage } from "@/lib/financial-api";
import { formatDate, formatDateTime, isValidIsoDate, newId, normalizeText, todayIso } from "@/lib/format";
import { useRecords } from "@/lib/records";
import {
  ATTENDANCE_STATUSES,
  JUSTIFICATION_TYPES,
  attendanceSchema,
  employeeSchema,
  justificationSchema,
  type Attendance,
  type Employee,
  type Justification,
} from "@/lib/schemas";
import { useCan } from "@/lib/permissions";
import { useSession } from "@/lib/session";
import { EARLIEST_DATE, formatCpf, isValidCpf, personNameError } from "@/lib/validation";

const toMinutes = (time: string | null) => {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
const formatMinutes = (total: number) => `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, "0")}min`;
const nowTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

function workedMinutes(record: Attendance): number | null {
  const entry = toMinutes(record.entryTime);
  const exit = toMinutes(record.exitTime);
  if (entry === null || exit === null || exit <= entry) return null;
  const breakStart = toMinutes(record.breakStart);
  const breakEnd = toMinutes(record.breakEnd);
  const pause = breakStart !== null && breakEnd !== null && breakEnd > breakStart ? breakEnd - breakStart : 0;
  return exit - entry - pause;
}

function expectedMinutes(employee: Employee): number {
  return (toMinutes(employee.shiftEnd) ?? 0) - (toMinutes(employee.shiftStart) ?? 0) - ((toMinutes(employee.breakEnd) ?? 0) - (toMinutes(employee.breakStart) ?? 0));
}

function journeyLabel(employee: Employee, record: Attendance | undefined, date: string): { text: string; tone: string } {
  if (!record) return date < todayIso() ? { text: "Sem registro", tone: "ui-badge-danger" } : { text: "Aguardando entrada", tone: "ui-badge-neutral" };
  if (record.status === "Ausente") return { text: "Falta", tone: "ui-badge-danger" };
  if (record.status === "Folga" || record.status === "Atestado") return { text: record.status, tone: "ui-badge-info" };
  const worked = workedMinutes(record);
  if (worked === null) return { text: record.entryTime ? "Em andamento" : "Sem entrada", tone: "ui-badge-warning" };
  // Tolerância de 10 minutos, comum em controles de ponto.
  return worked >= expectedMinutes(employee) - 10 ? { text: "Jornada completa", tone: "ui-badge-success" } : { text: "Jornada incompleta", tone: "ui-badge-warning" };
}

const STATUS_TONE: Record<Justification["status"], string> = {
  Pendente: "ui-badge-warning",
  Aprovada: "ui-badge-success",
  Rejeitada: "ui-badge-danger",
};

export default function FuncionariosPage() {
  const canReview = useCan("review");
  const [chosenTab, setTab] = useState<"gestor" | "ponto" | null>(null);
  // Funcionário vê só o registro de presença; quem analisa abre na visão do gestor.
  const tab = canReview ? (chosenTab ?? "gestor") : "ponto";
  return (
    <AppShell>
      <section className="ui-page" aria-labelledby="func-title">
        <div className="ui-page-header">
          <div>
            <h1 id="func-title">Funcionários</h1>
            <p>Presença, jornada e justificativas de falta.</p>
          </div>
          <div role="tablist" aria-label="Visões" className="ui-row-actions">
            {canReview ? (
              <button type="button" role="tab" aria-selected={tab === "gestor"} className={`ui-btn ${tab === "gestor" ? "ui-btn-primary" : "ui-btn-secondary"}`} onClick={() => setTab("gestor")}>
                Visão do gestor
              </button>
            ) : null}
            <button type="button" role="tab" aria-selected={tab === "ponto"} className={`ui-btn ${tab === "ponto" ? "ui-btn-primary" : "ui-btn-secondary"}`} onClick={() => setTab("ponto")}>
              <Clock size={16} aria-hidden="true" /> Registro de presença
            </button>
          </div>
        </div>
        {tab === "gestor" ? <ManagerView /> : <EmployeeView />}
      </section>
    </AppShell>
  );
}

// ------------------------------------------------------------------ Gestor
function ManagerView() {
  const employeesStore = useRecords("employees", employeeSchema);
  const attendanceStore = useRecords("attendance", attendanceSchema);
  const justificationsStore = useRecords("justifications", justificationSchema);
  const session = useSession();
  const { show, node: toast } = useToast();
  const [date, setDate] = useState(todayIso());
  const [name, setName] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [justFilter, setJustFilter] = useState<Justification["status"] | "ALL">("Pendente");
  const [editing, setEditing] = useState<{ employee: Employee; record?: Attendance } | null>(null);
  const [historyOf, setHistoryOf] = useState<Employee | null>(null);
  const [reviewing, setReviewing] = useState<Justification | null>(null);
  const [staffOpen, setStaffOpen] = useState(false);

  const employees = employeesStore.items.filter((employee) => employee.active);
  const roles = Array.from(new Set(employees.map((employee) => employee.role))).sort();
  const recordsOfDay = new Map(attendanceStore.items.filter((record) => record.date === date).map((record) => [record.employeeId, record]));

  const rows = employees
    .filter((employee) => {
      if (name && !normalizeText(employee.name).includes(normalizeText(name))) return false;
      if (role !== "ALL" && employee.role !== role) return false;
      const record = recordsOfDay.get(employee.id);
      const current = record?.status ?? "Sem registro";
      return status === "ALL" || current === status;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const justifications = justificationsStore.items
    .filter((item) => justFilter === "ALL" || item.status === justFilter)
    .sort((a, b) => (a.status === "Pendente" ? -1 : 0) - (b.status === "Pendente" ? -1 : 0) || b.date.localeCompare(a.date));
  const pendingCount = justificationsStore.items.filter((item) => item.status === "Pendente").length;

  async function review(item: Justification, decision: "Aprovada" | "Rejeitada", note: string) {
    await justificationsStore.save({
      ...item,
      status: decision,
      reviewedBy: session?.user.name ?? "Gestor",
      reviewedAt: new Date().toISOString(),
      reviewNote: note.trim() || null,
    });
    // Falta justificada e aprovada deixa de contar como falta no dia.
    if (decision === "Aprovada" && item.type === "Ausência") {
      const id = `att-${item.date.replace(/-/g, "")}-${item.employeeId}`;
      const existing = attendanceStore.items.find((record) => record.id === id);
      await attendanceStore.save({
        ...(existing ?? { id, employeeId: item.employeeId, date: item.date, entryTime: null, breakStart: null, breakEnd: null, exitTime: null }),
        status: "Atestado",
        registeredBy: session?.user.name ?? "Gestor",
      });
    }
    setReviewing(null);
    show(`Justificativa de ${item.employeeName} ${decision === "Aprovada" ? "aprovada" : "rejeitada"}.`);
  }

  const loading = employeesStore.loading || attendanceStore.loading;
  const error = employeesStore.error || attendanceStore.error || justificationsStore.error;

  return (
    <>
      <div className="ui-toolbar">
        <div className="ui-field">
          <label htmlFor="func-data">Data</label>
          <input id="func-data" type="date" className="ui-input" value={date} max={todayIso()} min={EARLIEST_DATE} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
        <div className="ui-field" style={{ flex: "2 1 200px" }}>
          <label htmlFor="func-nome">Nome do funcionário</label>
          <input id="func-nome" className="ui-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Digite aqui" />
        </div>
        <div className="ui-field">
          <label htmlFor="func-funcao">Função</label>
          <select id="func-funcao" className="ui-input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="ALL">Todas as funções</option>
            {roles.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className="ui-field">
          <label htmlFor="func-status">Status</label>
          <select id="func-status" className="ui-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">Todos os status</option>
            {[...ATTENDANCE_STATUSES, "Sem registro"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setStaffOpen(true)}>
          <UserCog size={16} aria-hidden="true" /> Cadastro de funcionários
        </button>
      </div>

      {error ? (
        <p className="ui-alert ui-alert-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="ui-table-wrap">
        <table className="ui-table">
          <caption className="sr-only">Presença em {formatDate(date)}</caption>
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Função</th>
              <th scope="col">Chegada</th>
              <th scope="col">Intervalo</th>
              <th scope="col">Saída</th>
              <th scope="col">HT</th>
              <th scope="col">Jornada</th>
              <th scope="col">Status</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9}>
                  <div className="ui-skeleton" style={{ height: 22 }} />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="ui-empty">
                  {employees.length === 0 ? "Nenhum funcionário cadastrado." : "Ninguém encontrado com esses filtros."}
                </td>
              </tr>
            ) : (
              rows.map((employee) => {
                const record = recordsOfDay.get(employee.id);
                const worked = record ? workedMinutes(record) : null;
                const journey = journeyLabel(employee, record, date);
                return (
                  <tr key={employee.id}>
                    <td>
                      <strong>{employee.name}</strong>
                    </td>
                    <td>{employee.role}</td>
                    <td>{record?.entryTime ?? "—"}</td>
                    <td>{record?.breakStart ? `${record.breakStart} – ${record.breakEnd ?? "…"}` : "—"}</td>
                    <td>{record?.exitTime ?? "—"}</td>
                    <td>{worked !== null ? formatMinutes(worked) : "—"}</td>
                    <td>
                      <span className={`ui-badge ${journey.tone}`}>{journey.text}</span>
                    </td>
                    <td>{record?.status ?? "Sem registro"}</td>
                    <td>
                      <div className="ui-row-actions">
                        <button type="button" className="ui-icon-btn" onClick={() => setEditing({ employee, record })} aria-label={`Ajustar registro de ${employee.name}`} title="Ajustar registro">
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button type="button" className="ui-icon-btn" onClick={() => setHistoryOf(employee)} aria-label={`Histórico de ${employee.name}`} title="Histórico individual">
                          <History size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <section className="ui-card" aria-labelledby="just-title">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 10, marginBottom: 10 }}>
          <h2 id="just-title" style={{ margin: 0, fontSize: 18, color: "var(--ui-primary)" }}>
            Justificativas de funcionários {pendingCount ? <span className="ui-badge ui-badge-warning">{pendingCount} pendente(s)</span> : null}
          </h2>
          <div className="ui-field" style={{ minWidth: 180 }}>
            <label htmlFor="just-status">Mostrar</label>
            <select id="just-status" className="ui-input" value={justFilter} onChange={(e) => setJustFilter(e.target.value as Justification["status"] | "ALL")}>
              <option value="ALL">Todas</option>
              <option value="Pendente">Pendentes</option>
              <option value="Aprovada">Aprovadas</option>
              <option value="Rejeitada">Rejeitadas</option>
            </select>
          </div>
        </div>
        {justificationsStore.loading ? (
          <div className="ui-skeleton" style={{ height: 60 }} />
        ) : justifications.length === 0 ? (
          <p className="ui-empty">Nenhuma justificativa {justFilter === "ALL" ? "" : justFilter.toLowerCase()}.</p>
        ) : (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th scope="col">Funcionário</th>
                  <th scope="col">Data</th>
                  <th scope="col">Motivo</th>
                  <th scope="col">Anexo</th>
                  <th scope="col">Status</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {justifications.map((item) => (
                  <tr key={item.id}>
                    <td>{item.employeeName}</td>
                    <td>{formatDate(item.date)}</td>
                    <td>
                      <strong>{item.type}</strong>
                      <div className="ui-field-hint">{item.reason}</div>
                    </td>
                    <td>
                      {item.attachmentDocId ? (
                        <Link className="ui-link" href={documentHref(item.attachmentDocId)}>
                          {item.attachmentName ?? "Abrir"}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={`ui-badge ${STATUS_TONE[item.status]}`}>{item.status}</span>
                    </td>
                    <td>
                      <div className="ui-row-actions">
                        <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => setReviewing(item)}>
                          <Eye size={14} aria-hidden="true" /> {item.status === "Pendente" ? "Analisar" : "Visualizar"}
                        </button>
                        {item.status === "Pendente" ? (
                          <button type="button" className="ui-btn ui-btn-primary ui-btn-sm" onClick={() => void review(item, "Aprovada", "").catch((err) => show(errorMessage(err), "error"))}>
                            <Check size={14} aria-hidden="true" /> Aprovar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing ? (
        <AttendanceEditModal
          employee={editing.employee}
          record={editing.record}
          date={date}
          onClose={() => setEditing(null)}
          onSave={async (record) => {
            await attendanceStore.save({ ...record, registeredBy: session?.user.name ?? "Gestor" });
            setEditing(null);
            show(`Registro de ${editing.employee.name} salvo.`);
          }}
        />
      ) : null}
      {historyOf ? <HistoryModal employee={historyOf} records={attendanceStore.items} onClose={() => setHistoryOf(null)} /> : null}
      {reviewing ? <ReviewModal item={reviewing} onClose={() => setReviewing(null)} onDecide={review} /> : null}
      {staffOpen ? <StaffModal store={employeesStore} onClose={() => setStaffOpen(false)} notify={show} /> : null}
      {toast}
    </>
  );
}

function ReviewModal({
  item,
  onClose,
  onDecide,
}: {
  item: Justification;
  onClose: () => void;
  onDecide: (item: Justification, decision: "Aprovada" | "Rejeitada", note: string) => Promise<void>;
}) {
  const [note, setNote] = useState(item.reviewNote ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const pending = item.status === "Pendente";

  async function decide(decision: "Aprovada" | "Rejeitada") {
    if (decision === "Rejeitada" && note.trim().length < 5) {
      setError("Explique o motivo da rejeição (mínimo 5 caracteres).");
      return;
    }
    setSaving(true);
    try {
      await onDecide(item, decision, note);
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Justificativa de ${item.employeeName}`}
      onClose={onClose}
      busy={saving}
      footer={
        pending ? (
          <>
            <button type="button" className="ui-btn ui-btn-danger" onClick={() => void decide("Rejeitada")} disabled={saving}>
              <X size={16} aria-hidden="true" /> Rejeitar
            </button>
            <button type="button" className="ui-btn ui-btn-primary" onClick={() => void decide("Aprovada")} disabled={saving}>
              <Check size={16} aria-hidden="true" /> Aprovar
            </button>
          </>
        ) : (
          <button type="button" className="ui-btn ui-btn-primary" onClick={onClose}>
            Fechar
          </button>
        )
      }
    >
      <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, margin: 0 }}>
        {[
          ["Tipo", item.type],
          ["Data", formatDate(item.date)],
          ["Enviada em", formatDateTime(item.submittedAt)],
          ["Status", item.status],
          ...(item.reviewedBy ? [["Analisada por", `${item.reviewedBy} em ${formatDateTime(item.reviewedAt)}`]] : []),
        ].map(([label, value]) => (
          <div key={label} style={{ background: "var(--ui-surface-muted)", padding: "6px 10px", borderRadius: 8 }}>
            <dt style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>{label}</dt>
            <dd style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <span className="ui-label">Motivo informado</span>
        <p style={{ margin: "4px 0 0", fontSize: 14, whiteSpace: "pre-wrap" }}>{item.reason}</p>
      </div>
      <p style={{ margin: 0, fontSize: 14 }}>
        Documento anexado:{" "}
        {item.attachmentDocId ? (
          <Link className="ui-link" href={documentHref(item.attachmentDocId)}>
            {item.attachmentName ?? "abrir documento"}
          </Link>
        ) : (
          "nenhum"
        )}
      </p>
      {pending ? (
        <Field label="Parecer do gestor" error={error} hint="Obrigatório para rejeitar.">
          {(props) => <textarea {...props} className="ui-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />}
        </Field>
      ) : item.reviewNote ? (
        <p style={{ margin: 0, fontSize: 14 }}>
          <strong>Parecer:</strong> {item.reviewNote}
        </p>
      ) : null}
    </Modal>
  );
}

function AttendanceEditModal({
  employee,
  record,
  date,
  onClose,
  onSave,
}: {
  employee: Employee;
  record?: Attendance;
  date: string;
  onClose: () => void;
  onSave: (record: Attendance) => Promise<void>;
}) {
  const [status, setStatus] = useState<Attendance["status"]>(record?.status ?? "Presente");
  const [entry, setEntry] = useState(record?.entryTime ?? "");
  const [breakStart, setBreakStart] = useState(record?.breakStart ?? "");
  const [breakEnd, setBreakEnd] = useState(record?.breakEnd ?? "");
  const [exit, setExit] = useState(record?.exitTime ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const present = status === "Presente";
    if (present) {
      const order = [entry, breakStart, breakEnd, exit].filter(Boolean);
      if (!entry) return setError("Informe ao menos o horário de chegada.");
      if (Boolean(breakStart) !== Boolean(breakEnd) && exit) return setError("Informe início e fim do intervalo.");
      if (order.some((time, index) => index > 0 && time <= order[index - 1])) return setError("Os horários devem estar em ordem crescente.");
    }
    setSaving(true);
    try {
      await onSave({
        id: record?.id ?? `att-${date.replace(/-/g, "")}-${employee.id}`,
        employeeId: employee.id,
        date,
        status,
        entryTime: present ? entry || null : null,
        breakStart: present ? breakStart || null : null,
        breakEnd: present ? breakEnd || null : null,
        exitTime: present ? exit || null : null,
        registeredBy: "",
      });
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Registro de ${employee.name} — ${formatDate(date)}`}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="att-form" className="ui-btn ui-btn-primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <form id="att-form" onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 12 }}>
        <Field label="Situação">
          {(props) => (
            <select {...props} className="ui-input" value={status} onChange={(e) => setStatus(e.target.value as Attendance["status"])}>
              {ATTENDANCE_STATUSES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          )}
        </Field>
        {status === "Presente" ? (
          <div className="ui-form-grid">
            {(
              [
                ["Chegada", entry, setEntry],
                ["Saída para intervalo", breakStart, setBreakStart],
                ["Retorno do intervalo", breakEnd, setBreakEnd],
                ["Saída final", exit, setExit],
              ] as const
            ).map(([label, value, setter]) => (
              <Field key={label} label={label}>
                {(props) => <input {...props} type="time" className="ui-input" value={value} onChange={(e) => setter(e.target.value)} />}
              </Field>
            ))}
          </div>
        ) : null}
        <p className="ui-field-hint">
          Jornada prevista: {employee.shiftStart}–{employee.shiftEnd}, intervalo {employee.breakStart}–{employee.breakEnd}.
        </p>
        {error ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

function HistoryModal({ employee, records, onClose }: { employee: Employee; records: Attendance[]; onClose: () => void }) {
  const history = records
    .filter((record) => record.employeeId === employee.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 60);
  const worked = history.reduce((acc, record) => acc + (workedMinutes(record) ?? 0), 0);
  const absences = history.filter((record) => record.status === "Ausente").length;
  return (
    <Modal title={`Histórico de ${employee.name}`} wide onClose={onClose}>
      <p style={{ margin: 0, fontSize: 14 }}>
        {history.length} registro(s) · {formatMinutes(worked)} trabalhadas · {absences} falta(s)
      </p>
      {history.length === 0 ? (
        <p className="ui-empty">Nenhum registro de ponto ainda.</p>
      ) : (
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Situação</th>
                <th scope="col">Chegada</th>
                <th scope="col">Intervalo</th>
                <th scope="col">Saída</th>
                <th scope="col">HT</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => {
                const minutes = workedMinutes(record);
                return (
                  <tr key={record.id}>
                    <td>{formatDate(record.date)}</td>
                    <td>{record.status}</td>
                    <td>{record.entryTime ?? "—"}</td>
                    <td>{record.breakStart ? `${record.breakStart} – ${record.breakEnd ?? "…"}` : "—"}</td>
                    <td>{record.exitTime ?? "—"}</td>
                    <td>{minutes !== null ? formatMinutes(minutes) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

type EmployeesStore = ReturnType<typeof useRecords<Employee>>;

function StaffModal({ store, onClose, notify }: { store: EmployeesStore; onClose: () => void; notify: (message: string, tone?: "success" | "error") => void }) {
  const [editing, setEditing] = useState<Employee | "new" | null>(null);
  const sorted = [...store.items].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));

  if (editing) {
    return (
      <EmployeeForm
        employee={editing === "new" ? null : editing}
        others={store.items}
        onClose={() => setEditing(null)}
        onSave={async (employee) => {
          await store.save(employee);
          setEditing(null);
          notify(`Funcionário ${employee.name} salvo.`);
        }}
      />
    );
  }

  return (
    <Modal
      title="Cadastro de funcionários"
      wide
      onClose={onClose}
      footer={
        <button type="button" className="ui-btn ui-btn-primary" onClick={() => setEditing("new")}>
          <Plus size={16} aria-hidden="true" /> Novo funcionário
        </button>
      }
    >
      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Função</th>
              <th scope="col">CPF</th>
              <th scope="col">Jornada</th>
              <th scope="col">Situação</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.name}</td>
                <td>{employee.role}</td>
                <td>{employee.cpf}</td>
                <td>
                  {employee.shiftStart}–{employee.shiftEnd}
                </td>
                <td>
                  <span className={`ui-badge ${employee.active ? "ui-badge-success" : "ui-badge-neutral"}`}>{employee.active ? "Ativo" : "Desligado"}</span>
                </td>
                <td>
                  <div className="ui-row-actions">
                    <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => setEditing(employee)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="ui-btn ui-btn-secondary ui-btn-sm"
                      onClick={() =>
                        void store
                          .save({ ...employee, active: !employee.active })
                          .then(() => notify(employee.active ? `${employee.name} retirado(a) da lista ativa.` : `${employee.name} reativado(a).`))
                          .catch((err) => notify(errorMessage(err), "error"))
                      }
                    >
                      {employee.active ? "Retirar" : "Reativar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

function EmployeeForm({ employee, others, onClose, onSave }: { employee: Employee | null; others: Employee[]; onClose: () => void; onSave: (employee: Employee) => Promise<void> }) {
  const [name, setName] = useState(employee?.name ?? "");
  const [role, setRole] = useState(employee?.role ?? "");
  const [cpf, setCpf] = useState(employee?.cpf ?? "");
  const [shiftStart, setShiftStart] = useState(employee?.shiftStart ?? "08:00");
  const [breakStart, setBreakStart] = useState(employee?.breakStart ?? "12:00");
  const [breakEnd, setBreakEnd] = useState(employee?.breakEnd ?? "13:00");
  const [shiftEnd, setShiftEnd] = useState(employee?.shiftEnd ?? "17:00");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: Record<string, string> = {};
    const nameError = personNameError(name, "Nome");
    if (nameError) found.name = nameError;
    if (role.trim().length < 3) found.role = "Informe a função.";
    if (!isValidCpf(cpf)) found.cpf = "CPF inválido.";
    else if (others.some((other) => other.id !== employee?.id && other.cpf.replace(/\D/g, "") === cpf.replace(/\D/g, ""))) found.cpf = "CPF já cadastrado.";
    if (!(shiftStart < breakStart && breakStart < breakEnd && breakEnd < shiftEnd)) found.shift = "Horários fora de ordem (entrada < intervalo < retorno < saída).";
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      await onSave({ id: employee?.id ?? newId("func"), name: name.trim(), role: role.trim(), cpf: formatCpf(cpf), shiftStart, breakStart, breakEnd, shiftEnd, active: employee?.active ?? true });
    } catch (err) {
      setErrors({ form: errorMessage(err) });
      setSaving(false);
    }
  }

  return (
    <Modal
      title={employee ? `Editar ${employee.name}` : "Novo funcionário"}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose} disabled={saving}>
            Voltar
          </button>
          <button type="submit" form="emp-form" className="ui-btn ui-btn-primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <form id="emp-form" onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 12 }}>
        <Field label="Nome" error={errors.name} required>
          {(props) => <input {...props} data-autofocus className="ui-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />}
        </Field>
        <div className="ui-form-grid">
          <Field label="Função" error={errors.role} required>
            {(props) => <input {...props} className="ui-input" value={role} onChange={(e) => setRole(e.target.value)} maxLength={60} />}
          </Field>
          <Field label="CPF" error={errors.cpf} required>
            {(props) => <input {...props} className="ui-input" inputMode="numeric" value={cpf} onChange={(e) => setCpf(formatCpf(e.target.value))} />}
          </Field>
          {(
            [
              ["Entrada", shiftStart, setShiftStart],
              ["Início do intervalo", breakStart, setBreakStart],
              ["Fim do intervalo", breakEnd, setBreakEnd],
              ["Saída", shiftEnd, setShiftEnd],
            ] as const
          ).map(([label, value, setter]) => (
            <Field key={label} label={label}>
              {(props) => <input {...props} type="time" className="ui-input" value={value} onChange={(e) => setter(e.target.value)} />}
            </Field>
          ))}
        </div>
        {errors.shift || errors.form ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {errors.shift ?? errors.form}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

// --------------------------------------------------------------- Funcionário
const PUNCH_STEPS = [
  { key: "entryTime", label: "Entrada" },
  { key: "breakStart", label: "Saída para intervalo" },
  { key: "breakEnd", label: "Retorno" },
  { key: "exitTime", label: "Saída final" },
] as const;

function EmployeeView() {
  const employeesStore = useRecords("employees", employeeSchema);
  const attendanceStore = useRecords("attendance", attendanceSchema);
  const justificationsStore = useRecords("justifications", justificationSchema);
  const { show, node: toast } = useToast();
  const [employeeId, setEmployeeId] = useState("");
  const [cpf, setCpf] = useState("");
  const [punchError, setPunchError] = useState("");
  const [busy, setBusy] = useState(false);
  const [newJustification, setNewJustification] = useState(false);

  const employees = employeesStore.items.filter((employee) => employee.active).sort((a, b) => a.name.localeCompare(b.name));
  const employee = employees.find((item) => item.id === employeeId) ?? null;
  const today = todayIso();
  const todayRecord = attendanceStore.items.find((record) => record.employeeId === employeeId && record.date === today);
  const nextStep = PUNCH_STEPS.find((step) => !todayRecord?.[step.key]);
  const mine = useMemo(
    () => justificationsStore.items.filter((item) => item.employeeId === employeeId).sort((a, b) => b.date.localeCompare(a.date)),
    [justificationsStore.items, employeeId]
  );
  const history = attendanceStore.items
    .filter((record) => record.employeeId === employeeId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  async function punch() {
    if (!employee || !nextStep) return;
    // Confirmação por CPF (Backlog 7.3): o ponto é registrado só por quem sabe o CPF do funcionário.
    if (cpf.replace(/\D/g, "") !== employee.cpf.replace(/\D/g, "")) {
      setPunchError("CPF não confere com o funcionário selecionado.");
      return;
    }
    setPunchError("");
    setBusy(true);
    const time = nowTime();
    const base: Attendance = todayRecord ?? {
      id: `att-${today.replace(/-/g, "")}-${employee.id}`,
      employeeId: employee.id,
      date: today,
      status: "Presente",
      entryTime: null,
      breakStart: null,
      breakEnd: null,
      exitTime: null,
      registeredBy: "",
    };
    const previous = PUNCH_STEPS.map((step) => base[step.key]).filter(Boolean).pop();
    if (previous && time <= previous) {
      setPunchError(`Aguarde: o último registro foi às ${previous}.`);
      setBusy(false);
      return;
    }
    try {
      await attendanceStore.save({ ...base, status: "Presente", [nextStep.key]: time, registeredBy: employee.name });
      show(`${nextStep.label} registrada às ${time}.`);
      setCpf("");
    } catch (err) {
      setPunchError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="ui-card" style={{ display: "grid", gap: 14 }}>
        <div className="ui-form-grid">
          <Field label="Funcionário">
            {(props) => (
              <select {...props} className="ui-input" value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); setPunchError(""); }}>
                <option value="">Selecione seu nome</option>
                {employees.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {item.role}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Confirme seu CPF" error={punchError} hint="Usado só para confirmar o registro.">
            {(props) => <input {...props} className="ui-input" inputMode="numeric" value={cpf} onChange={(e) => setCpf(formatCpf(e.target.value))} disabled={!employee} />}
          </Field>
        </div>
        {employee ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
              {PUNCH_STEPS.map((step) => (
                <div key={step.key} className="ui-card" style={{ textAlign: "center", padding: 12, background: todayRecord?.[step.key] ? "#f0fdf4" : undefined }}>
                  <div className="ui-stat-label">{step.label}</div>
                  <div className="ui-stat-value" style={{ fontSize: 22 }}>
                    {todayRecord?.[step.key] ?? "--:--"}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="ui-btn ui-btn-primary" style={{ justifySelf: "start", minHeight: 48 }} disabled={!nextStep || busy} onClick={() => void punch()} aria-busy={busy}>
              <Clock size={18} aria-hidden="true" /> {nextStep ? `Registrar ${nextStep.label.toLowerCase()} agora` : "Jornada de hoje concluída"}
            </button>
          </>
        ) : (
          <p className="ui-field-hint">Selecione seu nome para registrar o ponto de hoje ({formatDate(today)}).</p>
        )}
      </div>

      {employee ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 16 }}>
          <section className="ui-card" aria-labelledby="minhas-just">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <h2 id="minhas-just" style={{ margin: 0, fontSize: 17, color: "var(--ui-primary)" }}>
                Minhas justificativas
              </h2>
              <button type="button" className="ui-btn ui-btn-primary ui-btn-sm" onClick={() => setNewJustification(true)}>
                <Plus size={14} aria-hidden="true" /> Nova justificativa
              </button>
            </div>
            <p className="ui-field-hint" style={{ marginTop: 0 }}>
              {mine.filter((item) => item.status === "Pendente").length} pendente(s) · {mine.filter((item) => item.status === "Aprovada").length} aprovada(s)
            </p>
            {mine.length === 0 ? (
              <p className="ui-empty">Nenhuma justificativa enviada.</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                {mine.map((item) => (
                  <li key={item.id} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 6, fontSize: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <strong>
                        {item.type} · {formatDate(item.date)}
                      </strong>
                      <span className={`ui-badge ${STATUS_TONE[item.status]}`}>{item.status}</span>
                    </div>
                    <span className="ui-field-hint">{item.reason}</span>
                    {item.reviewNote ? <div className="ui-field-hint">Parecer: {item.reviewNote}</div> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="ui-card" aria-labelledby="meu-hist">
            <h2 id="meu-hist" style={{ margin: "0 0 8px", fontSize: 17, color: "var(--ui-primary)" }}>
              Meu histórico de pontos
            </h2>
            {history.length === 0 ? (
              <p className="ui-empty">Nenhum registro ainda.</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6, fontSize: 14 }}>
                {history.map((record) => {
                  const minutes = workedMinutes(record);
                  return (
                    <li key={record.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, borderBottom: "1px solid #f1f5f9", paddingBottom: 4 }}>
                      <span>{record.date === today ? "Hoje" : formatDate(record.date)}</span>
                      <span>
                        {record.status === "Presente" ? `${record.entryTime ?? "--"} → ${record.exitTime ?? "--"}` : record.status}
                        {minutes !== null ? ` · ${formatMinutes(minutes)}` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      {newJustification && employee ? (
        <JustificationForm
          employee={employee}
          existing={mine}
          onClose={() => setNewJustification(false)}
          onSave={async (item) => {
            await justificationsStore.save(item);
            setNewJustification(false);
            show("Justificativa enviada para análise do gestor.");
          }}
        />
      ) : null}
      {toast}
    </>
  );
}

function JustificationForm({
  employee,
  existing,
  onClose,
  onSave,
}: {
  employee: Employee;
  existing: Justification[];
  onClose: () => void;
  onSave: (item: Justification) => Promise<void>;
}) {
  const [date, setDate] = useState(todayIso());
  const [type, setType] = useState<Justification["type"]>("Ausência");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!isValidIsoDate(date) || date > todayIso() || date < EARLIEST_DATE) found.date = "Escolha uma data até hoje.";
    else if (existing.some((item) => item.date === date && item.type === type && item.status !== "Rejeitada")) found.date = "Já existe justificativa deste tipo para esta data.";
    if (reason.trim().length < 10) found.reason = "Descreva o motivo (mínimo 10 caracteres).";
    if (file) {
      const tooLarge = fileTooLargeMessage(file);
      if (tooLarge) found.file = tooLarge;
    }
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      let attachmentDocId: string | null = null;
      if (file) {
        const doc = await createDocument({
          name: file.name,
          folderId: FOLDER_IDS.funcionarios,
          category: "Justificativa",
          description: `Justificativa de ${employee.name} (${type}, ${formatDate(date)}).`,
          file,
        });
        attachmentDocId = doc.id;
      }
      await onSave({
        id: newId("just"),
        employeeId: employee.id,
        employeeName: employee.name,
        date,
        type,
        reason: reason.trim(),
        attachmentDocId,
        attachmentName: file?.name ?? null,
        status: "Pendente",
        submittedAt: new Date().toISOString(),
        submittedBy: employee.name,
        reviewedBy: null,
        reviewedAt: null,
        reviewNote: null,
      });
    } catch (err) {
      setErrors({ form: errorMessage(err) });
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Nova justificativa"
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="just-form" className="ui-btn ui-btn-primary" disabled={saving} aria-busy={saving}>
            {saving ? "Enviando..." : "Enviar"}
          </button>
        </>
      }
    >
      <form id="just-form" onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 12 }}>
        <div className="ui-form-grid">
          <Field label="Data" error={errors.date} required>
            {(props) => <input {...props} type="date" className="ui-input" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />}
          </Field>
          <Field label="Tipo" required>
            {(props) => (
              <select {...props} className="ui-input" value={type} onChange={(e) => setType(e.target.value as Justification["type"])}>
                {JUSTIFICATION_TYPES.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <Field label="Motivo" error={errors.reason} required>
          {(props) => <textarea {...props} data-autofocus className="ui-input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />}
        </Field>
        <Field label="Atestado ou comprovante" error={errors.file} hint="Opcional. Foto ou PDF, até 8 MB — fica salvo em Documentos.">
          {(props) => <input {...props} type="file" className="ui-input" accept={ACCEPTED_FILE_TYPES} capture="environment" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />}
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
