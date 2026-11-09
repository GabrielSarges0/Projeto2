import { formatCurrency, formatDate } from "./format";
import type { FinancialMovement } from "./financial-api";
import type { Client, InventoryItem, Employee, Attendance } from "./schemas";

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(";") || str.includes("\"") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const bom = "\uFEFF"; // Byte Order Mark para compatibilidade com Excel no Windows
  const headerLine = headers.map(escapeCsvField).join(";");
  const rowLines = rows.map((row) => row.map(escapeCsvField).join(";"));
  const csvContent = [headerLine, ...rowLines].join("\r\n");

  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** Exporta lançamentos financeiros para planilha CSV */
export function exportFinancialMovementsToCsv(
  movements: FinancialMovement[],
  periodLabel: string
): void {
  const headers = ["ID", "Data", "Tipo", "Beneficiário / Pagador", "Imóvel / Matrícula", "Valor (R$)"];
  const rows = movements.map((m) => [
    m.id,
    formatDate(m.date),
    m.type === "INCOME" ? "Entrada" : "Saída",
    m.tenantName,
    m.propertyRegistration,
    formatCurrency(m.amount),
  ]);

  const safePeriod = periodLabel.replace(/[\s/]/g, "_").toLowerCase();
  downloadCsv(`extrato_financeiro_fmc_${safePeriod}`, headers, rows);
}

/** Exporta cadastro de clientes para planilha CSV */
export function exportClientsToCsv(clients: Client[]): void {
  const headers = [
    "Nome / Razão Social",
    "CPF",
    "E-mail",
    "Telefone",
    "Imóvel Vinculado",
    "Endereço do Imóvel",
    "Aluguel Mensal",
    "Status Contrato",
    "Início Contrato",
    "Fim Contrato",
  ];
  const rows = clients.map((c) => [
    c.name,
    c.cpf,
    c.email,
    c.phone,
    c.propertyCode,
    c.propertyAddress,
    formatCurrency(c.monthlyRent),
    c.contractStatus,
    formatDate(c.contractStartDate),
    formatDate(c.contractEndDate),
  ]);

  downloadCsv("clientes_fundacao_manuel_cruz", headers, rows);
}

/** Exporta inventário de estoque para planilha CSV */
export function exportInventoryToCsv(items: InventoryItem[]): void {
  const headers = [
    "ID",
    "Nome do Item",
    "Especificação / Embalagem",
    "Categoria",
    "Quantidade Atual",
    "Quantidade Mínima",
    "Preço Unitário (R$)",
    "Situação",
    "Última Compra",
  ];
  const rows = items.map((item) => {
    let situacao = "Normal";
    if (item.quantity <= 0) situacao = "Esgotado";
    else if (item.quantity <= item.minQuantity) situacao = "Crítico / Baixo";

    return [
      item.id,
      item.name,
      item.packageSpec,
      item.category,
      item.quantity,
      item.minQuantity,
      formatCurrency(item.unitPrice),
      situacao,
      formatDate(item.lastPurchaseDate),
    ];
  });

  downloadCsv("estoque_inventario_fmc", headers, rows);
}

/** Exporta folha / espelho de ponto de um colaborador */
export function exportAttendanceToCsv(
  employee: Employee,
  records: Attendance[],
  monthLabel: string
): void {
  const headers = [
    "Data",
    "Entrada",
    "Início Intervalo",
    "Fim Intervalo",
    "Saída",
    "Localização Registrada",
    "Status",
    "Registrado Por",
  ];
  const rows = records.map((r) => [
    formatDate(r.date),
    r.entryTime || "—",
    r.breakStart || "—",
    r.breakEnd || "—",
    r.exitTime || "—",
    r.entryLocation || r.exitLocation ? "Sim (Geolocalização)" : "Não informada",
    r.status,
    r.registeredBy || "—",
  ]);

  const safeEmp = employee.name.replace(/\s+/g, "_").toLowerCase();
  downloadCsv(`espelho_ponto_${safeEmp}_${monthLabel.replace(/\s+/g, "_").toLowerCase()}`, headers, rows);
}
