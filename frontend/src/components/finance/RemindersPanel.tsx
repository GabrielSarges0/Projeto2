"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import {
  REMINDER_CATEGORIES,
  REMINDER_CATEGORY_LABEL,
  REMINDER_PRIORITIES,
  REMINDER_PRIORITY_LABEL,
  errorMessage,
  isApiError,
  notifyFinanceChanged,
  remindersApi,
  type ReminderCategory,
  type ReminderItem,
  type ReminderPriority,
  type ReminderRequest,
} from "@/lib/financial-api";
import { addDaysIso, daysUntil, formatDate, formatDateTime, todayIso } from "@/lib/format";
import { useCan } from "@/lib/permissions";
import { useSession } from "@/lib/session";
import { deadlineError, lengthError } from "@/lib/validation";
import styles from "@/app/financeiro/financeiro.module.css";

type Notify = (message: string, tone?: "success" | "error") => void;

export function deadlineLabel(reminder: Pick<ReminderItem, "dueDate" | "done">): { text: string; tone: string } {
  if (reminder.done) return { text: `Concluído · prazo ${formatDate(reminder.dueDate)}`, tone: "ui-badge-neutral" };
  const days = daysUntil(reminder.dueDate);
  if (days < 0) return { text: `Atrasado há ${-days} dia${days === -1 ? "" : "s"}`, tone: "ui-badge-danger" };
  if (days === 0) return { text: "Vence hoje", tone: "ui-badge-danger" };
  if (days <= 3) return { text: `Vence em ${days} dia${days === 1 ? "" : "s"}`, tone: "ui-badge-warning" };
  return { text: `Prazo ${formatDate(reminder.dueDate)}`, tone: "ui-badge-info" };
}

