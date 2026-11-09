"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, Download, History, House, Paperclip, Plus, Trash2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
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
import { RemindersPanel } from "./RemindersPanel";
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
    <div className={styles.financeShell}>
      <Sidebar />

      <main className={styles.financeMain}>
        <div className={styles.financeCanvas}>
          {view === "FINANCEIRO" ? (
            <>
              <div className={styles.periodControls}>
                <label className={styles.periodSelect}>
                  <span className="sr-only">Mês</span>
                  <select value={month} onChange={(e) => setMonth(Number(e.target.value))} aria-label="Mês de referência">
                    {MONTHS.map((label, index) => (
                      <option key={label} value={index + 1}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.periodSelectSmall}>
                  <span className="sr-only">Ano</span>
                  <select value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Ano de referência">
                    {yearOptions(now.getFullYear()).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <h1 className={styles.pageTitle}>FINANCEIRO</h1>

              {loadError ? (
                <p className="ui-alert ui-alert-error" role="alert" style={{ margin: "8px 0" }}>
                  {loadError}{" "}
                  <button type="button" className="ui-link" onClick={() => void load()}>
                    Tentar de novo
                  </button>
                </p>
              ) : null}

              <section className={styles.summaryGrid} aria-label={`Resumo de ${monthLabel}/${year}`} aria-busy={loading}>
                <SummaryCard label="ENTRADA:" value={loading ? "..." : formatCurrency(summary.income)} icon={<ArrowDownLeft aria-hidden="true" />} />
                <SummaryCard label="SAÍDA:" value={loading ? "..." : formatCurrency(summary.expense)} icon={<ArrowUpRight aria-hidden="true" />} />
                <SummaryCard label="SALDO:" value={loading ? "..." : formatCurrency(summary.balance)} icon={<CircleDollarSign aria-hidden="true" />} />
              </section>

              <section className={styles.transactionsGrid}>
                <TransactionPanel
                  title="ENTRADA:"
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
                  title="SAÍDA:"
                  month={monthLabel}
                  items={expenses}
                  loading={loading}
                  emptyText="Nenhuma saída neste mês."
                  actionLabel="Registrar saída"
                  onAction={canEdit ? () => setModal("expense") : undefined}
                  onDelete={canEdit ? setToDelete : undefined}
                  receipts={receiptsByMovement}
                />
              </section>
            </>
          ) : (
            <HistoryView receipts={receiptsByMovement} onBack={() => setView("FINANCEIRO")} />
          )}

          <section className={styles.bottomGrid}>
            <RemindersPanel notify={show} />

            <div className={styles.quickActions}>
              <button
                type="button"
                className={styles.quickAction}
                onClick={() => exportFinancialMovementsToCsv(movements, `${monthLabel}_${year}`)}
                title="Exportar lançamentos do mês em planilha CSV"
              >
                <Download aria-hidden="true" />
                <span>Exportar CSV</span>
              </button>
              <Link href="/imoveis" className={styles.quickAction} title="Imóveis agora têm aba própria no menu lateral">
                <House aria-hidden="true" />
                <span>Imóveis</span>
              </Link>
              <button
                type="button"
                className={`${styles.quickAction} ${view === "HISTORICO" ? styles.quickActionActive : ""}`}
                onClick={() => setView((current) => (current === "HISTORICO" ? "FINANCEIRO" : "HISTORICO"))}
                aria-pressed={view === "HISTORICO"}
              >
                <History aria-hidden="true" />
                <span>Histórico</span>
              </button>
            </div>
          </section>
        </div>
      </main>

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
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <article className={styles.summaryCard}>
      <div className={styles.summaryIcon}>{icon}</div>
      <div className={styles.summaryContent}>
        <strong>{label}</strong>
        <span>{value}</span>
      </div>
    </article>
  );
}

function TransactionPanel({
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
    <article className={styles.transactionPanel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderTitle}>
          <h2>{title}</h2>
          <span className={styles.panelMonth}>({month})</span>
        </div>
        {onAction ? (
          <button type="button" className={styles.iconButton} aria-label={actionLabel} title={actionLabel} onClick={onAction}>
            <Plus aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: 10, padding: 12 }} aria-busy="true">
          <div className="ui-skeleton" style={{ height: 36 }} />
          <div className="ui-skeleton" style={{ height: 36 }} />
        </div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>{emptyText}</div>
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
    </article>
  );
}
