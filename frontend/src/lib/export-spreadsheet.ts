import { useCallback, useRef, useState } from "react";
import type { CellObject, Row, SheetData } from "write-excel-file/browser";
import { formatCurrency, formatDate, normalizeText, toCents } from "./format";
import type { FinancialMovement } from "./financial-api";
import { CONTRACT_STATUSES, type Attendance, type Client, type Employee, type InventoryItem } from "./schemas";

// Paleta do DESIGN.md (azul-marinho e dourado) + tons neutros e semânticos para a tabela.
const NAVY = "#092a54";
const GOLD = "#c3a95e";
const WHITE = "#ffffff";
const ZEBRA = "#f3f5f9";
const GRID = "#d5dbe5";
const MUTED = "#5b6474";
const TONE_COLOR = { positive: "#067647", negative: "#b42318", warning: "#8a5a00", muted: MUTED } as const;

const MONEY_FORMAT = '"R$" #,##0.00';
const DATE_FORMAT = "dd/mm/yyyy";
const INTEGER_FORMAT = "0";
const TEXT_FORMAT = "@";
const ORGANIZATION = "FUNDAÇÃO MANUEL CRUZ";

/** Linhas fixas acima da tabela: faixa, linha dourada, título, informações e espaço. */
const HEADER_ROW_INDEX = 6;

type ColumnKind = "text" | "longText" | "integer" | "money" | "date" | "time";
type Tone = keyof typeof TONE_COLOR;
type CellValue = string | number | null;

export type ReportCell = CellValue | { value: CellValue; tone: Tone };

export type ReportColumn = { header: string; kind: ColumnKind };

export type SummaryItem = { label: string; kind: "integer" | "money"; value: number; tone?: Tone };

export type SpreadsheetReport = {
  fileName: string;
  sheetName: string;
  title: string;
  details: string[];
  columns: ReportColumn[];
  rows: ReportCell[][];
  summary: SummaryItem[];
};

export type SpreadsheetLayout = {
  data: SheetData;
  columnWidths: number[];
  stickyRowsCount: number;
  landscape: boolean;
};

function cellParts(cell: ReportCell): { value: CellValue; tone?: Tone } {
  return cell !== null && typeof cell === "object" ? cell : { value: cell };
}

/** "2026-11-23" → Date em UTC: a biblioteca converte pela hora UTC, então o Excel mostra o mesmo dia. */
function isoToUtcDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function displayLength(kind: ColumnKind, value: CellValue): number {
  if (value === null || value === "") return 1;
  if (kind === "money" && typeof value === "number") return formatCurrency(value).length;
  if (kind === "date") return 10;
  return String(value).length;
}

function columnWidth(column: ReportColumn, values: CellValue[]): number {
  if (column.kind === "longText") return 42;
  const longest = Math.max(
    ...column.header.split(" ").map((word) => word.length),
    Math.ceil(column.header.length / 2),
    ...values.map((value) => displayLength(column.kind, value))
  );
  return Math.min(Math.max(longest + 3, 10), 40);
}

function dataCell(column: ReportColumn, cell: ReportCell, zebra: boolean): CellObject {
  const { value, tone } = cellParts(cell);
  const base: CellObject = {
    borderStyle: "thin",
    borderColor: GRID,
    alignVertical: "center",
    ...(zebra ? { backgroundColor: ZEBRA } : {}),
    ...(tone ? { textColor: TONE_COLOR[tone], fontWeight: "bold" as const } : {}),
  };

  if (value === null || value === "") {
    return { ...base, type: String, value: "—", align: "center", textColor: tone ? TONE_COLOR[tone] : MUTED };
  }
  switch (column.kind) {
    case "money":
      return typeof value === "number" ? { ...base, type: Number, value, format: MONEY_FORMAT, align: "right" } : { ...base, type: String, value };
    case "integer":
      return typeof value === "number" ? { ...base, type: Number, value, format: INTEGER_FORMAT, align: "center" } : { ...base, type: String, value };
    case "date": {
      const date = typeof value === "string" ? isoToUtcDate(value) : null;
      return date ? { ...base, type: Date, value: date, format: DATE_FORMAT, align: "center" } : { ...base, type: String, value: String(value), align: "center" };
    }
    case "time":
      return { ...base, type: String, value: String(value), format: TEXT_FORMAT, align: "center" };
    case "longText":
      return { ...base, type: String, value: String(value), format: TEXT_FORMAT, wrap: true };
    default:
      return { ...base, type: String, value: String(value), format: TEXT_FORMAT };
  }
}

