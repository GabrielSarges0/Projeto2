"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, Building2, Home, KeyRound, Wrench } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { deadlineLabel } from "@/components/finance/RemindersPanel";
import { AppShell } from "@/components/layout/AppShell";
import {
  FINANCE_CHANGED_EVENT,
  errorMessage,
  financialApi,
  propertiesApi,
  remindersApi,
  type FinancialMovement,
  type FinancialSummary,
  type PropertyMetrics,
  type ReminderItem,
} from "@/lib/financial-api";
import { MONTHS, daysUntil, formatCurrency, formatDate, todayIso } from "@/lib/format";
import { useRecords } from "@/lib/records";
import { clientSchema, mpSubmissionSchema } from "@/lib/schemas";

// Paleta validada (scripts/validate_palette.js da skill de dataviz): azul = receitas, laranja = despesas.
const INCOME_COLOR = "#1d4ed8";
const EXPENSE_COLOR = "#c2410c";

type ChartPoint = { day: number; receitas: number; despesas: number };

function cumulativeByDay(movements: FinancialMovement[], month: number, year: number): ChartPoint[] {
  const lastDay = new Date(year, month, 0).getDate();
  const today = todayIso();
  const isCurrentMonth = today.startsWith(`${year}-${String(month).padStart(2, "0")}`);
  const untilDay = isCurrentMonth ? Number(today.slice(8, 10)) : lastDay;
  const incomeByDay = new Array<number>(lastDay + 1).fill(0);
  const expenseByDay = new Array<number>(lastDay + 1).fill(0);
  movements.forEach((movement) => {
    const day = Number(movement.date.slice(8, 10));
    const cents = Math.round(movement.amount * 100);
    if (movement.type === "INCOME") incomeByDay[day] += cents;
    else expenseByDay[day] += cents;
  });
  const points: ChartPoint[] = [];
  let income = 0;
  let expense = 0;
  for (let day = 1; day <= untilDay; day += 1) {
    income += incomeByDay[day];
    expense += expenseByDay[day];
    points.push({ day, receitas: income / 100, despesas: expense / 100 });
  }
  return points;
}

