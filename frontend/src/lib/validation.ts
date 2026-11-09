import { formatCurrency, isValidIsoDate, todayIso } from "./format";

/** Mesmas regras do backend (BrazilianDocumentValidator): dígitos verificadores e sequências repetidas. */
export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const calc = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i += 1) sum += Number(digits[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
}

export function isValidCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;
  const calc = (length: number) => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, weight, i) => acc + Number(digits[i]) * weight, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return calc(12) === Number(digits[12]) && calc(13) === Number(digits[13]);
}

export function formatCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatCnpj(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function isValidPhone(value: string): boolean {
  const d = value.replace(/\D/g, "");
  return d.length === 10 || d.length === 11;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

// Pessoa ou empresa: ao menos 3 letras, sem símbolos estranhos (mesma regra do backend).
const PERSON_NAME = /^(?=(?:.*\p{L}){3})[\p{L}\d][\p{L}\d &.,'/-]*$/u;

export function personNameError(value: string, label = "Nome"): string | null {
  const name = value.trim().replace(/\s+/g, " ");
  if (!name) return `Informe o ${label.toLowerCase()}.`;
  if (name.length < 3) return `${label} muito curto.`;
  if (name.length > 160) return `${label} muito longo (máx. 160).`;
  if (!PERSON_NAME.test(name)) return `${label} inválido: use letras (mínimo 3) e sem símbolos.`;
  return null;
}

export const MAX_AMOUNT = 1_000_000;

export function amountError(value: number, { allowZero = false, max = MAX_AMOUNT, label = "Valor" } = {}): string | null {
  if (!Number.isFinite(value)) return `Informe o ${label.toLowerCase()}.`;
  if (value < 0) return `${label} não pode ser negativo.`;
  if (!allowZero && value <= 0) return `${label} deve ser maior que zero.`;
  if (value > max) return `${label} deve ser de no máximo ${formatCurrency(max)}.`;
  return null;
}

export const EARLIEST_DATE = "2000-01-01";

/** Datas de fatos já ocorridos (entrada, saída, compra): válidas, a partir de 2000 e não futuras. */
export function pastDateError(iso: string, label = "Data"): string | null {
  if (!iso) return `Informe a ${label.toLowerCase()}.`;
  if (!isValidIsoDate(iso)) return `${label} inválida.`;
  if (iso < EARLIEST_DATE) return `${label} deve ser a partir de 01/01/2000.`;
  if (iso > todayIso()) return `${label} não pode estar no futuro.`;
  return null;
}

/** Prazos (lembretes, envios): válidos, a partir de hoje e no máximo 5 anos à frente. */
export function deadlineError(iso: string, { allowPast = false } = {}): string | null {
  if (!iso) return "Informe a data limite.";
  if (!isValidIsoDate(iso)) return "Data limite inválida.";
  const today = todayIso();
  if (!allowPast && iso < today) return "A data limite não pode estar no passado.";
  const [y, m, d] = today.split("-");
  if (iso > `${Number(y) + 5}-${m}-${d}`) return "A data limite deve estar nos próximos 5 anos.";
  return null;
}

export function lengthError(value: string, label: string, min: number, max: number): string | null {
  const length = value.trim().length;
  if (length < min) return min === 1 ? `Informe ${label}.` : `${label} deve ter ao menos ${min} caracteres.`;
  if (length > max) return `${label} deve ter no máximo ${max} caracteres.`;
  return null;
}
