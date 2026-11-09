import { useCallback } from "react";
import { FOLDER_IDS } from "./documents";
import { formatCurrency, formatDate, formatDateTime, parseMoney } from "./format";
import { useRecords } from "./records";
import { templateSettingSchema, type DocumentCategory, type DocumentItem, type DocumentSignature, type TemplateLayout, type TemplateSetting } from "./schemas";
import { CURSIVE_STYLES, FMC_INSTITUTIONAL, documentVerificationUrl, formatSha256, generateQrCodeSvg, qrCodeToDataUrl } from "./signatures";

export type TemplateField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "money" | "number" | "select" | "property" | "client";
  required?: boolean;
  options?: string[];
  placeholder?: string;
  maxLength?: number;
  /** Texto usado quando o campo opcional fica vazio. Sem ele, o parágrafo que cita o campo sai do documento. */
  whenEmpty?: string;
};

export type DocumentTemplate = {
  id: string;
  label: string;
  description: string;
  category: DocumentCategory;
  folderId: string;
  fields: TemplateField[];
  fileName: (data: Record<string, string>) => string;
  /** Texto padrão; {campo} é trocado pelo valor preenchido no formulário. */
  defaultTitle: string;
  defaultParagraphs: string[];
};

export const ORGANIZATION_NAME = "FUNDAÇÃO MANUEL CRUZ";
/** Campos disponíveis em todos os modelos, além dos campos do formulário. */
export const GLOBAL_PLACEHOLDERS: { key: string; label: string }[] = [{ key: "fundacao", label: "Nome da Fundação" }];

export const LAYOUT_LIMITS = { header: 120, title: 200, paragraphs: 20, paragraph: 2000 } as const;

const slug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60);

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
    defaultTitle: "RECIBO DE PAGAMENTO DE ALUGUEL",
    defaultParagraphs: [
      "Declaramos para os devidos fins que recebemos de {inquilino}, inscrito(a) no CPF/CNPJ sob o nº {cpfCnpj}, a quantia de {valor}, referente ao pagamento do aluguel do imóvel {imovel}, relativo a {mesReferencia}.",
      "Com o pagamento desta quantia, a {fundacao} confere plena, rasa e geral quitação das obrigações locatícias ordinárias do período mencionado.",
      "Recife, {dataEmissao}.",
    ],
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
    defaultTitle: "CONTRATO DE LOCAÇÃO",
    defaultParagraphs: [
      "LOCADORA: {fundacao}. LOCATÁRIO(A): {inquilino}, CPF/CNPJ {cpfCnpj}.",
      "FIADOR(A): {fiador}.",
      "CLÁUSULA 1ª — O objeto deste contrato é o imóvel {imovel}, destinado ao uso declarado pelo(a) locatário(a).",
      "CLÁUSULA 2ª — O prazo da locação é de {prazoMeses} meses, com início em {dataInicio}.",
      "CLÁUSULA 3ª — O aluguel mensal é de {valor}, pagável até o dia 10 de cada mês, reajustado anualmente pelo índice oficial.",
      "CLÁUSULA 4ª — O atraso no pagamento sujeita o(a) locatário(a) a multa de 2% e juros de 1% ao mês.",
    ],
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
      { key: "observacoes", label: "Observações", type: "textarea", maxLength: 2000, whenEmpty: "nenhuma" },
    ],
    fileName: (d) => `Termo_Vistoria_${slug(d.imovel)}_${d.dataVistoria}.pdf`,
    defaultTitle: "TERMO DE VISTORIA PREDIAL",
    defaultParagraphs: [
      "Em {dataVistoria}, {responsavel} realizou a vistoria do imóvel {imovel}, de propriedade da {fundacao}.",
      "Estado geral constatado: {estado}.",
      "Observações: {observacoes}",
    ],
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
      { key: "observacoes", label: "Observações", type: "textarea", maxLength: 2000, whenEmpty: "nenhuma" },
    ],
    fileName: (d) => `Prestacao_Contas_${slug(d.trimestre)}Trimestre_${d.ano}.pdf`,
    defaultTitle: "PRESTAÇÃO DE CONTAS — {trimestre} TRIMESTRE DE {ano}",
    defaultParagraphs: [
      "A {fundacao} apresenta ao Ministério Público a prestação de contas do {trimestre} trimestre de {ano}.",
      "Total de entradas: {totalEntradas}. Total de saídas: {totalSaidas}.",
      "Observações: {observacoes}",
      "Responsável: {responsavel}.",
    ],
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
      { key: "inadimplencia", label: "Valores em atraso", type: "money", whenEmpty: "nenhum" },
      { key: "observacoes", label: "Observações", type: "textarea", maxLength: 2000 },
    ],
    fileName: (d) => `Relatorio_Alugueis_${slug(d.periodo)}.pdf`,
    defaultTitle: "RELATÓRIO DE ALUGUÉIS — {periodo}",
    defaultParagraphs: [
      "No período de {periodo}, a {fundacao} recebeu {totalRecebido} em aluguéis, com {imoveisOcupados} imóvel(is) ocupado(s).",
      "Valores em atraso no período: {inadimplencia}.",
      "Observações: {observacoes}",
    ],
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
    defaultTitle: "COMPROVANTE DE DESPESA",
    defaultParagraphs: [
      "Declaramos que em {dataPagamento} a {fundacao} pagou {valor} a {fornecedor}.",
      "Finalidade: {descricao}",
      "Responsável pela despesa: {responsavel}.",
    ],
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
    defaultTitle: "DOCUMENTAÇÃO DE CONTRATOS — {periodo}",
    defaultParagraphs: [
      "Contratos de locação ativos: {contratosAtivos}. Vencendo nos próximos 30 dias: {contratosVencendo}.",
      "Contratos renovados no período: {contratosRenovados}.",
      "Observações: {observacoes}",
    ],
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
    defaultTitle: "ATA DE REUNIÃO DO CONSELHO",
    defaultParagraphs: [
      "Aos {data}, em {local}, reuniu-se o conselho da {fundacao}.",
      "Participantes: {participantes}",
      "Pauta: {pauta}",
      "Deliberações: {deliberacoes}",
    ],
  },
];

