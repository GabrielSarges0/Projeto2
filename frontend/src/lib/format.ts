const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/** Máscara de digitação: "123456" → "R$ 1.234,56". Trabalha em centavos para não acumular erro de ponto flutuante. */
export function formatMoneyInput(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 11);
  if (!digits) return "";
  return currencyFormatter.format(Number(digits) / 100);
}

/** "R$ 1.234,56" → 1234.56 (NaN se vazio/inválido). */
export function parseMoney(value: string): number {
  const cleaned = value.replace(/\s/g, "").replace(/^R\$/i, "").replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
  if (!cleaned) return Number.NaN;
  return Number(cleaned);
}

export function toCents(value: number): number {
  return Math.round(value * 100);
}

export const MONTHS = [
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
] as const;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Data local (não UTC) no formato YYYY-MM-DD — evita "pular" um dia à noite no fuso de Brasília. */
export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isValidIsoDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [datePart] = iso.split("T");
  const [y, m, d] = datePart.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function daysUntil(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const [ty, tm, td] = todayIso().split("-").map(Number);
  const today = new Date(ty, tm - 1, td).getTime();
  return Math.round((target - today) / 86_400_000);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function newId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}-${random}`;
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