/** Monta a planilha: faixa da Fundação, título, informações, tabela com cabeçalho fixo e resumo no fim. */
export function buildSpreadsheetLayout(report: SpreadsheetReport, generatedAt: Date): SpreadsheetLayout {
  const span = report.columns.length;
  const fill = (row: Row): Row => [...row, ...Array<null>(Math.max(span - row.length, 0)).fill(null)];
  const generated = generatedAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }).replace(", ", " às ");
  const details = [`Gerado em ${generated}`, ...report.details].join("  ·  ");

  const data: SheetData = [
    fill([{ value: ORGANIZATION, columnSpan: span, backgroundColor: NAVY, textColor: WHITE, fontWeight: "bold", fontSize: 14, height: 30, alignVertical: "center", indent: 1 }]),
    fill([{ value: "", columnSpan: span, backgroundColor: GOLD, height: 4 }]),
    fill([{ value: report.title, columnSpan: span, textColor: NAVY, fontWeight: "bold", fontSize: 13, height: 26, alignVertical: "bottom" }]),
    fill([{ value: details, columnSpan: span, textColor: MUTED, fontSize: 10, height: 18, alignVertical: "top" }]),
    fill([{ value: "", columnSpan: span, height: 8 }]),
    report.columns.map((column) => ({
      value: column.header,
      backgroundColor: NAVY,
      textColor: WHITE,
      fontWeight: "bold",
      align: "center",
      alignVertical: "center",
      wrap: true,
      height: 32,
      borderStyle: "thin",
      borderColor: NAVY,
      bottomBorderStyle: "medium",
      bottomBorderColor: GOLD,
    })),
  ];

  if (report.rows.length === 0) {
    data.push(fill([{ value: "Nenhum registro para exportar.", columnSpan: span, fontStyle: "italic", textColor: MUTED, align: "center", height: 24, alignVertical: "center" }]));
  } else {
    report.rows.forEach((row, index) => {
      data.push(report.columns.map((column, columnIndex) => dataCell(column, row[columnIndex] ?? null, index % 2 === 1)));
    });
  }

  if (report.summary.length > 0) {
    const labelSpan = Math.max(span - 1, 1);
    data.push(fill([{ value: "", columnSpan: span, height: 10 }]));
    data.push(fill([{ value: "Resumo", columnSpan: span, textColor: NAVY, fontWeight: "bold", fontSize: 12, height: 22, alignVertical: "bottom", bottomBorderStyle: "medium", bottomBorderColor: GOLD }]));
    report.summary.forEach((item, index) => {
      const shade = index % 2 === 1 ? { backgroundColor: ZEBRA } : {};
      const valueCell: CellObject = {
        type: Number,
        value: item.value,
        format: item.kind === "money" ? MONEY_FORMAT : INTEGER_FORMAT,
        align: "right",
        fontWeight: "bold",
        borderStyle: "thin",
        borderColor: GRID,
        ...shade,
        ...(item.tone ? { textColor: TONE_COLOR[item.tone] } : {}),
      };
      const labelCell: CellObject = { value: item.label, columnSpan: labelSpan, align: "right", borderStyle: "thin", borderColor: GRID, ...shade };
      data.push(span === 1 ? [valueCell] : [labelCell, ...Array<null>(labelSpan - 1).fill(null), valueCell]);
    });
  }

  const columnWidths = report.columns.map((column, columnIndex) => {
    const values = report.rows.map((row) => cellParts(row[columnIndex] ?? null).value);
    const width = columnWidth(column, values);
    if (columnIndex !== span - 1) return width;
    const summaryWidth = Math.max(0, ...report.summary.map((item) => (item.kind === "money" ? formatCurrency(item.value).length : String(item.value).length) + 3));
    return Math.max(width, summaryWidth);
  });

  return { data, columnWidths, stickyRowsCount: HEADER_ROW_INDEX, landscape: span >= 7 };
}

/** Gera o .xlsx no navegador. A biblioteca só é carregada no clique, fora do pacote inicial das páginas. */
export async function downloadSpreadsheet(report: SpreadsheetReport): Promise<void> {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const layout = buildSpreadsheetLayout(report, new Date());
  await writeXlsxFile(
    layout.data,
    {
      sheet: report.sheetName,
      columns: layout.columnWidths.map((width) => ({ width })),
      stickyRowsCount: layout.stickyRowsCount,
      showGridLines: false,
      ...(layout.landscape ? { orientation: "landscape" as const } : {}),
    },
    { fontFamily: "Calibri", fontSize: 11 }
  ).toFile(report.fileName);
}

