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
  Building,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  History,
  House,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  financialApi,
  propertiesApi,
  remindersApi,
  type CreateExpenseRequest,
  type CreateIncomeRequest,
  type FinancialMovement,
  type FinancialSummary,
  type PropertyItem,
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
  showCharges: boolean;
  chargesDesc: string;
  chargesAmount: string;
  showFines: boolean;
  finesDesc: string;
  finesAmount: string;
  netCalculated: number | null;
};

type ExpenseForm = {
  description: string;
  category: string;
  propertyRegistration: string;
  date: string;
  grossTotal: string;
  showRetention: boolean;
  retentionDesc: string;
  retentionAmount: string;
  netCalculated: number | null;
};

type Reminder = {
  id: string;
  text: string;
  done: boolean;
};

const initialForm: EntryForm = {
  documentType: "CPF",
  tenantName: "",
  document: "",
  propertyRegistration: "",
  date: "",
  grossTotal: "",
  showCharges: false,
  chargesDesc: "",
  chargesAmount: "",
  showFines: false,
  finesDesc: "",
  finesAmount: "",
  netCalculated: null,
};

const initialExpenseForm: ExpenseForm = {
  description: "",
  category: "Manutenção",
  propertyRegistration: "",
  date: "",
  grossTotal: "",
  showRetention: false,
  retentionDesc: "",
  retentionAmount: "",
  netCalculated: null,
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

// Mock inicial para quando o backend Java estiver offline (ex: deploy público na Vercel)
const initialFallbackMovements: FinancialMovement[] = [
  {
    id: 1,
    date: "2026-10-05",
    tenantName: "João Pedro Cavalcanti",
    propertyRegistration: "IM-001",
    amount: 3200.0,
    type: "INCOME",
  },
  {
    id: 2,
    date: "2026-10-08",
    tenantName: "Maria Helena Silva",
    propertyRegistration: "IM-002",
    amount: 2850.0,
    type: "INCOME",
  },
  {
    id: 3,
    date: "2026-10-10",
    tenantName: "Manutenção Hidráulica - Prestador Rocha",
    propertyRegistration: "IM-001",
    amount: 450.0,
    type: "EXPENSE",
  },
];

const fmcProperties = [
  { id: "IM-001", address: "Av. Conde da Boa Vista, 412 - Sala 301", tenant: "João Pedro Cavalcanti", status: "Ocupado", rent: 3200.0 },
  { id: "IM-002", address: "Rua do Hospício, 180 - Sala Comercial", tenant: "Maria Helena Silva", status: "Ocupado", rent: 2850.0 },
  { id: "IM-003", address: "Rua Nova, 95 - Prédio Histórico FMC", tenant: "Fundação Cultural", status: "Em Reforma", rent: 0.0 },
  { id: "IM-004", address: "Rua da Aurora, 520 - Apartamento 502", tenant: "Disponível para locação", status: "Disponível", rent: 2400.0 },
  { id: "IM-005", address: "Av. Agamenon Magalhães, 1200 - Conjunto 405", tenant: "Tech Soluções Ltda", status: "Ocupado", rent: 4500.0 },
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

function formatCpfCnpj(value: string, type: DocumentType) {
  const clean = value.replace(/\D/g, "");
  if (type === "CPF") {
    const limited = clean.slice(0, 11);
    if (limited.length <= 3) return limited;
    if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`;
    if (limited.length <= 9) return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
  } else {
    const limited = clean.slice(0, 14);
    if (limited.length <= 2) return limited;
    if (limited.length <= 5) return `${limited.slice(0, 2)}.${limited.slice(2)}`;
    if (limited.length <= 8) return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5)}`;
    if (limited.length <= 12) return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8)}`;
    return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8, 12)}-${limited.slice(12)}`;
  }
}

