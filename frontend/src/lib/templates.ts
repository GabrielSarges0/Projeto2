import { FOLDER_IDS } from "./documents";
import { formatCurrency, formatDate, parseMoney } from "./format";
import type { DocumentCategory } from "./schemas";

export type TemplateField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "money" | "number" | "select" | "property" | "client";
  required?: boolean;
  options?: string[];
  placeholder?: string;
  maxLength?: number;
};

export type DocumentTemplate = {
  id: string;
  label: string;
  description: string;
  category: DocumentCategory;
  folderId: string;
  fields: TemplateField[];
  fileName: (data: Record<string, string>) => string;
  render: (data: Record<string, string>) => { title: string; paragraphs: string[] };
};

const ORG = "FUNDAÇÃO MANUEL CRUZ";
const slug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60);
const money = (value: string) => {
  const parsed = parseMoney(value);
  return Number.isFinite(parsed) ? formatCurrency(parsed) : value;
};

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "recibo",
    label: "Recibo de pagamento de aluguel",
    description: "Comprovante de quitação mensal entregue ao inquilino.",
    category: "Recibo",
    folderId: FOLDER_IDS.comprovantes,
    fields: [
      { key: "imovel", label: "Imóvel", type: "property", required: true },
      { key: "inquilino", label: "Inquilino", type: "text", required: true, maxLength: 160 },
      { key: "cpfCnpj", label: "CPF/CNPJ do inquilino", type: "text", required: true, maxLength: 18 },
      { key: "valor", label: "Valor pago", type: "money", required: true },
      { key: "mesReferencia", label: "Mês de referência", type: "text", required: true, placeholder: "Ex.: Outubro/2026", maxLength: 40 },
      { key: "dataEmissao", label: "Data de emissão", type: "date", required: true },
    ],
    fileName: (d) => `Recibo_Aluguel_${slug(d.imovel)}_${slug(d.mesReferencia)}.pdf`,
    render: (d) => ({
      title: "RECIBO DE PAGAMENTO DE ALUGUEL",
      paragraphs: [
        `Declaramos para os devidos fins que recebemos de ${d.inquilino}, inscrito(a) no CPF/CNPJ sob o nº ${d.cpfCnpj}, a quantia de ${money(d.valor)}, referente ao pagamento do aluguel do imóvel ${d.imovel}, relativo a ${d.mesReferencia}.`,
        `Com o pagamento desta quantia, a ${ORG} confere plena, rasa e geral quitação das obrigações locatícias ordinárias do período mencionado.`,
        `Recife, ${formatDate(d.dataEmissao)}.`,
      ],
    }),
  },
  {
    id: "contrato",
    label: "Contrato de locação",
    description: "Contrato padrão de locação residencial ou comercial.",
    category: "Contrato",
    folderId: FOLDER_IDS.contratos,
    fields: [
      { key: "imovel", label: "Imóvel", type: "property", required: true },
      { key: "inquilino", label: "Locatário(a)", type: "text", required: true, maxLength: 160 },
      { key: "cpfCnpj", label: "CPF/CNPJ do locatário", type: "text", required: true, maxLength: 18 },
      { key: "fiador", label: "Fiador(a)", type: "text", maxLength: 160 },
      { key: "valor", label: "Aluguel mensal", type: "money", required: true },
      { key: "dataInicio", label: "Início da locação", type: "date", required: true },
      { key: "prazoMeses", label: "Prazo (meses)", type: "number", required: true },
    ],
    fileName: (d) => `Contrato_Locacao_${slug(d.imovel)}_${slug(d.inquilino)}.pdf`,
    render: (d) => ({
      title: "CONTRATO DE LOCAÇÃO",
      paragraphs: [
        `LOCADORA: ${ORG}. LOCATÁRIO(A): ${d.inquilino}, CPF/CNPJ ${d.cpfCnpj}.${d.fiador ? ` FIADOR(A): ${d.fiador}.` : ""}`,
        `CLÁUSULA 1ª — O objeto deste contrato é o imóvel ${d.imovel}, destinado ao uso declarado pelo(a) locatário(a).`,
        `CLÁUSULA 2ª — O prazo da locação é de ${d.prazoMeses} meses, com início em ${formatDate(d.dataInicio)}.`,
        `CLÁUSULA 3ª — O aluguel mensal é de ${money(d.valor)}, pagável até o dia 10 de cada mês, reajustado anualmente pelo índice oficial.`,
        "CLÁUSULA 4ª — O atraso no pagamento sujeita o(a) locatário(a) a multa de 2% e juros de 1% ao mês.",
      ],
    }),
  },
  {
    id: "vistoria",
    label: "Termo de vistoria predial",
    description: "Registro do estado do imóvel na entrega ou devolução.",
    category: "Laudo Técnico",
    folderId: FOLDER_IDS.contratos,
    fields: [
      { key: "imovel", label: "Imóvel", type: "property", required: true },
      { key: "responsavel", label: "Responsável pela vistoria", type: "text", required: true, maxLength: 120 },
      { key: "dataVistoria", label: "Data da vistoria", type: "date", required: true },
      { key: "estado", label: "Estado geral", type: "select", required: true, options: ["Bom", "Regular", "Ruim"] },
      { key: "observacoes", label: "Observações", type: "textarea", maxLength: 2000 },
    ],
    fileName: (d) => `Termo_Vistoria_${slug(d.imovel)}_${d.dataVistoria}.pdf`,
    render: (d) => ({
      title: "TERMO DE VISTORIA PREDIAL",
      paragraphs: [
        `Em ${formatDate(d.dataVistoria)}, ${d.responsavel} realizou a vistoria do imóvel ${d.imovel}, de propriedade da ${ORG}.`,
        `Estado geral constatado: ${d.estado}.`,
        d.observacoes ? `Observações: ${d.observacoes}` : "Sem observações adicionais.",
      ],
    }),
  },
  {
    id: "prestacao",
    label: "Prestação de contas trimestral",
    description: "Resumo financeiro enviado ao Ministério Público.",
    category: "Prestação de Contas",
    folderId: FOLDER_IDS.ministerioPublico,
    fields: [
      { key: "trimestre", label: "Trimestre", type: "select", required: true, options: ["1º", "2º", "3º", "4º"] },
      { key: "ano", label: "Ano", type: "number", required: true },
      { key: "totalEntradas", label: "Total de entradas", type: "money", required: true },
      { key: "totalSaidas", label: "Total de saídas", type: "money", required: true },
      { key: "responsavel", label: "Responsável", type: "text", required: true, maxLength: 120 },
      { key: "observacoes", label: "Observações", type: "textarea", maxLength: 2000 },
    ],
    fileName: (d) => `Prestacao_Contas_${slug(d.trimestre)}Trimestre_${d.ano}.pdf`,
    render: (d) => ({
      title: `PRESTAÇÃO DE CONTAS — ${d.trimestre} TRIMESTRE DE ${d.ano}`,
      paragraphs: [
        `A ${ORG} apresenta ao Ministério Público a prestação de contas do ${d.trimestre} trimestre de ${d.ano}.`,
        `Total de entradas: ${money(d.totalEntradas)}. Total de saídas: ${money(d.totalSaidas)}.`,
        d.observacoes ? `Observações: ${d.observacoes}` : "Sem observações adicionais.",
        `Responsável: ${d.responsavel}.`,
      ],
    }),
  },
  {
    id: "relatorio-alugueis",
    label: "Relatório de aluguéis",
    description: "Receita de aluguéis e ocupação dos imóveis no período (modelo do MP).",
    category: "Relatório",
    folderId: FOLDER_IDS.ministerioPublico,
    fields: [
      { key: "periodo", label: "Período", type: "text", required: true, placeholder: "Ex.: Setembro/2026", maxLength: 40 },
      { key: "totalRecebido", label: "Total recebido", type: "money", required: true },
      { key: "imoveisOcupados", label: "Imóveis ocupados", type: "number", required: true },
      { key: "inadimplencia", label: "Valores em atraso", type: "money" },
      { key: "observacoes", label: "Observações", type: "textarea", maxLength: 2000 },
    ],
    fileName: (d) => `Relatorio_Alugueis_${slug(d.periodo)}.pdf`,
    render: (d) => ({
      title: `RELATÓRIO DE ALUGUÉIS — ${d.periodo.toUpperCase()}`,
      paragraphs: [
        `No período de ${d.periodo}, a ${ORG} recebeu ${money(d.totalRecebido)} em aluguéis, com ${d.imoveisOcupados} imóvel(is) ocupado(s).`,
        d.inadimplencia ? `Valores em atraso no período: ${money(d.inadimplencia)}.` : "Não há valores em atraso no período.",
        d.observacoes ? `Observações: ${d.observacoes}` : "",
      ].filter(Boolean),
    }),
  },
  {
    id: "comprovante-despesas",
    label: "Comprovante de despesas",
    description: "Declaração de despesa paga, com fornecedor e finalidade (modelo do MP).",
    category: "Comprovante",
    folderId: FOLDER_IDS.ministerioPublico,
    fields: [
      { key: "fornecedor", label: "Fornecedor / prestador", type: "text", required: true, maxLength: 160 },
      { key: "descricao", label: "Descrição da despesa", type: "textarea", required: true, maxLength: 1000 },
      { key: "valor", label: "Valor", type: "money", required: true },
      { key: "dataPagamento", label: "Data do pagamento", type: "date", required: true },
      { key: "responsavel", label: "Responsável", type: "text", required: true, maxLength: 120 },
    ],
    fileName: (d) => `Comprovante_Despesa_${slug(d.fornecedor)}_${d.dataPagamento}.pdf`,
    render: (d) => ({
      title: "COMPROVANTE DE DESPESA",
      paragraphs: [
        `Declaramos que em ${formatDate(d.dataPagamento)} a ${ORG} pagou ${money(d.valor)} a ${d.fornecedor}.`,
        `Finalidade: ${d.descricao}`,
        `Responsável pela despesa: ${d.responsavel}.`,
      ],
    }),
  },
  {
    id: "documentacao-contratos",
    label: "Documentação de contratos",
    description: "Situação dos contratos de locação no período (modelo do MP).",
    category: "Contrato",
    folderId: FOLDER_IDS.ministerioPublico,
    fields: [
      { key: "periodo", label: "Período", type: "text", required: true, placeholder: "Ex.: 3º trimestre/2026", maxLength: 40 },
      { key: "contratosAtivos", label: "Contratos ativos", type: "number", required: true },
      { key: "contratosVencendo", label: "Contratos vencendo em 30 dias", type: "number", required: true },
      { key: "contratosRenovados", label: "Contratos renovados", type: "number" },
      { key: "observacoes", label: "Observações", type: "textarea", maxLength: 2000 },
    ],
    fileName: (d) => `Documentacao_Contratos_${slug(d.periodo)}.pdf`,
    render: (d) => ({
      title: `DOCUMENTAÇÃO DE CONTRATOS — ${d.periodo.toUpperCase()}`,
      paragraphs: [
        `Contratos de locação ativos: ${d.contratosAtivos}. Vencendo nos próximos 30 dias: ${d.contratosVencendo}.`,
        d.contratosRenovados ? `Contratos renovados no período: ${d.contratosRenovados}.` : "",
        d.observacoes ? `Observações: ${d.observacoes}` : "",
      ].filter(Boolean),
    }),
  },
  {
    id: "ata",
    label: "Ata de reunião do conselho",
    description: "Registro de reunião, participantes e deliberações (modelo do MP).",
    category: "Ata",
    folderId: FOLDER_IDS.ministerioPublico,
    fields: [
      { key: "data", label: "Data da reunião", type: "date", required: true },
      { key: "local", label: "Local", type: "text", required: true, maxLength: 160 },
      { key: "participantes", label: "Participantes", type: "textarea", required: true, maxLength: 1000 },
      { key: "pauta", label: "Pauta", type: "textarea", required: true, maxLength: 2000 },
      { key: "deliberacoes", label: "Deliberações", type: "textarea", required: true, maxLength: 3000 },
    ],
    fileName: (d) => `Ata_Reuniao_${d.data}.pdf`,
    render: (d) => ({
      title: "ATA DE REUNIÃO DO CONSELHO",
      paragraphs: [
        `Aos ${formatDate(d.data)}, em ${d.local}, reuniu-se o conselho da ${ORG}.`,
        `Participantes: ${d.participantes}`,
        `Pauta: ${d.pauta}`,
        `Deliberações: ${d.deliberacoes}`,
      ],
    }),
  },
];

export function findTemplate(id: string | null | undefined): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find((template) => template.id === id);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

/** HTML pronto para imprimir/salvar como PDF pelo navegador. */
export function renderTemplateHtml(template: DocumentTemplate, data: Record<string, string>, protocol: string): string {
  const { title, paragraphs } = template.render(data);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 24px;color:#111;line-height:1.6}
h1{font-size:15px;text-align:center;letter-spacing:.5px}h2{font-size:18px;text-align:center;color:#092a54}
p{text-align:justify}footer{margin-top:48px;font-size:12px;color:#555;border-top:1px solid #ccc;padding-top:8px}</style></head>
<body><h1>${ORG}</h1><h2>${escapeHtml(title)}</h2>${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
<footer>Protocolo ${escapeHtml(protocol)} · gerado pelo Painel de Gestão FMC</footer></body></html>`;
}