function fileSlug(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function periodOf(isoDates: string[]): string | null {
  if (isoDates.length === 0) return null;
  const sorted = [...isoDates].sort();
  return `Período: ${formatDate(sorted[0])} a ${formatDate(sorted[sorted.length - 1])}`;
}

/** Extrato de lançamentos financeiros. `periodLabel` aparece no título (ex.: "Novembro/2026"). */
export function financialReport(movements: FinancialMovement[], periodLabel: string): SpreadsheetReport {
  const incomeCents = movements.filter((m) => m.type === "INCOME").reduce((sum, m) => sum + toCents(m.amount), 0);
  const expenseCents = movements.filter((m) => m.type === "EXPENSE").reduce((sum, m) => sum + toCents(m.amount), 0);
  const balanceCents = incomeCents - expenseCents;
  return {
    fileName: `extrato_financeiro_fmc_${fileSlug(periodLabel)}.xlsx`,
    sheetName: "Extrato financeiro",
    title: `Extrato financeiro · ${periodLabel}`,
    details: [plural(movements.length, "lançamento", "lançamentos")],
    columns: [
      { header: "ID", kind: "integer" },
      { header: "Data", kind: "date" },
      { header: "Tipo", kind: "text" },
      { header: "Beneficiário / Pagador", kind: "text" },
      { header: "Imóvel / Matrícula", kind: "text" },
      { header: "Valor (R$)", kind: "money" },
    ],
    rows: movements.map((m) => {
      const tone: Tone = m.type === "INCOME" ? "positive" : "negative";
      return [m.id, m.date, { value: m.type === "INCOME" ? "Entrada" : "Saída", tone }, m.tenantName, m.propertyRegistration, { value: m.amount, tone }];
    }),
    summary: [
      { label: "Total de entradas", kind: "money", value: incomeCents / 100, tone: "positive" },
      { label: "Total de saídas", kind: "money", value: expenseCents / 100, tone: "negative" },
      { label: "Saldo do período", kind: "money", value: balanceCents / 100, tone: balanceCents < 0 ? "negative" : "positive" },
    ],
  };
}

const CONTRACT_TONE: Partial<Record<Client["contractStatus"], Tone>> = {
  "Próximo ao Vencimento": "warning",
  Encerrado: "muted",
};

export function clientsReport(clients: Client[]): SpreadsheetReport {
  const rentCents = clients.reduce((sum, client) => sum + toCents(client.monthlyRent), 0);
  const byStatus = CONTRACT_STATUSES.map((status) => ({ status, count: clients.filter((client) => client.contractStatus === status).length })).filter(
    (entry) => entry.count > 0
  );
  return {
    fileName: "clientes_fundacao_manuel_cruz.xlsx",
    sheetName: "Clientes",
    title: "Cadastro de clientes",
    details: [plural(clients.length, "cliente", "clientes")],
    columns: [
      { header: "Nome / Razão Social", kind: "text" },
      { header: "CPF", kind: "text" },
      { header: "E-mail", kind: "text" },
      { header: "Telefone", kind: "text" },
      { header: "Imóvel Vinculado", kind: "text" },
      { header: "Endereço do Imóvel", kind: "longText" },
      { header: "Aluguel Mensal", kind: "money" },
      { header: "Status do Contrato", kind: "text" },
      { header: "Início do Contrato", kind: "date" },
      { header: "Fim do Contrato", kind: "date" },
    ],
    rows: clients.map((c) => {
      const tone = CONTRACT_TONE[c.contractStatus];
      return [
        c.name,
        c.cpf,
        c.email,
        c.phone,
        c.propertyCode,
        c.propertyAddress,
        c.monthlyRent,
        tone ? { value: c.contractStatus, tone } : c.contractStatus,
        c.contractStartDate,
        c.contractEndDate,
      ];
    }),
    summary: [
      { label: "Clientes cadastrados", kind: "integer", value: clients.length },
      ...byStatus.map((entry) => ({ label: `Contratos: ${entry.status}`, kind: "integer" as const, value: entry.count, tone: CONTRACT_TONE[entry.status] })),
      { label: "Soma dos aluguéis mensais", kind: "money", value: rentCents / 100 },
    ],
  };
}

function inventoryStatus(item: InventoryItem): { label: string; tone?: Tone } {
  if (item.quantity <= 0) return { label: "Esgotado", tone: "negative" };
  if (item.quantity <= item.minQuantity) return { label: "Crítico / Baixo", tone: "warning" };
  return { label: "Normal" };
}

export function inventoryReport(items: InventoryItem[]): SpreadsheetReport {
  const statuses = items.map(inventoryStatus);
  const stockCents = items.reduce((sum, item) => sum + toCents(item.unitPrice) * Math.max(item.quantity, 0), 0);
  return {
    fileName: "estoque_inventario_fmc.xlsx",
    sheetName: "Estoque",
    title: "Inventário do estoque",
    details: [plural(items.length, "item", "itens")],
    columns: [
      { header: "ID", kind: "text" },
      { header: "Nome do Item", kind: "text" },
      { header: "Especificação / Embalagem", kind: "text" },
      { header: "Categoria", kind: "text" },
      { header: "Quantidade Atual", kind: "integer" },
      { header: "Quantidade Mínima", kind: "integer" },
      { header: "Preço Unitário (R$)", kind: "money" },
      { header: "Situação", kind: "text" },
      { header: "Última Compra", kind: "date" },
    ],
    rows: items.map((item, index) => {
      const status = statuses[index];
      return [
        item.id,
        item.name,
        item.packageSpec,
        item.category,
        item.quantity,
        item.minQuantity,
        item.unitPrice,
        status.tone ? { value: status.label, tone: status.tone } : status.label,
        item.lastPurchaseDate,
      ];
    }),
    summary: [
      { label: "Itens cadastrados", kind: "integer", value: items.length },
      { label: "Itens em nível crítico", kind: "integer", value: statuses.filter((s) => s.tone === "warning").length, tone: "warning" },
      { label: "Itens esgotados", kind: "integer", value: statuses.filter((s) => s.tone === "negative").length, tone: "negative" },
      { label: "Valor total em estoque", kind: "money", value: stockCents / 100 },
    ],
  };
}

const ATTENDANCE_TONE: Partial<Record<Attendance["status"], Tone>> = { Ausente: "negative", Atestado: "warning", Folga: "muted" };

/** Espelho de ponto de um colaborador. `monthLabel` ("2026-11") só entra no nome do arquivo, como antes. */
export function attendanceReport(employee: Employee, records: Attendance[], monthLabel: string): SpreadsheetReport {
  const count = (status: Attendance["status"]) => records.filter((record) => record.status === status).length;
  const period = periodOf(records.map((record) => record.date));
  return {
    fileName: `espelho_ponto_${fileSlug(employee.name)}_${fileSlug(monthLabel)}.xlsx`,
    sheetName: "Espelho de ponto",
    title: `Espelho de ponto · ${employee.name}`,
    details: [plural(records.length, "registro", "registros"), ...(period ? [period] : [])],
    columns: [
      { header: "Data", kind: "date" },
      { header: "Entrada", kind: "time" },
      { header: "Início do Intervalo", kind: "time" },
      { header: "Fim do Intervalo", kind: "time" },
      { header: "Saída", kind: "time" },
      { header: "Localização Registrada", kind: "text" },
      { header: "Status", kind: "text" },
      { header: "Registrado Por", kind: "text" },
    ],
    rows: records.map((r) => {
      const tone = ATTENDANCE_TONE[r.status];
      return [
        r.date,
        r.entryTime,
        r.breakStart,
        r.breakEnd,
        r.exitTime,
        r.entryLocation || r.exitLocation ? "Sim (geolocalização)" : "Não informada",
        tone ? { value: r.status, tone } : r.status,
        r.registeredBy || null,
      ];
    }),
    summary: [
      { label: "Registros", kind: "integer", value: records.length },
      { label: "Presenças", kind: "integer", value: count("Presente") },
      { label: "Faltas", kind: "integer", value: count("Ausente"), tone: "negative" },
      { label: "Folgas", kind: "integer", value: count("Folga") },
      { label: "Atestados", kind: "integer", value: count("Atestado"), tone: "warning" },
    ],
  };
}

/** Estado de carregamento e erro dos botões de exportar: evita clique duplo enquanto a planilha é gerada. */
export function useSpreadsheetExport(notify: (message: string, tone: "success" | "error") => void) {
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const run = useCallback(
    async (report: () => SpreadsheetReport) => {
      if (running.current) return;
      running.current = true;
      setBusy(true);
      try {
        await downloadSpreadsheet(report());
      } catch (error) {
        console.error("Falha ao gerar a planilha", error);
        notify("Não foi possível gerar a planilha. Tente de novo.", "error");
      } finally {
        running.current = false;
        setBusy(false);
      }
    },
    [notify]
  );
  return { busy, run };
}