export function findTemplate(id: string | null | undefined): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find((template) => template.id === id);
}

export function defaultLayout(template: DocumentTemplate): TemplateLayout {
  return {
    header: ORGANIZATION_NAME,
    title: template.defaultTitle,
    paragraphs: [...template.defaultParagraphs],
    font: "serif",
    align: "justify",
    size: "normal",
  };
}

/** Só a parte de formatação de um registro salvo (sem id/autor). */
export function layoutOf(setting: TemplateSetting): TemplateLayout {
  return { header: setting.header, title: setting.title, paragraphs: setting.paragraphs, font: setting.font, align: setting.align, size: setting.size };
}

const PLACEHOLDER = /\{([A-Za-z][A-Za-z0-9]*)\}/g;

export function placeholderKeys(text: string): string[] {
  return Array.from(text.matchAll(PLACEHOLDER), (match) => match[1]);
}

function formatValue(field: TemplateField, raw: string): string {
  if (field.type === "money") {
    const amount = parseMoney(raw);
    return Number.isFinite(amount) ? formatCurrency(amount) : raw;
  }
  if (field.type === "date") return formatDate(raw);
  return raw;
}

type RenderOptions = {
  /** Pré-visualização do formulário: campo obrigatório ainda vazio aparece como [Rótulo]. */
  showMissingRequired?: boolean;
};

/**
 * Preenche o texto do modelo com os dados do formulário. Um parágrafo que cita um campo opcional vazio
 * (sem texto alternativo) sai do documento, para não sobrar "Fiador(a): ." no contrato.
 */
export function renderTemplate(
  template: DocumentTemplate,
  data: Record<string, string>,
  layout?: TemplateLayout | null,
  options: RenderOptions = {}
): TemplateLayout {
  const base = layout ?? defaultLayout(template);
  const fields = new Map(template.fields.map((field) => [field.key, field]));

  const fill = (text: string): string | null => {
    let missing = false;
    const filled = text.replace(PLACEHOLDER, (match, key: string) => {
      if (key === "fundacao") return ORGANIZATION_NAME;
      const field = fields.get(key);
      if (!field) return match;
      const raw = (data[key] ?? "").trim();
      if (raw) return formatValue(field, raw);
      if (field.whenEmpty !== undefined) return field.whenEmpty;
      if (field.required && options.showMissingRequired) return `[${field.label}]`;
      missing = true;
      return "";
    });
    return missing ? null : filled.trim();
  };

  return {
    ...base,
    header: fill(base.header) ?? "",
    title: fill(base.title) ?? "",
    paragraphs: base.paragraphs.map(fill).filter((paragraph): paragraph is string => Boolean(paragraph)),
  };
}

