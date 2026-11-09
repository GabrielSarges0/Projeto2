"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertTriangle, BellRing, Clock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { ALERT_KINDS, ALERT_KIND_LABEL, saveAlertPrefs, useAlerts, type AlertKind, type AlertPrefs } from "@/lib/alerts";
import { errorMessage } from "@/lib/financial-api";
import { useCan } from "@/lib/permissions";

export default function AlertasPage() {
  const { alerts, prefs, loading } = useAlerts();
  const [filter, setFilter] = useState<AlertKind | "ALL">("ALL");
  const visible = alerts.filter((alert) => filter === "ALL" || alert.kind === filter);
  const critical = alerts.filter((alert) => alert.severity === "critical").length;
  // O toast fica na página: o formulário é remontado quando as preferências salvas voltam do servidor.
  const { show, node: toast } = useToast();

  return (
    <AppShell>
      <section className="ui-page" aria-labelledby="alertas-title">
        <div className="ui-page-header">
          <div>
            <h1 id="alertas-title">Alertas de prazo</h1>
            <p>O que vence ou já venceu: lembretes, contratos, envios ao Ministério Público, estoque e justificativas.</p>
          </div>
        </div>

        <div className="ui-stat-grid">
          <div className="ui-card ui-stat">
            <span className="ui-stat-icon" style={{ background: "#fee2e2", color: "#b91c1c" }} aria-hidden="true">
              <AlertTriangle size={22} />
            </span>
            <div>
              <div className="ui-stat-label">Atrasados / críticos</div>
              <div className="ui-stat-value">{loading ? "…" : critical}</div>
            </div>
          </div>
          <div className="ui-card ui-stat">
            <span className="ui-stat-icon" style={{ background: "#fef3c7", color: "#a16207" }} aria-hidden="true">
              <Clock size={22} />
            </span>
            <div>
              <div className="ui-stat-label">Vencendo em breve</div>
              <div className="ui-stat-value">{loading ? "…" : alerts.length - critical}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))", gap: 16, alignItems: "start" }}>
          <section className="ui-card" aria-labelledby="lista-alertas">
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
              <h2 id="lista-alertas" style={{ margin: 0, fontSize: 17, color: "var(--ui-primary)" }}>
                Alertas ativos ({visible.length})
              </h2>
              <div className="ui-field" style={{ minWidth: 200 }}>
                <label htmlFor="alerta-tipo">Tipo</label>
                <select id="alerta-tipo" className="ui-input" value={filter} onChange={(e) => setFilter(e.target.value as AlertKind | "ALL")}>
                  <option value="ALL">Todos</option>
                  {ALERT_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {ALERT_KIND_LABEL[kind]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {loading && alerts.length === 0 ? (
              <div className="ui-skeleton" style={{ height: 120 }} aria-busy="true" />
            ) : visible.length === 0 ? (
              <p className="ui-empty">
                <BellRing size={18} aria-hidden="true" style={{ verticalAlign: "middle" }} /> Nenhum alerta. Tudo em dia.
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                {visible.map((alert) => (
                  <li key={alert.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                    <span className={`ui-badge ${alert.severity === "critical" ? "ui-badge-danger" : "ui-badge-warning"}`} style={{ flexShrink: 0 }}>
                      {alert.severity === "critical" ? "Crítico" : "Aviso"}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <Link href={alert.href} className="ui-link" style={{ display: "block" }}>
                        {alert.title}
                      </Link>
                      <span className="ui-field-hint">
                        {ALERT_KIND_LABEL[alert.kind]} · {alert.detail}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <PreferencesForm key={JSON.stringify(prefs)} prefs={prefs} onSaved={() => show("Preferências de alerta salvas.")} />
        </div>
      </section>
      {toast}
    </AppShell>
  );
}

function PreferencesForm({ prefs, onSaved }: { prefs: AlertPrefs; onSaved: () => void }) {
  const canReview = useCan("review");
  const [draft, setDraft] = useState<AlertPrefs>(prefs);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await saveAlertPrefs(draft);
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const numberField = (key: "reminderDays" | "contractDays" | "mpDays", label: string, min: number, max: number) => (
    <Field label={label} hint={`De ${min} a ${max} dias.`}>
      {(props) => (
        <input
          {...props}
          type="number"
          className="ui-input"
          min={min}
          max={max}
          value={draft[key]}
          onChange={(e) => setDraft({ ...draft, [key]: Math.min(max, Math.max(min, Number(e.target.value) || min)) })}
        />
      )}
    </Field>
  );

  return (
    <form className="ui-card" onSubmit={handleSubmit} aria-labelledby="pref-alertas" style={{ display: "grid", gap: 12 }}>
      <h2 id="pref-alertas" style={{ margin: 0, fontSize: 17, color: "var(--ui-primary)" }}>
        Quais alertas você quer ver
      </h2>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 6 }}>
        <legend className="sr-only">Tipos de alerta</legend>
        {ALERT_KINDS.filter((kind) => kind !== "justifications" || canReview).map((kind) => (
          <label key={kind} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, minHeight: 28 }}>
            <input
              type="checkbox"
              checked={draft.enabled[kind]}
              onChange={(e) => setDraft({ ...draft, enabled: { ...draft.enabled, [kind]: e.target.checked } })}
            />
            {ALERT_KIND_LABEL[kind]}
          </label>
        ))}
      </fieldset>
      <div className="ui-form-grid-3">
        {numberField("reminderDays", "Lembretes: avisar com", 0, 30)}
        {numberField("contractDays", "Contratos: avisar com", 7, 120)}
        {numberField("mpDays", "Envios ao MP: avisar com", 1, 60)}
      </div>
      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={Boolean(draft.emailNotifications)}
            onChange={(e) => setDraft({ ...draft, emailNotifications: e.target.checked })}
          />
          Receber resumo diário de alertas por e-mail
        </label>
      </div>
      <p className="ui-field-hint" style={{ margin: 0 }}>
        As preferências valem para a sua conta, em qualquer computador. O envio por e-mail depende de configurar um serviço de e-mail no servidor.
      </p>
      {error ? (
        <p className="ui-alert ui-alert-error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="ui-btn ui-btn-primary" style={{ justifySelf: "start" }} disabled={saving} aria-busy={saving}>
        {saving ? "Salvando..." : "Salvar preferências"}
      </button>
    </form>
  );
}