export function RemindersPanel({ notify }: { notify: Notify }) {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formTarget, setFormTarget] = useState<ReminderItem | "new" | null>(null);
  const [detail, setDetail] = useState<ReminderItem | null>(null);
  const [toDelete, setToDelete] = useState<ReminderItem | null>(null);
  const canEdit = useCan("edit");

  const load = useCallback(async () => {
    setLoadError("");
    try {
      setReminders(await remindersApi.list());
    } catch (error) {
      setLoadError(errorMessage(error, "Não foi possível carregar os lembretes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial vinda da API
    void load();
  }, [load]);

  function replace(updated: ReminderItem) {
    setReminders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setDetail((current) => (current?.id === updated.id ? updated : current));
  }

  async function toggle(reminder: ReminderItem) {
    replace({ ...reminder, done: !reminder.done });
    try {
      replace(await remindersApi.toggle(reminder.id));
      notifyFinanceChanged();
    } catch (error) {
      replace(reminder);
      notify(errorMessage(error), "error");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    await remindersApi.delete(toDelete.id);
    setReminders((current) => current.filter((item) => item.id !== toDelete.id));
    setDetail(null);
    setToDelete(null);
    notifyFinanceChanged();
    notify("Lembrete excluído.");
  }

  function saved(reminder: ReminderItem, created: boolean) {
    setReminders((current) => {
      const next = created ? [...current, reminder] : current.map((item) => (item.id === reminder.id ? reminder : item));
      return next.sort((a, b) => Number(a.done) - Number(b.done) || a.dueDate.localeCompare(b.dueDate) || a.id - b.id);
    });
    setDetail((current) => (current?.id === reminder.id ? reminder : current));
    setFormTarget(null);
    notifyFinanceChanged();
    notify(created ? "Lembrete criado." : "Lembrete atualizado.");
  }

  return (
    <section className="ui-card" aria-labelledby="lembretes-title">
      <div className={styles.panelHeader}>
        <h2 id="lembretes-title">Lembretes</h2>
        {canEdit ? (
          <button type="button" className="ui-btn ui-btn-primary ui-btn-sm" onClick={() => setFormTarget("new")}>
            <Plus size={14} aria-hidden="true" /> Novo lembrete
          </button>
        ) : null}
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: 8 }} aria-busy="true">
          <div className="ui-skeleton" style={{ height: 28 }} />
          <div className="ui-skeleton" style={{ height: 28 }} />
        </div>
      ) : loadError ? (
        <p className="ui-alert ui-alert-error" role="alert">
          {loadError}{" "}
          <button type="button" className="ui-link" onClick={() => void load()}>
            Tentar de novo
          </button>
        </p>
      ) : reminders.length === 0 ? (
        <p className="ui-empty">Nenhum lembrete aqui.{canEdit ? " Use “Novo lembrete” para criar um com data limite." : ""}</p>
      ) : (
        <ul className={styles.remindersList} style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {reminders.map((reminder) => {
            const badge = deadlineLabel(reminder);
            return (
              <li key={reminder.id} className={styles.reminderItem}>
                <div className={styles.reminderLeft}>
                  <input
                    type="checkbox"
                    className={styles.reminderCheckbox}
                    checked={reminder.done}
                    disabled={!canEdit}
                    onChange={() => void toggle(reminder)}
                    aria-label={`Marcar "${reminder.title}" como ${reminder.done ? "pendente" : "concluído"}`}
                  />
                  <button
                    type="button"
                    className={`${styles.reminderText} ${reminder.done ? styles.reminderTextDone : ""}`}
                    style={{ background: "none", border: 0, padding: 0, textAlign: "left", cursor: "pointer" }}
                    onClick={() => setDetail(reminder)}
                    title="Ver detalhes"
                  >
                    {reminder.title}
                  </button>
                  <span className={`ui-badge ${badge.tone}`} style={{ marginLeft: 8 }}>
                    {badge.text}
                  </span>
                </div>
                {canEdit ? (
                <div style={{ display: "flex", gap: 2 }}>
                  <button
                    type="button"
                    className={styles.reminderDelete}
                    onClick={() => setFormTarget(reminder)}
                    aria-label={`Editar "${reminder.title}"`}
                    title="Editar lembrete"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.reminderDelete}
                    onClick={() => setToDelete(reminder)}
                    aria-label={`Excluir "${reminder.title}"`}
                    title="Excluir lembrete"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {formTarget ? (
        <ReminderFormModal
          reminder={formTarget === "new" ? null : formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={saved}
        />
      ) : null}

      {detail && !formTarget && !toDelete ? (
        <ReminderDetailModal
          reminder={detail}
          canEdit={canEdit}
          onClose={() => setDetail(null)}
          onToggle={() => void toggle(detail)}
          onEdit={() => setFormTarget(detail)}
          onDelete={() => setToDelete(detail)}
        />
      ) : null}

      {toDelete ? (
        <ConfirmDialog
          title="Excluir lembrete"
          danger
          confirmLabel="Excluir"
          message={
            <>
              Excluir o lembrete <strong>{toDelete.title}</strong>? Esta ação não pode ser desfeita.
            </>
          }
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      ) : null}
    </section>
  );
}

type FormErrors = Partial<Record<"title" | "dueDate" | "responsible" | "description", string>>;

function ReminderFormModal({
  reminder,
  onClose,
  onSaved,
}: {
  reminder: ReminderItem | null;
  onClose: () => void;
  onSaved: (reminder: ReminderItem, created: boolean) => void;
}) {
  const session = useSession();
  const [title, setTitle] = useState(reminder?.title ?? "");
  const [dueDate, setDueDate] = useState(reminder?.dueDate ?? addDaysIso(todayIso(), 7));
  const [category, setCategory] = useState<ReminderCategory>(reminder?.category ?? "FINANCEIRO");
  const [priority, setPriority] = useState<ReminderPriority>(reminder?.priority ?? "MEDIA");
  const [responsible, setResponsible] = useState(reminder?.responsible ?? session?.user.name ?? "");
  const [description, setDescription] = useState(reminder?.description ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Na edição, manter um prazo que já venceu é permitido (o backend aplica a mesma regra).
    const keepsOldDeadline = reminder !== null && dueDate === reminder.dueDate;
    const found: FormErrors = {
      title: lengthError(title, "o título", 3, 255) ?? undefined,
      dueDate: deadlineError(dueDate, { allowPast: keepsOldDeadline }) ?? undefined,
      responsible: responsible.trim().length > 120 ? "Máximo de 120 caracteres." : undefined,
      description: description.trim().length > 1000 ? "Máximo de 1000 caracteres." : undefined,
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    const payload: ReminderRequest = {
      title: title.trim(),
      dueDate,
      category,
      priority,
      responsible: responsible.trim() || null,
      description: description.trim() || null,
    };
    setSaving(true);
    setFormError("");
    try {
      const saved = reminder ? await remindersApi.update(reminder.id, payload) : await remindersApi.create(payload);
      onSaved(saved, reminder === null);
    } catch (error) {
      if (isApiError(error) && error.fieldErrors.dueDate) setErrors((current) => ({ ...current, dueDate: error.fieldErrors.dueDate }));
      setFormError(errorMessage(error));
      setSaving(false);
    }
  }

  return (
    <Modal
      title={reminder ? "Editar lembrete" : "Novo lembrete"}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="reminder-form" className="ui-btn ui-btn-primary" disabled={saving} aria-busy={saving}>
            {saving ? "Salvando..." : "Salvar lembrete"}
          </button>
        </>
      }
    >
      <form id="reminder-form" onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 12 }}>
        <Field label="Título" error={errors.title} required>
          {(props) => (
            <input
              {...props}
              data-autofocus
              className="ui-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Vistoria no IM-003"
              maxLength={255}
            />
          )}
        </Field>
        <div className="ui-form-grid">
          <Field label="Data limite" error={errors.dueDate} required>
            {(props) => (
              <input
                {...props}
                type="date"
                className="ui-input"
                value={dueDate}
                min={reminder && reminder.dueDate < todayIso() ? reminder.dueDate : todayIso()}
                onChange={(e) => setDueDate(e.target.value)}
              />
            )}
          </Field>
          <Field label="Responsável" error={errors.responsible}>
            {(props) => (
              <input {...props} className="ui-input" value={responsible} onChange={(e) => setResponsible(e.target.value)} maxLength={120} />
            )}
          </Field>
          <Field label="Categoria">
            {(props) => (
              <select {...props} className="ui-input" value={category} onChange={(e) => setCategory(e.target.value as ReminderCategory)}>
                {REMINDER_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {REMINDER_CATEGORY_LABEL[value]}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Prioridade">
            {(props) => (
              <select {...props} className="ui-input" value={priority} onChange={(e) => setPriority(e.target.value as ReminderPriority)}>
                {REMINDER_PRIORITIES.map((value) => (
                  <option key={value} value={value}>
                    {REMINDER_PRIORITY_LABEL[value]}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <Field label="Descrição" error={errors.description} hint="Opcional. Até 1000 caracteres.">
          {(props) => (
            <textarea {...props} className="ui-input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
          )}
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

function ReminderDetailModal({
  reminder,
  canEdit,
  onClose,
  onToggle,
  onEdit,
  onDelete,
}: {
  reminder: ReminderItem;
  canEdit: boolean;
  onClose: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const badge = deadlineLabel(reminder);
  return (
    <Modal
      title="Detalhes do lembrete"
      onClose={onClose}
      footer={
        canEdit ? (
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onDelete} style={{ color: "var(--ui-danger)" }}>
            <Trash2 size={16} aria-hidden="true" /> Excluir
          </button>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onToggle}>
            {reminder.done ? "Marcar como pendente" : "Marcar como concluído"}
          </button>
          <button type="button" className="ui-btn ui-btn-primary" onClick={onEdit}>
            <Pencil size={16} aria-hidden="true" /> Editar
          </button>
        </>
        ) : undefined
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 18, color: "var(--ui-text)" }}>{reminder.title}</h3>
        <span className={`ui-badge ${badge.tone}`}>
          <CalendarClock size={13} aria-hidden="true" /> {badge.text}
        </span>
      </div>
      <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, margin: 0 }}>
        <Info label="Data limite" value={formatDate(reminder.dueDate)} />
        <Info label="Categoria" value={REMINDER_CATEGORY_LABEL[reminder.category]} />
        <Info label="Prioridade" value={REMINDER_PRIORITY_LABEL[reminder.priority]} />
        <Info label="Responsável" value={reminder.responsible ?? "—"} />
        <Info label="Status" value={reminder.done ? "Concluído" : "Pendente"} />
        <Info label="Criado em" value={formatDateTime(reminder.createdAt)} />
      </dl>
      <div>
        <span className="ui-label">Descrição</span>
        <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: "20px", whiteSpace: "pre-wrap" }}>
          {reminder.description || "Sem descrição."}
        </p>
      </div>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--ui-surface-muted)", padding: "8px 10px", borderRadius: 8 }}>
      <dt style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{value}</dd>
    </div>
  );
}
