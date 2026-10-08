"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  History,
  House,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  financialApi,
  type CreateExpenseRequest,
  type CreateIncomeRequest,
  type FinancialMovement,
  type FinancialSummary,
} from "@/lib/financial-api";
import styles from "@/app/financeiro/financeiro.module.css";

type DocumentType = "CPF" | "CNPJ";

type EntryForm = {
  documentType: DocumentType;
  tenantName: string;
  document: string;
  propertyRegistration: string;
  date: string;
  grossTotal: string;
};

type ExpenseForm = {
  description: string;
  propertyRegistration: string;
  date: string;
  grossTotal: string;
};

const initialForm: EntryForm = {
  documentType: "CPF",
  tenantName: "",
  document: "",
  propertyRegistration: "",
  date: "",
  grossTotal: "",
};

const initialExpenseForm: ExpenseForm = {
  description: "",
  propertyRegistration: "",
  date: "",
  grossTotal: "",
};

const emptySummary: FinancialSummary = {
  income: 0,
  expense: 0,
  balance: 0,
};

const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function displayDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function parseMoney(value: string) {
  const cleaned = value
    .replace(/\s/g, "")
    .replace(/^R\$/i, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");

  return Number(cleaned);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível comunicar com o backend Java.";
}

export function FinancialDashboard() {
  const now = new Date();
  const [month, setMonth] = useState(months[now.getMonth()]);
  const [year, setYear] = useState(String(now.getFullYear()));
  const [summary, setSummary] = useState<FinancialSummary>(emptySummary);
  const [movements, setMovements] = useState<FinancialMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [screenMessage, setScreenMessage] = useState("");

  const [entryMenuOpen, setEntryMenuOpen] = useState(false);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [form, setForm] = useState<EntryForm>(initialForm);
  const [formMessage, setFormMessage] = useState("");

  const [expenseMenuOpen, setExpenseMenuOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(initialExpenseForm);
  const [expenseFormMessage, setExpenseFormMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const selectedMonth = months.indexOf(month) + 1;
  const selectedYear = Number(year);

  useEffect(() => {
    let active = true;

    void Promise.all([
      financialApi.summary(selectedMonth, selectedYear),
      financialApi.movements(selectedMonth, selectedYear),
    ])
      .then(([summaryData, movementData]) => {
        if (!active) return;
        setSummary(summaryData);
        setMovements(movementData);
        setApiError("");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setSummary(emptySummary);
        setMovements([]);
        setApiError(errorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedMonth, selectedYear]);

  async function refreshFinanceFromEvent() {
    setLoading(true);
    setApiError("");

    try {
      const [summaryData, movementData] = await Promise.all([
        financialApi.summary(selectedMonth, selectedYear),
        financialApi.movements(selectedMonth, selectedYear),
      ]);

      setSummary(summaryData);
      setMovements(movementData);
    } catch (error) {
      setSummary(emptySummary);
      setMovements([]);
      setApiError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const incomes = useMemo(
    () => movements.filter((movement) => movement.type === "INCOME"),
    [movements],
  );

  const expenses = useMemo(
    () => movements.filter((movement) => movement.type === "EXPENSE"),
    [movements],
  );

  function changeMonth(nextMonth: string) {
    setLoading(true);
    setApiError("");
    setMonth(nextMonth);
  }

  function changeYear(nextYear: string) {
    setLoading(true);
    setApiError("");
    setYear(nextYear);
  }

  function openEntryModal() {
    setEntryMenuOpen(false);
    setFormMessage("");
    setEntryModalOpen(true);
  }

  function closeEntryModal() {
    if (submitting) return;
    setEntryModalOpen(false);
    setFormMessage("");
  }

  function openExpenseModal() {
    setExpenseMenuOpen(false);
    setExpenseFormMessage("");
    setExpenseModalOpen(true);
  }

  function closeExpenseModal() {
    if (submitting) return;
    setExpenseModalOpen(false);
    setExpenseFormMessage("");
  }

  function resetForm() {
    setForm(initialForm);
    setFormMessage("");
  }

  function resetExpenseForm() {
    setExpenseForm(initialExpenseForm);
    setExpenseFormMessage("");
  }

  async function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");
    setScreenMessage("");

    if (
      !form.tenantName.trim() ||
      !form.document.trim() ||
      !form.propertyRegistration.trim() ||
      !form.date ||
      !form.grossTotal.trim()
    ) {
      setFormMessage("Preencha os campos obrigatórios antes de finalizar.");
      return;
    }

    const grossAmount = parseMoney(form.grossTotal);
    if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
      setFormMessage("Informe um valor bruto maior que zero.");
      return;
    }

    const payload: CreateIncomeRequest = {
      documentType: form.documentType,
      tenantName: form.tenantName.trim(),
      documentNumber: form.document.trim(),
      propertyRegistration: form.propertyRegistration.trim(),
      transactionDate: form.date,
      grossAmount,
    };

    setSubmitting(true);

    try {
      await financialApi.createIncome(payload);
      resetForm();
      setEntryModalOpen(false);
      setScreenMessage("Entrada registrada no backend com sucesso.");
      await refreshFinanceFromEvent();
    } catch (error) {
      setFormMessage(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setExpenseFormMessage("");
    setScreenMessage("");

    if (
      !expenseForm.description.trim() ||
      !expenseForm.propertyRegistration.trim() ||
      !expenseForm.date ||
      !expenseForm.grossTotal.trim()
    ) {
      setExpenseFormMessage("Preencha todos os campos obrigatórios.");
      return;
    }

    const grossAmount = parseMoney(expenseForm.grossTotal);
    if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
      setExpenseFormMessage("Informe um valor bruto maior que zero.");
      return;
    }

    const payload: CreateExpenseRequest = {
      description: expenseForm.description.trim(),
      propertyRegistration: expenseForm.propertyRegistration.trim(),
      transactionDate: expenseForm.date,
      grossAmount,
    };

    setSubmitting(true);

    try {
      await financialApi.createExpense(payload);
      resetExpenseForm();
      setExpenseModalOpen(false);
      setScreenMessage("Saída registrada no backend com sucesso.");
      await refreshFinanceFromEvent();
    } catch (error) {
      setExpenseFormMessage(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTransaction(id: number, description: string) {
    if (!window.confirm(`Deseja realmente excluir a movimentação "${description}"?`)) {
      return;
    }

    setLoading(true);
    setApiError("");
    setScreenMessage("");

    try {
      await financialApi.deleteTransaction(id);
      setScreenMessage("Movimentação excluída com sucesso.");
      await refreshFinanceFromEvent();
    } catch (error) {
      setApiError(errorMessage(error));
      setLoading(false);
    }
  }

  return (
    <div className={styles.financeShell}>
      <Sidebar />

      <main className={styles.financeMain}>
        <div className={styles.financeCanvas}>
          <div className={styles.periodControls} aria-label="Periodo financeiro">
            <label className={styles.periodSelect}>
              <select aria-label="Mes" value={month} onChange={(event) => changeMonth(event.target.value)}>
                {months.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.periodSelectSmall}>
              <select aria-label="Ano" value={year} onChange={(event) => changeYear(event.target.value)}>
                {[2025, 2026, 2027].map((item) => (
                  <option key={item} value={String(item)}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <h1 className={styles.pageTitle}>PAINEL FINANCEIRO</h1>

          <div className={styles.integrationStatus} aria-live="polite">
            {loading ? <span>Carregando dados...</span> : null}
            {!loading && apiError ? <span className={styles.integrationError}>{apiError}</span> : null}
            {!loading && !apiError && screenMessage ? (
              <span className={styles.integrationSuccess}>{screenMessage}</span>
            ) : null}
          </div>

          <section className={styles.summaryGrid} aria-label="Resumo financeiro">
            <SummaryCard
              label="Entrada:"
              value={currency(summary.income)}
              icon={<ArrowDownLeft aria-hidden="true" />}
            />
            <SummaryCard
              label="Saída:"
              value={currency(summary.expense)}
              icon={<ArrowUpRight aria-hidden="true" />}
            />
            <SummaryCard
              label="Saldo:"
              value={currency(summary.balance)}
              icon={<CircleDollarSign aria-hidden="true" />}
            />
          </section>

          <section className={styles.transactionsGrid}>
            <TransactionPanel
              title="ENTRADAS:"
              items={incomes}
              emptyText="Nenhuma entrada aqui."
              actionLabel="Adicionar entrada"
              onAction={() => setEntryMenuOpen((value) => !value)}
              onDelete={handleDeleteTransaction}
            >
              {entryMenuOpen ? (
                <button
                  type="button"
                  className={styles.manualEntryButton}
                  onClick={openEntryModal}
                >
                  Registrar Manualmente
                </button>
              ) : null}
            </TransactionPanel>

            <TransactionPanel
              title="SAÍDAS:"
              items={expenses}
              emptyText="Nenhuma saída aqui."
              actionLabel="Adicionar saída"
              onAction={() => setExpenseMenuOpen((value) => !value)}
              onDelete={handleDeleteTransaction}
            >
              {expenseMenuOpen ? (
                <button
                  type="button"
                  className={styles.manualEntryButton}
                  onClick={openExpenseModal}
                >
                  Registrar Manualmente
                </button>
              ) : null}
            </TransactionPanel>
          </section>

          <section className={styles.bottomGrid}>
            <div className={styles.remindersPanel}>
              <div className={styles.panelHeader}>
                <h2>LEMBRETES:</h2>
                <button type="button" className={styles.iconButton} aria-label="Adicionar lembrete">
                  <Plus aria-hidden="true" />
                </button>
              </div>
              <div className={styles.reminderEmpty}>Nenhum lembrete aqui</div>
            </div>

            <div className={styles.quickActions}>
              <Link href="/imoveis" className={styles.quickAction}>
                <House aria-hidden="true" />
                <span>Imóveis</span>
              </Link>
              <Link href="/financeiro#historico" className={styles.quickAction}>
                <History aria-hidden="true" />
                <span>Histórico</span>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {entryModalOpen ? (
        <EntryModal
          form={form}
          message={formMessage}
          submitting={submitting}
          onChange={setForm}
          onClose={closeEntryModal}
          onReset={resetForm}
          onSubmit={submitEntry}
        />
      ) : null}

      {expenseModalOpen ? (
        <ExpenseModal
          form={expenseForm}
          message={expenseFormMessage}
          submitting={submitting}
          onChange={setExpenseForm}
          onClose={closeExpenseModal}
          onReset={resetExpenseForm}
          onSubmit={submitExpense}
        />
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
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
  items,
  emptyText,
  actionLabel,
  actionTitle,
  onAction,
  onDelete,
  children,
}: {
  title: string;
  items: FinancialMovement[];
  emptyText: string;
  actionLabel: string;
  actionTitle?: string;
  onAction: () => void;
  onDelete?: (id: number, description: string) => void;
  children?: ReactNode;
}) {
  return (
    <article className={styles.transactionPanel}>
      <div className={styles.panelHeader}>
        <h2>{title}</h2>
        <button
          type="button"
          className={styles.iconButton}
          aria-label={actionLabel}
          title={actionTitle}
          onClick={onAction}
        >
          <Plus aria-hidden="true" />
        </button>
      </div>

      {children}

      {items.length === 0 ? (
        <div className={styles.emptyState}>{emptyText}</div>
      ) : (
        <div className={styles.movementList}>
          {items.map((item) => (
            <div className={styles.movementRow} key={item.id}>
              <div className={styles.movementIdentity}>
                <strong>{item.tenantName}</strong>
                <span>
                  {item.propertyRegistration} · {displayDate(item.date)}
                </span>
              </div>
              <div className={styles.movementRight}>
                <b className={item.type === "INCOME" ? styles.positiveAmount : styles.negativeAmount}>
                  {currency(item.amount)}
                </b>
                {onDelete ? (
                  <button
                    type="button"
                    className={styles.deleteRowButton}
                    title="Excluir movimentação"
                    aria-label={`Excluir movimentação de ${item.tenantName}`}
                    onClick={() => onDelete(item.id, item.tenantName)}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.fakeScrollbar} aria-hidden="true">
        <span />
      </div>
    </article>
  );
}

function EntryModal({
  form,
  message,
  submitting,
  onChange,
  onClose,
  onReset,
  onSubmit,
}: {
  form: EntryForm;
  message: string;
  submitting: boolean;
  onChange: (form: EntryForm) => void;
  onClose: () => void;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  function patch<K extends keyof EntryForm>(key: K, value: EntryForm[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div className={styles.modalOverlay} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.entryModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Fechar"
          disabled={submitting}
        >
          <X aria-hidden="true" />
        </button>

        <h2 id="entry-modal-title" className={styles.modalTitle}>
          REGISTRO DE ENTRADA
        </h2>

        <form onSubmit={onSubmit} className={styles.entryForm}>
          <div className={styles.formColumn}>
            <fieldset className={styles.formBlock}>
              <legend>INQUILINO:</legend>
              <div className={styles.documentTypeRow}>
                <label>
                  CPF:
                  <input
                    type="radio"
                    name="documentType"
                    checked={form.documentType === "CPF"}
                    onChange={() => patch("documentType", "CPF")}
                  />
                </label>
                <label>
                  CNPJ:
                  <input
                    type="radio"
                    name="documentType"
                    checked={form.documentType === "CNPJ"}
                    onChange={() => patch("documentType", "CNPJ")}
                  />
                </label>
                <button
                  type="button"
                  className={styles.clearDocumentType}
                  aria-label="Limpar identificacao"
                  onClick={() => onChange({ ...form, tenantName: "", document: "" })}
                  disabled={submitting}
                >
                  <X aria-hidden="true" />
                </button>
              </div>

              <input
                className={styles.textInput}
                value={form.tenantName}
                onChange={(event) => patch("tenantName", event.target.value)}
                placeholder="NOME INQUILINO"
                aria-label="Nome do inquilino"
                maxLength={160}
                required
                disabled={submitting}
              />
              <input
                className={`${styles.textInput} ${styles.shortInput}`}
                value={form.document}
                onChange={(event) => patch("document", event.target.value)}
                placeholder="CPF/CNPJ"
                aria-label={form.documentType}
                inputMode="numeric"
                required
                disabled={submitting}
              />
            </fieldset>

            <label className={styles.formBlock}>
              <span className={styles.blockTitle}>IMÓVEL:</span>
              <input
                className={styles.textInput}
                value={form.propertyRegistration}
                onChange={(event) => patch("propertyRegistration", event.target.value)}
                placeholder="REGISTRO DO IMÓVEL"
                maxLength={80}
                required
                disabled={submitting}
              />
            </label>

            <label className={`${styles.formBlock} ${styles.dateBlock}`}>
              <span className={styles.blockTitle}>DATA:</span>
              <span className={styles.dateInputWrap}>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => patch("date", event.target.value)}
                  required
                  disabled={submitting}
                />
                <CalendarDays aria-hidden="true" />
              </span>
            </label>
          </div>

          <div className={styles.formColumn}>
            <div className={styles.inlineRuleBlock}>
              <span className={styles.blockTitle}>ENCARGOS:</span>
              <button
                type="button"
                className={styles.rulePlus}
                title="Regra de encargos ainda não definida."
                aria-label="Encargos — regra ainda não definida"
              >
                <Plus aria-hidden="true" />
              </button>
            </div>

            <div className={styles.inlineRuleBlock}>
              <span className={styles.blockTitle}>MULTAS:</span>
              <button
                type="button"
                className={styles.rulePlus}
                title="Regra de multas ainda não definida."
                aria-label="Multas — regra ainda não definida"
              >
                <Plus aria-hidden="true" />
              </button>
            </div>

            <label className={styles.formBlock}>
              <span className={styles.blockTitle}>TOTAL BRUTO:</span>
              <input
                className={`${styles.textInput} ${styles.moneyInput}`}
                inputMode="decimal"
                value={form.grossTotal}
                onChange={(event) => patch("grossTotal", event.target.value)}
                placeholder="R$ 000.000.000,0"
                required
                disabled={submitting}
              />
            </label>

            <button
              type="button"
              className={styles.netValueButton}
              title="Cálculo do valor líquido automático."
            >
              Valor Líquido
            </button>
          </div>

          {message ? <p className={styles.formMessage}>{message}</p> : null}

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onReset}
              disabled={submitting}
            >
              Limpar Tudo
            </button>
            <button type="submit" className={styles.primaryButton} disabled={submitting}>
              {submitting ? "SALVANDO..." : "FINALIZAR"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ExpenseModal({
  form,
  message,
  submitting,
  onChange,
  onClose,
  onReset,
  onSubmit,
}: {
  form: ExpenseForm;
  message: string;
  submitting: boolean;
  onChange: (form: ExpenseForm) => void;
  onClose: () => void;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  function patch<K extends keyof ExpenseForm>(key: K, value: ExpenseForm[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div className={styles.modalOverlay} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.entryModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Fechar"
          disabled={submitting}
        >
          <X aria-hidden="true" />
        </button>

        <h2 id="expense-modal-title" className={styles.modalTitle}>
          REGISTRO DE SAÍDA / DESPESA
        </h2>

        <form onSubmit={onSubmit} className={styles.entryForm}>
          <div className={styles.formColumn}>
            <label className={styles.formBlock}>
              <span className={styles.blockTitle}>PRESTADOR / DESCRIÇÃO:</span>
              <input
                className={styles.textInput}
                value={form.description}
                onChange={(event) => patch("description", event.target.value)}
                placeholder="Ex: Manutenção Elétrica / Prestador Silva"
                aria-label="Descrição ou prestador da despesa"
                maxLength={160}
                required
                disabled={submitting}
              />
            </label>

            <label className={styles.formBlock}>
              <span className={styles.blockTitle}>IMÓVEL:</span>
              <input
                className={styles.textInput}
                value={form.propertyRegistration}
                onChange={(event) => patch("propertyRegistration", event.target.value)}
                placeholder="REGISTRO DO IMÓVEL (ex: IM-001)"
                maxLength={80}
                required
                disabled={submitting}
              />
            </label>

            <label className={`${styles.formBlock} ${styles.dateBlock}`}>
              <span className={styles.blockTitle}>DATA:</span>
              <span className={styles.dateInputWrap}>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => patch("date", event.target.value)}
                  required
                  disabled={submitting}
                />
                <CalendarDays aria-hidden="true" />
              </span>
            </label>
          </div>

          <div className={styles.formColumn}>
            <label className={styles.formBlock}>
              <span className={styles.blockTitle}>VALOR TOTAL DA DESPESA:</span>
              <input
                className={`${styles.textInput} ${styles.moneyInput}`}
                inputMode="decimal"
                value={form.grossTotal}
                onChange={(event) => patch("grossTotal", event.target.value)}
                placeholder="R$ 000.000.000,0"
                required
                disabled={submitting}
              />
            </label>
          </div>

          {message ? <p className={styles.formMessage}>{message}</p> : null}

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onReset}
              disabled={submitting}
            >
              Limpar Tudo
            </button>
            <button type="submit" className={styles.primaryButton} disabled={submitting}>
              {submitting ? "SALVANDO..." : "FINALIZAR"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