function formatMoneyInput(value: string) {
  const clean = value.replace(/\D/g, "");
  if (!clean) return "";
  const num = Number(clean) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
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
  const [toastMessage, setToastMessage] = useState("");

  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [form, setForm] = useState<EntryForm>(initialForm);
  const [formMessage, setFormMessage] = useState("");

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(initialExpenseForm);
  const [expenseFormMessage, setExpenseFormMessage] = useState("");

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [propertiesModalOpen, setPropertiesModalOpen] = useState(false);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminderText, setNewReminderText] = useState("");
  const [showReminderInput, setShowReminderInput] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const selectedMonth = months.indexOf(month) + 1;
  const selectedYear = Number(year);

  // Carrega lembretes da API Java (com fallback local resiliente)
  useEffect(() => {
    let active = true;

    remindersApi
      .list()
      .then((data) => {
        if (!active) return;
        const mapped: Reminder[] = data.map((r) => ({
          id: String(r.id),
          text: r.text,
          done: r.done,
        }));
        setReminders(mapped);
        try {
          localStorage.setItem("fmc_reminders", JSON.stringify(mapped));
        } catch {
          // Ignora
        }
      })
      .catch(() => {
        if (!active) return;
        try {
          const saved = localStorage.getItem("fmc_reminders");
          if (saved) {
            setReminders(JSON.parse(saved) as Reminder[]);
          } else {
            const defaultReminders: Reminder[] = [
              { id: "1", text: "Vencimento aluguel IM-001 (dia 10)", done: true },
              { id: "2", text: "Vistoria predial IM-003", done: false },
              { id: "3", text: "Cobrança taxa condominial IM-005", done: false },
            ];
            setReminders(defaultReminders);
            localStorage.setItem("fmc_reminders", JSON.stringify(defaultReminders));
          }
        } catch {
          // Ignora falha de localStorage
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function saveReminders(updated: Reminder[]) {
    setReminders(updated);
    try {
      localStorage.setItem("fmc_reminders", JSON.stringify(updated));
    } catch {
      // Ignora
    }
  }

  async function addReminder() {
    const text = newReminderText.trim();
    if (!text) return;
    setNewReminderText("");
    setShowReminderInput(false);

    try {
      const created = await remindersApi.create({ text });
      const item: Reminder = {
        id: String(created.id),
        text: created.text,
        done: created.done,
      };
      const updated = [item, ...reminders];
      saveReminders(updated);
      showToast("Lembrete salvo com sucesso.");
    } catch {
      // Fallback offline
      const item: Reminder = {
        id: String(Date.now()),
        text,
        done: false,
      };
      const updated = [item, ...reminders];
      saveReminders(updated);
      showToast("Lembrete adicionado.");
    }
  }

  async function toggleReminder(id: string) {
    const numId = Number(id);
    const updated = reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r));
    saveReminders(updated);

    if (Number.isFinite(numId)) {
      try {
        await remindersApi.toggle(numId);
      } catch {
        // Fallback local já atualizado
      }
    }
  }

  async function deleteReminder(id: string) {
    const numId = Number(id);
    const updated = reminders.filter((r) => r.id !== id);
    saveReminders(updated);

    if (Number.isFinite(numId)) {
      try {
        await remindersApi.delete(numId);
        showToast("Lembrete excluído.");
      } catch {
        showToast("Lembrete removido.");
      }
    } else {
      showToast("Lembrete removido.");
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  }

  // Carrega dados da API ou do LocalStorage (fallback de resiliência)
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
        // Fallback gracioso com dados salvos no navegador para funcionamento em modo offline/Vercel
        const cachedMovementsStr = localStorage.getItem(`fmc_movements_${selectedMonth}_${selectedYear}`);
        if (cachedMovementsStr) {
          try {
            const cached = JSON.parse(cachedMovementsStr) as FinancialMovement[];
            setMovements(cached);
            const inc = cached.filter((m) => m.type === "INCOME").reduce((s, m) => s + m.amount, 0);
            const exp = cached.filter((m) => m.type === "EXPENSE").reduce((s, m) => s + m.amount, 0);
            setSummary({ income: inc, expense: exp, balance: inc - exp });
          } catch {
            setFallbackData();
          }
        } else {
          setFallbackData();
        }
        setApiError(errorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    function setFallbackData() {
      setMovements(initialFallbackMovements);
      const inc = initialFallbackMovements.filter((m) => m.type === "INCOME").reduce((s, m) => s + m.amount, 0);
      const exp = initialFallbackMovements.filter((m) => m.type === "EXPENSE").reduce((s, m) => s + m.amount, 0);
      setSummary({ income: inc, expense: exp, balance: inc - exp });
    }

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
    } catch {
      // Mantem estado atualizado
    } finally {
      setLoading(false);
    }
  }

  const incomes = useMemo(
    () => movements.filter((movement) => movement.type === "INCOME"),
    [movements]
  );

  const expenses = useMemo(
    () => movements.filter((movement) => movement.type === "EXPENSE"),
    [movements]
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
    setFormMessage("");
    setEntryModalOpen(true);
  }

  function closeEntryModal() {
    if (submitting) return;
    setEntryModalOpen(false);
    setFormMessage("");
  }

  function openExpenseModal() {
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
      showToast("Entrada registrada com sucesso!");
      await refreshFinanceFromEvent();
    } catch {
      // Fallback para modo local/offline (ex: demo Vercel)
      const newEntry: FinancialMovement = {
        id: Date.now(),
        date: form.date,
        tenantName: form.tenantName.trim(),
        propertyRegistration: form.propertyRegistration.trim(),
        amount: grossAmount,
        type: "INCOME",
      };
      const updated = [newEntry, ...movements];
      setMovements(updated);
      const inc = updated.filter((m) => m.type === "INCOME").reduce((s, m) => s + m.amount, 0);
      const exp = updated.filter((m) => m.type === "EXPENSE").reduce((s, m) => s + m.amount, 0);
      setSummary({ income: inc, expense: exp, balance: inc - exp });
      try {
        localStorage.setItem(`fmc_movements_${selectedMonth}_${selectedYear}`, JSON.stringify(updated));
      } catch {
        // Ignora
      }
      resetForm();
      setEntryModalOpen(false);
      showToast("Entrada registrada no sistema.");
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
      setExpenseFormMessage("Preencha todos os campos obrigatórios da despesa.");
      return;
    }

    const grossAmount = parseMoney(expenseForm.grossTotal);
    if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
      setExpenseFormMessage("Informe um valor maior que zero.");
      return;
    }

    const payload: CreateExpenseRequest = {
      description: `${expenseForm.category}: ${expenseForm.description.trim()}`,
      propertyRegistration: expenseForm.propertyRegistration.trim(),
      transactionDate: expenseForm.date,
      grossAmount,
    };

    setSubmitting(true);

    try {
      await financialApi.createExpense(payload);
      resetExpenseForm();
      setExpenseModalOpen(false);
      showToast("Despesa registrada com sucesso!");
      await refreshFinanceFromEvent();
    } catch {
      // Fallback local
      const newExpense: FinancialMovement = {
        id: Date.now(),
        date: expenseForm.date,
        tenantName: `${expenseForm.category}: ${expenseForm.description.trim()}`,
        propertyRegistration: expenseForm.propertyRegistration.trim(),
        amount: grossAmount,
        type: "EXPENSE",
      };
      const updated = [newExpense, ...movements];
      setMovements(updated);
      const inc = updated.filter((m) => m.type === "INCOME").reduce((s, m) => s + m.amount, 0);
      const exp = updated.filter((m) => m.type === "EXPENSE").reduce((s, m) => s + m.amount, 0);
      setSummary({ income: inc, expense: exp, balance: inc - exp });
      try {
        localStorage.setItem(`fmc_movements_${selectedMonth}_${selectedYear}`, JSON.stringify(updated));
      } catch {
        // Ignora
      }
      resetExpenseForm();
      setExpenseModalOpen(false);
      showToast("Despesa registrada no sistema.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTransaction(id: number, tenantName: string) {
    if (!confirm(`Deseja realmente excluir a transação de "${tenantName}"?`)) {
      return;
    }

    try {
      await financialApi.deleteTransaction(id);
      showToast("Movimentação removida.");
      await refreshFinanceFromEvent();
    } catch {
      // Fallback local
      const updated = movements.filter((m) => m.id !== id);
      setMovements(updated);
      const inc = updated.filter((m) => m.type === "INCOME").reduce((s, m) => s + m.amount, 0);
      const exp = updated.filter((m) => m.type === "EXPENSE").reduce((s, m) => s + m.amount, 0);
      setSummary({ income: inc, expense: exp, balance: inc - exp });
      try {
        localStorage.setItem(`fmc_movements_${selectedMonth}_${selectedYear}`, JSON.stringify(updated));
      } catch {
        // Ignora
      }
      showToast("Movimentação removida.");
    }
  }

  return (
    <div className={styles.financeShell}>
      <Sidebar />

      <main className={styles.financeMain}>
        <div className={styles.financeCanvas}>
          <div className={styles.periodControls}>
            <label className={styles.periodSelect}>
              <span className="sr-only">Selecione o mês</span>
              <select
                value={month}
                onChange={(event) => changeMonth(event.target.value)}
                aria-label="Mês de referência"
              >
                {months.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.periodSelectSmall}>
              <span className="sr-only">Selecione o ano</span>
              <select
                value={year}
                onChange={(event) => changeYear(event.target.value)}
                aria-label="Ano de referência"
              >
                {["2024", "2025", "2026", "2027"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <h1 className={styles.pageTitle}>FINANCEIRO</h1>

          <section className={styles.summaryGrid} aria-label="Resumo do mês">
            <SummaryCard
              label="Entradas:"
              value={currency(summary.income)}
              icon={<ArrowDownLeft aria-hidden="true" />}
            />
            <SummaryCard
              label="Saídas:"
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
              emptyText="Nenhuma entrada registrada para este período."
              actionLabel="Adicionar entrada"
              onAction={openEntryModal}
              onDelete={handleDeleteTransaction}
            />

            <TransactionPanel
              title="SAÍDAS:"
              items={expenses}
              emptyText="Nenhuma saída registrada para este período."
              actionLabel="Adicionar saída"
              onAction={openExpenseModal}
              onDelete={handleDeleteTransaction}
            />
          </section>

          <section className={styles.bottomGrid}>
            <div className={styles.remindersPanel}>
              <div className={styles.panelHeader}>
                <h2>LEMBRETES:</h2>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label="Adicionar lembrete"
                  title="Criar novo lembrete"
                  onClick={() => setShowReminderInput((v) => !v)}
                >
                  <Plus aria-hidden="true" />
                </button>
              </div>

              {showReminderInput ? (
                <div className={styles.reminderInputRow}>
                  <input
                    type="text"
                    className={styles.reminderInput}
                    placeholder="Novo lembrete financeiro ou operacional..."
                    value={newReminderText}
                    onChange={(e) => setNewReminderText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addReminder()}
                    autoFocus
                  />
                  <button type="button" className={styles.reminderAddBtn} onClick={addReminder}>
                    Salvar
                  </button>
                </div>
              ) : null}

              {reminders.length === 0 ? (
                <div className={styles.reminderEmpty}>Nenhum lembrete cadastrado</div>
              ) : (
                <div className={styles.remindersList}>
                  {reminders.map((r) => (
                    <div key={r.id} className={styles.reminderItem}>
                      <label className={styles.reminderLeft}>
                        <input
                          type="checkbox"
                          className={styles.reminderCheckbox}
                          checked={r.done}
                          onChange={() => toggleReminder(r.id)}
                        />
                        <span className={`${styles.reminderText} ${r.done ? styles.reminderTextDone : ""}`}>
                          {r.text}
                        </span>
                      </label>
                      <button
                        type="button"
                        className={styles.reminderDelete}
                        onClick={() => deleteReminder(r.id)}
                        title="Excluir lembrete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.quickActions}>
              <button
                type="button"
                className={styles.quickAction}
                onClick={() => setPropertiesModalOpen(true)}
                title="Visualizar imóveis da fundação"
              >
                <House aria-hidden="true" />
                <span>Imóveis</span>
              </button>
              <button
                type="button"
                className={styles.quickAction}
                onClick={() => setHistoryModalOpen(true)}
                title="Abrir tabela e histórico detalhado"
              >
                <History aria-hidden="true" />
                <span>Histórico</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Modal 1: REGISTRO DE ENTRADA (Figma 100%) */}
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

      {/* Modal 2: REGISTRO DE SAÍDA (Figma 100%) */}
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

      {/* Modal 3: Histórico Completo com os 4 Cards Coloridos do Figma */}
      {historyModalOpen ? (
        <HistoryModal
          movements={movements}
          summary={summary}
          onClose={() => setHistoryModalOpen(false)}
        />
      ) : null}

      {/* Modal 4: Imóveis Cadastrados */}
      {propertiesModalOpen ? (
        <PropertiesModal onClose={() => setPropertiesModalOpen(false)} />
      ) : null}

      {/* Toast Alert */}
      {toastMessage ? (
        <div className={styles.toastAlert} role="status">
          <CheckCircle2 size={18} color="#22c55e" />
          <span>{toastMessage}</span>
        </div>
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
  onAction,
  onDelete,
}: {
  title: string;
  items: FinancialMovement[];
  emptyText: string;
  actionLabel: string;
  onAction: () => void;
  onDelete?: (id: number, description: string) => void;
}) {
  return (
    <article className={styles.transactionPanel}>
      <div className={styles.panelHeader}>
        <h2>{title}</h2>
        <button
          type="button"
          className={styles.iconButton}
          aria-label={actionLabel}
          title={actionLabel}
          onClick={onAction}
        >
          <Plus aria-hidden="true" />
        </button>
      </div>

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

  function handleDocumentChange(raw: string) {
    const formatted = formatCpfCnpj(raw, form.documentType);
    patch("document", formatted);
  }

  function handleMoneyChange(raw: string) {
    const formatted = formatMoneyInput(raw);
    patch("grossTotal", formatted);
    if (form.netCalculated !== null) {
      calculateNet(formatted);
    }
  }

  function calculateNet(customGross?: string) {
    const gross = parseMoney(customGross ?? form.grossTotal);
    const charges = form.showCharges ? parseMoney(form.chargesAmount) : 0;
    const fines = form.showFines ? parseMoney(form.finesAmount) : 0;
    const total = (Number.isFinite(gross) ? gross : 0) + charges + fines;
    patch("netCalculated", total);
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
          {/* Coluna Esquerda */}
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
                    onChange={() => {
                      patch("documentType", "CPF");
                      if (form.document) {
                        patch("document", formatCpfCnpj(form.document, "CPF"));
                      }
                    }}
                  />
                </label>
                <label>
                  CNPJ:
                  <input
                    type="radio"
                    name="documentType"
                    checked={form.documentType === "CNPJ"}
                    onChange={() => {
                      patch("documentType", "CNPJ");
                      if (form.document) {
                        patch("document", formatCpfCnpj(form.document, "CNPJ"));
                      }
                    }}
                  />
                </label>
                <button
                  type="button"
                  className={styles.clearDocumentType}
                  title="Limpar inquilino"
                  aria-label="Limpar identificação"
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
                onChange={(event) => handleDocumentChange(event.target.value)}
                placeholder={form.documentType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
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

          {/* Coluna Direita */}
          <div className={styles.formColumn}>
            <div>
              <div className={styles.inlineRuleBlock}>
                <span className={styles.blockTitle}>ENCARGOS:</span>
                <button
                  type="button"
                  className={`${styles.rulePlus} ${form.showCharges ? styles.rulePlusActive : ""}`}
                  title="Adicionar encargo (IPTU, condomínio, etc.)"
                  aria-label="Adicionar encargo"
                  onClick={() => patch("showCharges", !form.showCharges)}
                >
                  <Plus aria-hidden="true" />
                </button>
              </div>
              {form.showCharges ? (
                <div className={styles.subFieldRow}>
                  <input
                    className={styles.subFieldInput}
                    placeholder="Descrição do encargo"
                    value={form.chargesDesc}
                    onChange={(e) => patch("chargesDesc", e.target.value)}
                  />
                  <input
                    className={`${styles.subFieldInput} ${styles.moneyInput}`}
                    placeholder="R$ 0,00"
                    value={form.chargesAmount}
                    onChange={(e) => {
                      patch("chargesAmount", formatMoneyInput(e.target.value));
                    }}
                  />
                  <button
                    type="button"
                    className={styles.subFieldRemove}
                    onClick={() => patch("showCharges", false)}
                    title="Remover encargo"
                  >
                    <X />
                  </button>
                </div>
              ) : null}
            </div>

            <div>
              <div className={styles.inlineRuleBlock}>
                <span className={styles.blockTitle}>MULTAS:</span>
                <button
                  type="button"
                  className={`${styles.rulePlus} ${form.showFines ? styles.rulePlusActive : ""}`}
                  title="Adicionar multa por atraso ou juros"
                  aria-label="Adicionar multa"
                  onClick={() => patch("showFines", !form.showFines)}
                >
                  <Plus aria-hidden="true" />
                </button>
              </div>
              {form.showFines ? (
                <div className={styles.subFieldRow}>
                  <input
                    className={styles.subFieldInput}
                    placeholder="Motivo da multa"
                    value={form.finesDesc}
                    onChange={(e) => patch("finesDesc", e.target.value)}
                  />
                  <input
                    className={`${styles.subFieldInput} ${styles.moneyInput}`}
                    placeholder="R$ 0,00"
                    value={form.finesAmount}
                    onChange={(e) => {
                      patch("finesAmount", formatMoneyInput(e.target.value));
                    }}
                  />
                  <button
                    type="button"
                    className={styles.subFieldRemove}
                    onClick={() => patch("showFines", false)}
                    title="Remover multa"
                  >
                    <X />
                  </button>
                </div>
              ) : null}
            </div>

            <label className={styles.formBlock}>
              <span className={styles.blockTitle}>TOTAL BRUTO:</span>
              <input
                className={`${styles.textInput} ${styles.moneyInput}`}
                inputMode="numeric"
                value={form.grossTotal}
                onChange={(event) => handleMoneyChange(event.target.value)}
                placeholder="R$ 0,00"
                required
                disabled={submitting}
              />
            </label>

            <div className={styles.netValueRow}>
              <button
                type="button"
                className={styles.netValueButton}
                title="Calcular valor líquido considerando encargos e multas"
                onClick={() => calculateNet()}
              >
                Valor Líquido
              </button>
              {form.netCalculated !== null ? (
                <span className={styles.netValueBadge}>
                  {currency(form.netCalculated)}
                </span>
              ) : null}
            </div>
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

  function handleMoneyChange(raw: string) {
    const formatted = formatMoneyInput(raw);
    patch("grossTotal", formatted);
    if (form.netCalculated !== null) {
      calculateNet(formatted);
    }
  }

  function calculateNet(customGross?: string) {
    const gross = parseMoney(customGross ?? form.grossTotal);
    const retention = form.showRetention ? parseMoney(form.retentionAmount) : 0;
    const total = Math.max(0, (Number.isFinite(gross) ? gross : 0) - retention);
    patch("netCalculated", total);
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
          REGISTRO DE SAÍDA
        </h2>

        <form onSubmit={onSubmit} className={styles.entryForm}>
          {/* Coluna Esquerda */}
          <div className={styles.formColumn}>
            <label className={styles.formBlock}>
              <span className={styles.blockTitle}>PRESTADOR / FAVORECIDO:</span>
              <input
                className={styles.textInput}
                value={form.description}
                onChange={(event) => patch("description", event.target.value)}
                placeholder="Ex: Carlos Silva Eletricista"
                maxLength={160}
                required
                disabled={submitting}
              />
            </label>

            <label className={styles.formBlock}>
              <span className={styles.blockTitle}>CATEGORIA:</span>
              <select
                className={styles.textInput}
                value={form.category}
                onChange={(event) => patch("category", event.target.value)}
                disabled={submitting}
              >
                <option value="Manutenção">Manutenção Geral</option>
                <option value="Reforma">Reforma / Infraestrutura</option>
                <option value="Limpeza">Serviços de Limpeza</option>
                <option value="Impostos">Impostos e Tributos (IPTU)</option>
                <option value="Contas de Consumo">Contas de Consumo (Água/Luz)</option>
                <option value="Serviços Gerais">Serviços e Honorários</option>
                <option value="Outros">Outras Despesas</option>
              </select>
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

          {/* Coluna Direita */}
          <div className={styles.formColumn}>
            <div>
              <div className={styles.inlineRuleBlock}>
                <span className={styles.blockTitle}>RETENÇÕES / IMPOSTOS:</span>
                <button
                  type="button"
                  className={`${styles.rulePlus} ${form.showRetention ? styles.rulePlusActive : ""}`}
                  title="Adicionar retenção de imposto na fonte (ex: ISS, IRRF)"
                  aria-label="Adicionar retenção"
                  onClick={() => patch("showRetention", !form.showRetention)}
                >
                  <Plus aria-hidden="true" />
                </button>
              </div>
              {form.showRetention ? (
                <div className={styles.subFieldRow}>
                  <input
                    className={styles.subFieldInput}
                    placeholder="Descrição da retenção"
                    value={form.retentionDesc}
                    onChange={(e) => patch("retentionDesc", e.target.value)}
                  />
                  <input
                    className={`${styles.subFieldInput} ${styles.moneyInput}`}
                    placeholder="R$ 0,00"
                    value={form.retentionAmount}
                    onChange={(e) => {
                      patch("retentionAmount", formatMoneyInput(e.target.value));
                    }}
                  />
                  <button
                    type="button"
                    className={styles.subFieldRemove}
                    onClick={() => patch("showRetention", false)}
                    title="Remover retenção"
                  >
                    <X />
                  </button>
                </div>
              ) : null}
            </div>

            <label className={styles.formBlock}>
              <span className={styles.blockTitle}>VALOR DA DESPESA:</span>
              <input
                className={`${styles.textInput} ${styles.moneyInput}`}
                inputMode="numeric"
                value={form.grossTotal}
                onChange={(event) => handleMoneyChange(event.target.value)}
                placeholder="R$ 0,00"
                required
                disabled={submitting}
              />
            </label>

            <div className={styles.netValueRow}>
              <button
                type="button"
                className={styles.netValueButton}
                title="Calcular valor líquido a pagar com retenções"
                onClick={() => calculateNet()}
              >
                Valor Líquido
              </button>
              {form.netCalculated !== null ? (
                <span className={styles.netValueBadge}>
                  {currency(form.netCalculated)}
                </span>
              ) : null}
            </div>
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

function HistoryModal({
  movements: initialMovements,
  summary: initialSummary,
  onClose,
}: {
  movements: FinancialMovement[];
  summary: FinancialSummary;
  onClose: () => void;
}) {
  const [historyMovements, setHistoryMovements] = useState<FinancialMovement[]>(initialMovements);
  const [historySummary, setHistorySummary] = useState<FinancialSummary>(initialSummary);
  const [activePropertiesCount, setActivePropertiesCount] = useState<number>(5);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");

  useEffect(() => {
    let active = true;

    financialApi
      .allMovements()
      .then((data) => {
        if (!active) return;
        setHistoryMovements(data);
        const inc = data.filter((m) => m.type === "INCOME").reduce((s, m) => s + m.amount, 0);
        const exp = data.filter((m) => m.type === "EXPENSE").reduce((s, m) => s + m.amount, 0);
        setHistorySummary({ income: inc, expense: exp, balance: inc - exp });
      })
      .catch(() => {
        // Fallback mantém os initialMovements
      });

    propertiesApi
      .metrics()
      .then((metrics) => {
        if (!active) return;
        setActivePropertiesCount(Number(metrics.occupied));
      })
      .catch(() => {
        // Mantém padrão
      });

    return () => {
      active = false;
    };
  }, []);

  const filtered = historyMovements.filter((m) => {
    const matchesType = filterType === "ALL" || m.type === filterType;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      m.tenantName.toLowerCase().includes(term) ||
      m.propertyRegistration.toLowerCase().includes(term);
    return matchesType && matchesSearch;
  });

  return (
    <div className={styles.fullModalOverlay} role="presentation" onMouseDown={onClose}>
      <div
        className={styles.fullModalCard}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.fullModalHeader}>
          <h2>HISTÓRICO FINANCEIRO INTEGRADO (FMC)</h2>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* 4 Cards Coloridos do Figma */}
        <div className={styles.historyCardsGrid}>
          <div className={`${styles.historyColorCard} ${styles.cardGreen}`}>
            <div className={styles.historyCardIcon}>
              <ArrowDownLeft size={22} />
            </div>
            <div className={styles.historyCardData}>
              <span>Receitas Totais</span>
              <strong>{currency(historySummary.income)}</strong>
            </div>
          </div>

          <div className={`${styles.historyColorCard} ${styles.cardBlue}`}>
            <div className={styles.historyCardIcon}>
              <CircleDollarSign size={22} />
            </div>
            <div className={styles.historyCardData}>
              <span>Saldo em Caixa</span>
              <strong>{currency(historySummary.balance)}</strong>
            </div>
          </div>

          <div className={`${styles.historyColorCard} ${styles.cardYellow}`}>
            <div className={styles.historyCardIcon}>
              <CalendarDays size={22} />
            </div>
            <div className={styles.historyCardData}>
              <span>Contratos Ativos</span>
              <strong>{activePropertiesCount} Imóveis</strong>
            </div>
          </div>

          <div className={`${styles.historyColorCard} ${styles.cardRed}`}>
            <div className={styles.historyCardIcon}>
              <ArrowUpRight size={22} />
            </div>
            <div className={styles.historyCardData}>
              <span>Despesas Totais</span>
              <strong>{currency(historySummary.expense)}</strong>
            </div>
          </div>
        </div>

        {/* Toolbar de Filtros */}
        <div className={styles.tableToolbar}>
          <input
            type="text"
            className={styles.tableSearchInput}
            placeholder="Buscar por inquilino, prestador ou registro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className={styles.tableFilters}>
            <button
              type="button"
              className={`${styles.filterBtn} ${filterType === "ALL" ? styles.filterBtnActive : ""}`}
              onClick={() => setFilterType("ALL")}
            >
              Todos ({historyMovements.length})
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${filterType === "INCOME" ? styles.filterBtnActive : ""}`}
              onClick={() => setFilterType("INCOME")}
            >
              Entradas ({historyMovements.filter((m) => m.type === "INCOME").length})
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${filterType === "EXPENSE" ? styles.filterBtnActive : ""}`}
              onClick={() => setFilterType("EXPENSE")}
            >
              Saídas ({historyMovements.filter((m) => m.type === "EXPENSE").length})
            </button>
          </div>
        </div>

        {/* Tabela */}
        <table className={styles.historyTable}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Identificação / Locatário / Prestador</th>
              <th>Imóvel</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                  Nenhum registro encontrado para este filtro.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td>{displayDate(item.date)}</td>
                  <td>
                    <span className={item.type === "INCOME" ? styles.positiveAmount : styles.negativeAmount}>
                      {item.type === "INCOME" ? "Entrada" : "Saída"}
                    </span>
                  </td>
                  <td><strong>{item.tenantName}</strong></td>
                  <td><code>{item.propertyRegistration}</code></td>
                  <td>
                    <b className={item.type === "INCOME" ? styles.positiveAmount : styles.negativeAmount}>
                      {currency(item.amount)}
                    </b>
                  </td>
                  <td>
                    <span className={`${styles.statusPill} ${item.type === "INCOME" ? styles.pillGreen : styles.pillRed}`}>
                      {item.type === "INCOME" ? "Confirmado" : "Pago"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PropertiesModal({ onClose }: { onClose: () => void }) {
  const [properties, setProperties] = useState(fmcProperties);

  useEffect(() => {
    let active = true;

    propertiesApi
      .list()
      .then((data) => {
        if (!active) return;
        setProperties(
          data.map((p) => ({
            id: p.registrationCode,
            address: p.address,
            tenant: p.currentTenant,
            status: p.status,
            rent: Number(p.monthlyRent),
          }))
        );
      })
      .catch(() => {
        // Fallback para fmcProperties
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={styles.fullModalOverlay} role="presentation" onMouseDown={onClose}>
      <div
        className={styles.fullModalCard}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.fullModalHeader}>
          <h2>PATRIMÔNIO IMOBILIÁRIO - FUNDAÇÃO MANUEL CRUZ</h2>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <table className={styles.historyTable}>
          <thead>
            <tr>
              <th>Inscrição</th>
              <th>Endereço do Imóvel</th>
              <th>Locatário Atual</th>
              <th>Valor Mensal</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.id}</strong></td>
                <td>{p.address}</td>
                <td>{p.tenant}</td>
                <td>{p.rent > 0 ? currency(p.rent) : "-"}</td>
                <td>
                  <span
                    className={`${styles.statusPill} ${
                      p.status === "Ocupado"
                        ? styles.pillGreen
                        : p.status === "Em Reforma"
                        ? styles.pillRed
                        : ""
                    }`}
                    style={p.status === "Disponível" ? { background: "#dbeafe", color: "#1e40af" } : {}}
                  >
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
