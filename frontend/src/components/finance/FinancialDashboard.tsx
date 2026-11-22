"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, Download, History, Paperclip, Plus, Trash2, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { documentHref } from "@/lib/documents";
import { exportFinancialMovementsToCsv } from "@/lib/export-csv";
import {
  errorMessage,
  financialApi,
  notifyFinanceChanged,
  propertiesApi,
  type FinancialMovement,
  type FinancialSummary,
  type PropertyItem,
} from "@/lib/financial-api";
import { MONTHS, formatCurrency, formatDate } from "@/lib/format";
import { useCan } from "@/lib/permissions";
import { useRecords } from "@/lib/records";
import { documentSchema, type DocumentItem } from "@/lib/schemas";
import { HistoryView } from "./HistoryView";
import { EntryModal, ExpenseModal } from "./TransactionModals";
import styles from "@/app/financeiro/financeiro.module.css";

const emptySummary: FinancialSummary = { income: 0, expense: 0, balance: 0 };

function yearOptions(current: number) {
  return Array.from({ length: 6 }, (_, index) => current - 4 + index);
}

export function FinancialDashboard() {
  const now = new Date();
  const [view, setView] = useState<"FINANCEIRO" | "HISTORICO">("FINANCEIRO");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<FinancialSummary>(emptySummary);
  const [movements, setMovements] = useState<FinancialMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [modal, setModal] = useState<"entry" | "expense" | null>(null);
  const [toDelete, setToDelete] = useState<FinancialMovement | null>(null);
  const { show, node: toast } = useToast();
  const { items: documents } = useRecords("documents", documentSchema);
  const canEdit = useCan("edit");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [summaryData, movementData] = await Promise.all([
        financialApi.summary(month, year),
        financialApi.movements(month, year),
      ]);
      setSummary(summaryData);
      setMovements(movementData);
    } catch (error) {
      setSummary(emptySummary);
      setMovements([]);
      setLoadError(errorMessage(error, "Não foi possível carregar o financeiro."));
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga da API ao trocar o período
    void load();
  }, [load]);

  useEffect(() => {
    propertiesApi
      .list()
      .then(setProperties)
      .catch(() => setProperties([]));
  }, []);

  const receiptsByMovement = useMemo(() => {
    const map = new Map<number, DocumentItem>();
    documents.forEach((doc) => {
      if (doc.movementId !== null) map.set(doc.movementId, doc);
    });
    return map;
  }, [documents]);

  const incomes = movements.filter((item) => item.type === "INCOME");
  const expenses = movements.filter((item) => item.type === "EXPENSE");
  const monthLabel = MONTHS[month - 1];

  function handleSaved(movement: FinancialMovement, warning?: string) {
    setModal(null);
    const [y, m] = movement.date.split("-").map(Number);
    if (y !== year || m !== month) {
      setYear(y);
      setMonth(m);
    } else {
      void load();
    }
    notifyFinanceChanged();
    show(warning ?? (movement.type === "INCOME" ? "Entrada registrada." : "Saída registrada."), warning ? "error" : "success");
  }

  async function confirmDelete() {
    if (!toDelete) return;
    await financialApi.deleteTransaction(toDelete.id);
    setToDelete(null);
    notifyFinanceChanged();
    show("Movimentação excluída.");
    await load();
  }

  return (
    <AppShell>
      {view === "FINANCEIRO" ? (
        <section className="ui-page" aria-labelledby="financeiro-title">
          <div className="ui-page-header">
            <div>
              <h1 id="financeiro-title">Financeiro</h1>
              <p>Entradas e saídas de {monthLabel}/{year}, conforme os lançamentos.</p>
            </div>
            <div className="ui-row-actions">
              <label className="sr-only" htmlFor="financeiro-mes">
                Mês de referência
              </label>
              <select id="financeiro-mes" className="ui-input" style={{ width: "auto" }} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTHS.map((label, index) => (
                  <option key={label} value={index + 1}>
                    {label}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="financeiro-ano">
                Ano de referência
              </label>
              <select id="financeiro-ano" className="ui-input" style={{ width: "auto" }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {yearOptions(now.getFullYear()).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="ui-btn ui-btn-secondary"
                onClick={() => exportFinancialMovementsToCsv(movements, `${monthLabel}_${year}`)}
                disabled={loading || movements.length === 0}
                title="Exportar lançamentos do mês em planilha CSV"
              >
                <Download size={16} aria-hidden="true" /> Exportar CSV
              </button>
              <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setView("HISTORICO")}>
                <History size={16} aria-hidden="true" /> Histórico
              </button>
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

          <div className="ui-stat-grid" aria-label={`Resumo de ${monthLabel}/${year}`} aria-busy={loading}>
            <SummaryCard label="Entradas" value={loading ? "…" : formatCurrency(summary.income)} icon={ArrowDownLeft} bg="#dcfce7" color="#15803d" />
            <SummaryCard label="Saídas" value={loading ? "…" : formatCurrency(summary.expense)} icon={ArrowUpRight} bg="#fee2e2" color="#b91c1c" />
            <SummaryCard label="Saldo do mês" value={loading ? "…" : formatCurrency(summary.balance)} icon={CircleDollarSign} bg="#e0e7ff" color="#092a54" />
          </div>

          <div className={styles.transactionsGrid}>
            <TransactionPanel
              id="entradas"
              title="Entradas"
              month={monthLabel}
              items={incomes}
              loading={loading}
              emptyText="Nenhuma entrada neste mês."
              actionLabel="Registrar entrada"
              onAction={canEdit ? () => setModal("entry") : undefined}
              onDelete={canEdit ? setToDelete : undefined}
              receipts={receiptsByMovement}
            />
            <TransactionPanel
              id="saidas"
              title="Saídas"
              month={monthLabel}
              items={expenses}
              loading={loading}
              emptyText="Nenhuma saída neste mês."
              actionLabel="Registrar saída"
              onAction={canEdit ? () => setModal("expense") : undefined}
              onDelete={canEdit ? setToDelete : undefined}
              receipts={receiptsByMovement}
            />
          </div>
        </section>
      ) : (
        <HistoryView receipts={receiptsByMovement} onBack={() => setView("FINANCEIRO")} />
      )}

      {modal === "entry" ? (
        <EntryModal properties={properties} documents={documents} onClose={() => setModal(null)} onSaved={handleSaved} />
      ) : null}
      {modal === "expense" ? (
        <ExpenseModal properties={properties} documents={documents} onClose={() => setModal(null)} onSaved={handleSaved} />
      ) : null}

      {toDelete ? (
        <ConfirmDialog
          title="Excluir movimentação"
          danger
          confirmLabel="Excluir"
          message={
            <>
              Excluir <strong>{toDelete.tenantName}</strong> ({formatCurrency(toDelete.amount)} em {formatDate(toDelete.date)})? O saldo
              do mês será recalculado.
            </>
          }
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      ) : null}

      {toast}
    </AppShell>
  );
}

function SummaryCard({ label, value, icon: Icon, bg, color }: { label: string; value: string; icon: LucideIcon; bg: string; color: string }) {
  return (
    <div className="ui-card ui-stat">
      <span className="ui-stat-icon" style={{ background: bg, color }} aria-hidden="true">
        <Icon size={22} />
      </span>
      <div>
        <div className="ui-stat-label">{label}</div>
        <div className="ui-stat-value">{value}</div>
      </div>
    </div>
  );
}

function TransactionPanel({
  id,
  title,
  month,
  items,
  loading,
  emptyText,
  actionLabel,
  onAction,
  onDelete,
  receipts,
}: {
  id: string;
  title: string;
  month: string;
  items: FinancialMovement[];
  loading: boolean;
  emptyText: string;
  actionLabel: string;
  onAction?: () => void;
  onDelete?: (movement: FinancialMovement) => void;
  receipts: Map<number, DocumentItem>;
}) {
  return (
    <section className="ui-card" aria-labelledby={`financeiro-${id}`}>
      <div className={styles.panelHeader}>
        <h2 id={`financeiro-${id}`}>
          {title} <span className={styles.panelMonth}>({month})</span>
        </h2>
        {onAction ? (
          <button type="button" className="ui-btn ui-btn-primary ui-btn-sm" onClick={onAction}>
            <Plus size={14} aria-hidden="true" /> {actionLabel}
          </button>
        ) : null}
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: 10 }} aria-busy="true">
          <div className="ui-skeleton" style={{ height: 36 }} />
          <div className="ui-skeleton" style={{ height: 36 }} />
        </div>
      ) : items.length === 0 ? (
        <p className="ui-empty">{emptyText}</p>
      ) : (
        <div className={styles.movementList}>
          {items.map((item) => {
            const receipt = receipts.get(item.id);
            return (
              <div className={styles.movementRow} key={item.id}>
                <div className={styles.movementIdentity}>
                  <strong>{item.tenantName}</strong>
                  <span>
                    {item.propertyRegistration} · {formatDate(item.date)}
                    {receipt ? (
                      <>
                        {" · "}
                        <Link href={documentHref(receipt.id)} className="ui-link" title={`Abrir ${receipt.name}`}>
                          <Paperclip size={12} aria-hidden="true" style={{ verticalAlign: "middle" }} /> comprovante
                        </Link>
                      </>
                    ) : null}
                  </span>
                </div>
                <div className={styles.movementRight}>
                  <b className={item.type === "INCOME" ? styles.positiveAmount : styles.negativeAmount}>{formatCurrency(item.amount)}</b>
                  {onDelete ? (
                    <button
                      type="button"
                      className={styles.deleteRowButton}
                      title="Excluir movimentação"
                      aria-label={`Excluir movimentação de ${item.tenantName}`}
                      onClick={() => onDelete(item)}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
