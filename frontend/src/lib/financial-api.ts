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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

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

function periodQuery(month: number, year: number) {
  return `?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`;
}

export const financialApi = {
  summary: (month: number, year: number) =>
    request<FinancialSummary>(`/api/v1/financial/summary${periodQuery(month, year)}`),

  movements: (month: number, year: number) =>
    request<FinancialMovement[]>(`/api/v1/financial/movements${periodQuery(month, year)}`),

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