/** Problemas que impedem salvar a formatação de um modelo; chave = "header" | "title" | "paragraph-<n>" | "paragraphs". */
export function validateLayout(template: DocumentTemplate, layout: TemplateLayout): Record<string, string> {
  const known = new Set([...template.fields.map((field) => field.key), ...GLOBAL_PLACEHOLDERS.map((item) => item.key)]);
  const errors: Record<string, string> = {};
  const unknownIn = (text: string) => placeholderKeys(text).filter((key) => !known.has(key));
  const describeUnknown = (keys: string[]) => `Campo desconhecido: ${keys.map((key) => `{${key}}`).join(", ")}. Use os botões de campo para inserir.`;

  if (layout.header.trim().length > LAYOUT_LIMITS.header) errors.header = `Máximo de ${LAYOUT_LIMITS.header} caracteres.`;
  else if (unknownIn(layout.header).length) errors.header = describeUnknown(unknownIn(layout.header));

  const title = layout.title.trim();
  if (title.length < 3) errors.title = "Informe um título com ao menos 3 caracteres.";
  else if (title.length > LAYOUT_LIMITS.title) errors.title = `Máximo de ${LAYOUT_LIMITS.title} caracteres.`;
  else if (unknownIn(title).length) errors.title = describeUnknown(unknownIn(title));

  const filled = layout.paragraphs.filter((paragraph) => paragraph.trim());
  if (filled.length === 0) errors.paragraphs = "O documento precisa de ao menos um parágrafo.";
  if (layout.paragraphs.length > LAYOUT_LIMITS.paragraphs) errors.paragraphs = `Máximo de ${LAYOUT_LIMITS.paragraphs} parágrafos.`;
  layout.paragraphs.forEach((paragraph, index) => {
    const key = `paragraph-${index}`;
    if (!paragraph.trim()) errors[key] = "Parágrafo vazio: escreva o texto ou remova-o.";
    else if (paragraph.length > LAYOUT_LIMITS.paragraph) errors[key] = `Máximo de ${LAYOUT_LIMITS.paragraph} caracteres.`;
    else if (unknownIn(paragraph).length) errors[key] = describeUnknown(unknownIn(paragraph));
  });
  return errors;
}

/** Dados de exemplo para a pré-visualização do editor: mostra onde cada campo entra. */
export function sampleData(template: DocumentTemplate): Record<string, string> {
  return Object.fromEntries(
    template.fields.map((field) => [field.key, field.type === "money" ? "1.500,00" : field.type === "date" ? "2026-10-05" : `[${field.label}]`])
  );
}

/** Formatação salva de cada modelo (coleção compartilhada no servidor). */
export function useTemplateSettings() {
  const store = useRecords("template-settings", templateSettingSchema);
  const { items } = store;
  const layoutFor = useCallback(
    (templateId: string): TemplateLayout | null => {
      const setting = items.find((item) => item.id === templateId);
      return setting ? layoutOf(setting) : null;
    },
    [items]
  );
  return { ...store, layoutFor };
}

/** Texto final de um documento: o que foi gravado na emissão ou, nos antigos, o modelo com a formatação atual. */
export function documentLayout(document: DocumentItem, layoutFor: (templateId: string) => TemplateLayout | null): TemplateLayout | null {
  if (document.rendered) return document.rendered;
  const template = findTemplate(document.template);
  if (!template || !document.templateData) return null;
  return renderTemplate(template, document.templateData, layoutFor(template.id));
}

export const LAYOUT_FONT_STACK: Record<TemplateLayout["font"], string> = {
  serif: "Georgia, 'Times New Roman', serif",
  sans: "Arial, Helvetica, sans-serif",
};
export const LAYOUT_FONT_SIZE: Record<TemplateLayout["size"], number> = { normal: 14, large: 16 };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

