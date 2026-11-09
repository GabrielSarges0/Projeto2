import { z } from "zod";
import { apiRequest, apiRequestVoid } from "./api-client";

export { ApiError, NetworkError, UnauthorizedError, errorMessage, isApiError } from "./api-client";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const summarySchema = z.object({
  income: z.number(),
  expense: z.number(),
  balance: z.number(),
});
export type FinancialSummary = z.infer<typeof summarySchema>;

const movementSchema = z.object({
  id: z.number(),
  date: isoDate,
  tenantName: z.string(),
  propertyRegistration: z.string(),
  amount: z.number(),
  type: z.enum(["INCOME", "EXPENSE"]),
});
export type FinancialMovement = z.infer<typeof movementSchema>;

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

export const PROPERTY_STATUSES = ["OCUPADO", "DISPONIVEL", "MANUTENCAO"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];
export const PROPERTY_STATUS_LABEL: Record<PropertyStatus, string> = {
  OCUPADO: "Ocupado",
  DISPONIVEL: "Disponível",
  MANUTENCAO: "Manutenção",
};

const propertySchema = z.object({
  id: z.number(),
  registrationCode: z.string(),
  address: z.string(),
  currentTenant: z.string().nullable(),
  monthlyRent: z.number(),
  status: z.enum(PROPERTY_STATUSES),
  notes: z.string().nullable(),
  updatedAt: z.string().nullable(),
  updatedBy: z.string().nullable(),
});
export type PropertyItem = z.infer<typeof propertySchema>;

export type PropertyRequest = {
  registrationCode?: string;
  address: string;
  currentTenant: string | null;
  monthlyRent: number;
  status: PropertyStatus;
  notes: string | null;
};

const metricsSchema = z.object({
  totalProperties: z.number(),
  occupied: z.number(),
  available: z.number(),
  underMaintenance: z.number(),
});
export type PropertyMetrics = z.infer<typeof metricsSchema>;

const contractSchema = z.object({
  id: z.number(),
  propertyRegistration: z.string(),
  tenantName: z.string(),
  startDate: isoDate,
  endDate: isoDate,
  monthlyAmount: z.number(),
  status: z.string(),
});
export type LeaseContract = z.infer<typeof contractSchema>;

export const REMINDER_CATEGORIES = ["FINANCEIRO", "IMOVEL", "PRESTACAO_MP", "CONTRATO", "OPERACIONAL", "OUTRO"] as const;
export type ReminderCategory = (typeof REMINDER_CATEGORIES)[number];
export const REMINDER_CATEGORY_LABEL: Record<ReminderCategory, string> = {
  FINANCEIRO: "Financeiro",
  IMOVEL: "Imóvel / Reforma",
  PRESTACAO_MP: "Prestação MP",
  CONTRATO: "Contrato",
  OPERACIONAL: "Operacional",
  OUTRO: "Outro",
};

export const REMINDER_PRIORITIES = ["ALTA", "MEDIA", "BAIXA"] as const;
export type ReminderPriority = (typeof REMINDER_PRIORITIES)[number];
export const REMINDER_PRIORITY_LABEL: Record<ReminderPriority, string> = {
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
};

const reminderSchema = z.object({
  id: z.number(),
  title: z.string(),
  dueDate: isoDate,
  category: z.enum(REMINDER_CATEGORIES),
  priority: z.enum(REMINDER_PRIORITIES),
  responsible: z.string().nullable(),
  description: z.string().nullable(),
  done: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type ReminderItem = z.infer<typeof reminderSchema>;

export type ReminderRequest = {
  title: string;
  dueDate: string;
  category: ReminderCategory;
  priority: ReminderPriority;
  responsible: string | null;
  description: string | null;
};

const currentUserSchema = z.object({ username: z.string(), name: z.string() });
const loginResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.string(),
  user: currentUserSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

function periodQuery(month: number, year: number) {
  return `?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`;
}

export const financialApi = {
  summary: (month: number, year: number) =>
    apiRequest(`/api/v1/financial/summary${periodQuery(month, year)}`, summarySchema),
  movements: (month: number, year: number) =>
    apiRequest(`/api/v1/financial/movements${periodQuery(month, year)}`, z.array(movementSchema)),
  allMovements: () => apiRequest("/api/v1/financial/all", z.array(movementSchema)),
  createIncome: (payload: CreateIncomeRequest) =>
    apiRequest("/api/v1/financial/incomes", movementSchema, { method: "POST", body: payload }),
  createExpense: (payload: CreateExpenseRequest) =>
    apiRequest("/api/v1/financial/expenses", movementSchema, { method: "POST", body: payload }),
  deleteTransaction: (id: number) =>
    apiRequestVoid(`/api/v1/financial/transactions/${id}`, { method: "DELETE" }),
};

export const propertiesApi = {
  list: () => apiRequest("/api/v1/properties", z.array(propertySchema)),
  create: (payload: PropertyRequest) =>
    apiRequest("/api/v1/properties", propertySchema, { method: "POST", body: payload }),
  update: (id: number, payload: PropertyRequest) =>
    apiRequest(`/api/v1/properties/${id}`, propertySchema, { method: "PUT", body: payload }),
  metrics: () => apiRequest("/api/v1/properties/metrics", metricsSchema),
  expiringContracts: () => apiRequest("/api/v1/properties/contracts/expiring", z.array(contractSchema)),
};

export const remindersApi = {
  list: () => apiRequest("/api/v1/reminders", z.array(reminderSchema)),
  create: (payload: ReminderRequest) =>
    apiRequest("/api/v1/reminders", reminderSchema, { method: "POST", body: payload }),
  update: (id: number, payload: ReminderRequest) =>
    apiRequest(`/api/v1/reminders/${id}`, reminderSchema, { method: "PUT", body: payload }),
  toggle: (id: number) => apiRequest(`/api/v1/reminders/${id}/toggle`, reminderSchema, { method: "PATCH" }),
  delete: (id: number) => apiRequestVoid(`/api/v1/reminders/${id}`, { method: "DELETE" }),
};

export const authApi = {
  login: (email: string, password: string, name?: string) =>
    apiRequest("/api/v1/auth/login", loginResponseSchema, {
      method: "POST",
      body: { email, password, name },
      anonymous: true,
    }),
  me: () => apiRequest("/api/v1/auth/me", currentUserSchema),
};

/** Notifica telas abertas (Painel, Financeiro, Imóveis) de que dados financeiros/imóveis mudaram. */
export const FINANCE_CHANGED_EVENT = "fmc-finance-changed";
export function notifyFinanceChanged() {
  window.dispatchEvent(new Event(FINANCE_CHANGED_EVENT));
}