export function DashboardHome() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [movements, setMovements] = useState<FinancialMovement[]>([]);
  const [metrics, setMetrics] = useState<PropertyMetrics | null>(null);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTable, setShowTable] = useState(false);
  const { items: clients } = useRecords("clients", clientSchema);
  const { items: submissions } = useRecords("mp-submissions", mpSubmissionSchema);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const results = await Promise.allSettled([
      financialApi.summary(month, year),
      financialApi.movements(month, year),
      propertiesApi.metrics(),
      remindersApi.list(),
    ]);
    const [summaryRes, movementsRes, metricsRes, remindersRes] = results;
    if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);
    if (movementsRes.status === "fulfilled") setMovements(movementsRes.value);
    if (metricsRes.status === "fulfilled") setMetrics(metricsRes.value);
    if (remindersRes.status === "fulfilled") setReminders(remindersRes.value);
    const failed = results.find((result) => result.status === "rejected");
    if (failed && failed.status === "rejected") setError(errorMessage(failed.reason, "Parte dos dados não carregou."));
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga da API ao trocar o período
    void load();
    const onChange = () => void load();
    window.addEventListener(FINANCE_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(FINANCE_CHANGED_EVENT, onChange);
  }, [load]);

  const chart = useMemo(() => cumulativeByDay(movements, month, year), [movements, month, year]);
  const expiring = clients
    .filter((client) => {
      const days = daysUntil(client.contractEndDate);
      return client.contractStatus !== "Encerrado" && days >= 0 && days <= 30;
    })
    .sort((a, b) => a.contractEndDate.localeCompare(b.contractEndDate));
  const pendingReminders = reminders.filter((reminder) => !reminder.done).slice(0, 5);
  const pendingMp = submissions.filter((item) => item.status === "Pendente" || item.status === "Em revisão").sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4);

  const cards = [
    { label: "Total de imóveis", value: metrics?.totalProperties, icon: Building2, href: "/imoveis" },
    { label: "Ocupados", value: metrics?.occupied, icon: KeyRound, href: "/imoveis" },
    { label: "Disponíveis", value: metrics?.available, icon: Home, href: "/imoveis" },
    { label: "Em manutenção", value: metrics?.underMaintenance, icon: Wrench, href: "/imoveis" },
    { label: `Saldo de ${MONTHS[month - 1]}`, value: summary ? formatCurrency(summary.balance) : undefined, icon: Banknote, href: "/financeiro" },
  ];

  return (
    <AppShell>
      <section className="ui-page" aria-labelledby="painel-title">
        <div className="ui-page-header">
          <h1 id="painel-title">Painel</h1>
          <div className="ui-row-actions">
            <label className="sr-only" htmlFor="painel-mes">
              Mês
            </label>
            <select id="painel-mes" className="ui-input" style={{ width: "auto" }} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((label, index) => (
                <option key={label} value={index + 1}>
                  {label}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="painel-ano">
              Ano
            </label>
            <select id="painel-ano" className="ui-input" style={{ width: "auto" }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {Array.from({ length: 6 }, (_, index) => now.getFullYear() - 4 + index).map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {error}{" "}
            <button type="button" className="ui-link" onClick={() => void load()}>
              Tentar de novo
            </button>
          </p>
        ) : null}

        <div className="ui-stat-grid">
          {cards.map(({ label, value, icon: Icon, href }) => (
            <Link key={label} href={href} className="ui-card ui-stat" style={{ color: "inherit" }}>
              <span className="ui-stat-icon" style={{ background: "#3c8dbc", color: "#fff" }} aria-hidden="true">
                <Icon size={22} />
              </span>
              <span>
                <span className="ui-stat-label" style={{ display: "block" }}>
                  {label}
                </span>
                <span className="ui-stat-value" style={{ fontSize: typeof value === "string" ? 20 : undefined }}>
                  {loading && value === undefined ? "…" : (value ?? "—")}
                </span>
              </span>
            </Link>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 16 }}>
          <section className="ui-card" aria-labelledby="grafico-title" style={{ minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <h2 id="grafico-title" style={{ margin: 0, fontSize: 18, color: "var(--ui-primary)" }}>
                  Receitas x despesas
                </h2>
                <p className="ui-field-hint" style={{ margin: "2px 0 0" }}>
                  Acumulado de {MONTHS[month - 1]}/{year}, dia a dia, conforme os lançamentos
                </p>
              </div>
              <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => setShowTable((v) => !v)} aria-pressed={showTable}>
                {showTable ? "Ver gráfico" : "Ver como tabela"}
              </button>
            </div>
            <p style={{ margin: "10px 0", fontSize: 14 }}>
              Receitas <strong>{formatCurrency(summary?.income ?? 0)}</strong> · Despesas <strong>{formatCurrency(summary?.expense ?? 0)}</strong>
            </p>
            {loading ? (
              <div className="ui-skeleton" style={{ height: 260 }} />
            ) : movements.length === 0 ? (
              <p className="ui-empty">Nenhum lançamento neste mês. O gráfico aparece assim que houver entradas ou saídas.</p>
            ) : showTable ? (
              <div className="ui-table-wrap" style={{ maxHeight: 280, overflowY: "auto" }}>
                <table className="ui-table" style={{ minWidth: 0 }}>
                  <thead>
                    <tr>
                      <th scope="col">Dia</th>
                      <th scope="col">Receitas acumuladas</th>
                      <th scope="col">Despesas acumuladas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chart.map((point) => (
                      <tr key={point.day}>
                        <td>{point.day}</td>
                        <td>{formatCurrency(point.receitas)}</td>
                        <td>{formatCurrency(point.despesas)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ width: "100%", height: 260 }} role="img" aria-label={`Gráfico de receitas e despesas acumuladas em ${MONTHS[month - 1]} de ${year}`}>
                <ResponsiveContainer>
                  <LineChart data={chart} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#475569" }} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#475569" }}
                      tickLine={false}
                      axisLine={false}
                      width={72}
                      tickFormatter={(value: number) => new Intl.NumberFormat("pt-BR", { notation: "compact", style: "currency", currency: "BRL" }).format(value)}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      labelFormatter={(day) => `Dia ${day}`}
                      contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <Line type="monotone" dataKey="receitas" name="Receitas" stroke={INCOME_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="despesas" name="Despesas" stroke={EXPENSE_COLOR} strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
            <section className="ui-card" aria-labelledby="contratos-title">
              <h2 id="contratos-title" style={{ margin: "0 0 8px", fontSize: 17, color: "var(--ui-primary)" }}>
                Contratos a vencer (30 dias)
              </h2>
              {expiring.length === 0 ? (
                <p className="ui-field-hint">Nenhum contrato vencendo nos próximos 30 dias.</p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6, fontSize: 14 }}>
                  {expiring.map((client) => (
                    <li key={client.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <Link href={`/clientes?cliente=${client.id}`} className="ui-link">
                        {client.name}
                      </Link>
                      <span className="ui-field-hint">
                        {client.propertyCode} · {formatDate(client.contractEndDate)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="ui-card" aria-labelledby="lembretes-title">
              <h2 id="lembretes-title" style={{ margin: "0 0 8px", fontSize: 17, color: "var(--ui-primary)" }}>
                Lembretes pendentes
              </h2>
              {pendingReminders.length === 0 ? (
                <p className="ui-field-hint">Nenhum lembrete pendente.</p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6, fontSize: 14 }}>
                  {pendingReminders.map((reminder) => {
                    const badge = deadlineLabel(reminder);
                    return (
                      <li key={reminder.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                        <span>{reminder.title}</span>
                        <span className={`ui-badge ${badge.tone}`}>{badge.text}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link href="/financeiro" className="ui-link" style={{ display: "inline-block", marginTop: 8, fontSize: 13 }}>
                Gerenciar lembretes
              </Link>
            </section>

            <section className="ui-card" aria-labelledby="mp-pend-title">
              <h2 id="mp-pend-title" style={{ margin: "0 0 8px", fontSize: 17, color: "var(--ui-primary)" }}>
                Ministério Público
              </h2>
              {pendingMp.length === 0 ? (
                <p className="ui-field-hint">Nenhum envio pendente.</p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6, fontSize: 14 }}>
                  {pendingMp.map((item) => (
                    <li key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <span>
                        {item.title} <span className="ui-field-hint">({item.referencePeriod})</span>
                      </span>
                      <span className="ui-field-hint">prazo {formatDate(item.dueDate)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/ministerio-publico" className="ui-link" style={{ display: "inline-block", marginTop: 8, fontSize: 13 }}>
                Abrir prestação de contas
              </Link>
            </section>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