/** HTML pronto para imprimir/salvar como PDF pelo navegador. */
export function layoutToHtml(
  layout: TemplateLayout,
  protocol: string,
  signature?: DocumentSignature | null,
  documentId?: string
): string {
  const fontSize = LAYOUT_FONT_SIZE[layout.size] + 1;
  const qrUrl = signature ? documentVerificationUrl(documentId ?? "doc-preview", signature.sha256) : null;
  const qrDataUrl = signature && signature.includeQrCode && qrUrl ? qrCodeToDataUrl(generateQrCodeSvg(qrUrl, 2)) : null;

  let signatureHtml = "";
  if (signature) {
    if (signature.type === "institutional") {
      signatureHtml = `
      <div style="margin-top:40px;padding:14px;border:1.5px solid #092a54;border-radius:6px;background:#f8fafc;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="color:#092a54;font-weight:bold;font-size:13px;letter-spacing:0.5px;">${escapeHtml(FMC_INSTITUTIONAL.sealText.toUpperCase())}</div>
          <div style="font-weight:bold;font-size:13px;margin-top:2px;">${escapeHtml(FMC_INSTITUTIONAL.name)}</div>
          <div style="font-size:11px;color:#475569;">CNPJ: ${escapeHtml(FMC_INSTITUTIONAL.cnpj)}</div>
          <div style="font-size:12px;margin-top:4px;">Representante: <strong>${escapeHtml(signature.signedBy)}</strong> (${escapeHtml(signature.signerRole)})</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px;">Emitido em ${escapeHtml(formatDateTime(signature.signedAt))} · SHA-256: <code>${escapeHtml(formatSha256(signature.sha256))}</code></div>
        </div>
        ${qrDataUrl ? `<div style="text-align:center;"><img src="${qrDataUrl}" style="width:68px;height:68px;display:block;"/><span style="font-size:9px;color:#64748b;">Validação</span></div>` : ""}
      </div>`;
    } else if (signature.type === "hash") {
      signatureHtml = `
      <div style="margin-top:40px;padding:12px 14px;border:1px solid #10b981;border-radius:6px;background:#ecfdf5;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="color:#065f46;font-weight:bold;font-size:12px;letter-spacing:0.5px;">✓ DOCUMENTO ASSINADO DIGITALMENTE</div>
          <div style="font-weight:bold;font-size:13px;color:#064e3b;margin-top:2px;">${escapeHtml(signature.signedBy)} · <span style="font-weight:normal;">${escapeHtml(signature.signerRole)}</span></div>
          ${signature.signerEmail ? `<div style="font-size:11px;color:#047857;">${escapeHtml(signature.signerEmail)}</div>` : ""}
          <div style="font-size:10.5px;color:#065f46;margin-top:3px;">Assinado em ${escapeHtml(formatDateTime(signature.signedAt))} · SHA-256: <code>${escapeHtml(formatSha256(signature.sha256))}</code></div>
        </div>
        ${qrDataUrl ? `<div style="text-align:center;"><img src="${qrDataUrl}" style="width:64px;height:64px;display:block;"/><span style="font-size:9px;color:#065f46;">Validação</span></div>` : ""}
      </div>`;
    } else {
      const cursive = CURSIVE_STYLES[signature.cursiveStyle ?? "classic"] ?? CURSIVE_STYLES.classic;
      signatureHtml = `
      <div style="margin-top:40px;padding-top:16px;border-top:1px solid #cbd5e1;display:flex;justify-content:space-between;align-items:flex-end;">
        <div style="max-width:380px;">
          ${signature.signatureImage ? `<img src="${signature.signatureImage}" style="max-height:55px;max-width:260px;display:block;margin-bottom:4px;"/>` : signature.type === "cursive" ? `<div style="font-size:26px;color:#092a54;font-style:italic;margin-bottom:4px;font-family:${cursive.fontFamily};">${escapeHtml(signature.signedBy)}</div>` : ""}
          <div style="border-top:1.5px solid #334155;padding-top:4px;">
            <div style="font-weight:bold;font-size:13px;color:#0f172a;">${escapeHtml(signature.signedBy)}</div>
            <div style="font-size:11.5px;color:#475569;">${escapeHtml(signature.signerRole)}</div>
            ${signature.signerEmail ? `<div style="font-size:11px;color:#64748b;">${escapeHtml(signature.signerEmail)}</div>` : ""}
            <div style="font-size:10px;color:#64748b;margin-top:4px;">
              Assinado eletronicamente em ${escapeHtml(formatDateTime(signature.signedAt))}<br/>
              SHA-256: <code>${escapeHtml(formatSha256(signature.sha256))}</code>
            </div>
          </div>
        </div>
        ${qrDataUrl ? `<div style="text-align:center;"><img src="${qrDataUrl}" style="width:64px;height:64px;display:block;"/><span style="font-size:9px;color:#64748b;">Validar</span></div>` : ""}
      </div>`;
    }
  }

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(layout.title)}</title>
<style>body{font-family:${LAYOUT_FONT_STACK[layout.font]};font-size:${fontSize}px;max-width:720px;margin:40px auto;padding:0 24px;color:#111;line-height:1.6}
h1{font-size:15px;text-align:center;letter-spacing:.5px}h2{font-size:18px;text-align:center;color:#092a54}
p{text-align:${layout.align};white-space:pre-line}footer{margin-top:40px;font-size:11.5px;color:#555;border-top:1px solid #ccc;padding-top:8px}code{font-family:monospace;font-size:10px;}</style></head>
<body>${layout.header ? `<h1>${escapeHtml(layout.header)}</h1>` : ""}<h2>${escapeHtml(layout.title)}</h2>${layout.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
${signatureHtml}
<footer>Protocolo ${escapeHtml(protocol)} · gerado pelo Painel de Gestão FMC</footer></body></html>`;
}
