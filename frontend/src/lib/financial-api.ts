import { clearAuthToken, getAuthToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type FinancialSummary = {
  income: number;
  expense: number;
  balance: number;
};

export type FinancialMovement = {
  id: number;
  date: string;
  tenantName: string;
  propertyRegistration: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
};

export type CreateIncomeRequest = {
  documentType: "CPF" | "CNPJ";
  tenantName: string;
  documentNumber: string;
  propertyRegistration: string;
  transactionDate: string;
  grossAmount: number;
};

export type CreateExpenseRequest = {
  description: string;
  propertyRegistration: string;
  transactionDate: string;
  grossAmount: number;
};

type ApiErrorBody = {
  message?: string;
  fieldErrors?: Record<string, string>;
};

export class UnauthorizedError extends Error {
  constructor() {
    super("Usuário ou senha inválidos.");
    this.name = "UnauthorizedError";
  }
}

async function request<T>(path: string, init?: RequestInit, token: string | null = getAuthToken()): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Basic ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    // O AuthGate observa a sessão e leva para /login.
    clearAuthToken();
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    let message = `Falha na API Java (HTTP ${response.status}).`;

    try {
      const body = (await response.json()) as ApiErrorBody;
      if (body.message) message = body.message;

      if (body.fieldErrors) {
        const firstFieldMessage = Object.values(body.fieldErrors)[0];
        if (firstFieldMessage) message = firstFieldMessage;
      }
    } catch {
      // Mantem a mensagem HTTP quando o backend nao devolve JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export type PropertyItem = {
  id: number;
  registrationCode: string;
  address: string;
  currentTenant: string;
  monthlyRent: number;
  status: string;
};

export type PropertyMetrics = {
  totalProperties: number;
  occupied: number;
  available: number;
  underMaintenance: number;
};

export type LeaseContract = {
  id: number;
  propertyRegistration: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  monthlyAmount: number;
  status: string;
};

export type ReminderItem = {
  id: number;
  text: string;
  done: boolean;
  createdAt: string;
};

export type CreateReminderRequest = {
  text: string;
};

function periodQuery(month: number, year: number) {
  return `?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`;
}

export const financialApi = {
  summary: (month: number, year: number) =>
    request<FinancialSummary>(`/api/v1/financial/summary${periodQuery(month, year)}`),

  movements: (month: number, year: number) =>
    request<FinancialMovement[]>(`/api/v1/financial/movements${periodQuery(month, year)}`),

  allMovements: () =>
    request<FinancialMovement[]>("/api/v1/financial/all"),

  createIncome: (payload: CreateIncomeRequest) =>
    request<FinancialMovement>("/api/v1/financial/incomes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  createExpense: (payload: CreateExpenseRequest) =>
    request<FinancialMovement>("/api/v1/financial/expenses", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteTransaction: (id: number) =>
    request<void>(`/api/v1/financial/transactions/${id}`, {
      method: "DELETE",
    }),
};

export const propertiesApi = {
  list: () =>
    request<PropertyItem[]>("/api/v1/properties"),

  metrics: () =>
    request<PropertyMetrics>("/api/v1/properties/metrics"),

  expiringContracts: () =>
    request<LeaseContract[]>("/api/v1/properties/contracts/expiring"),
};

export const remindersApi = {
  list: () =>
    request<ReminderItem[]>("/api/v1/reminders"),

  create: (payload: CreateReminderRequest) =>
    request<ReminderItem>("/api/v1/reminders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  toggle: (id: number) =>
    request<ReminderItem>(`/api/v1/reminders/${id}/toggle`, {
      method: "PATCH",
    }),

  delete: (id: number) =>
    request<void>(`/api/v1/reminders/${id}`, {
      method: "DELETE",
    }),
};


export type CurrentUser = {
  username: string;
};

export const authApi = {
  // Valida as credenciais antes de gravá-las: usa o token informado, não o da sessão.
  verify: (token: string) =>
    request<CurrentUser>("/api/v1/auth/me", undefined, token),
};
