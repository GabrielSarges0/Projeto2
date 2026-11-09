import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");
const time = z.string().regex(/^\d{2}:\d{2}$/);

// ---------- Clientes (inquilino + fiador) ----------
export const CONTRACT_STATUSES = ["Ativo", "Próximo ao Vencimento", "Renovado", "Em Análise", "Encerrado"] as const;

export const clientDocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
});

export const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  cpf: z.string(),
  birthDate: isoDate.nullable().default(null),
  phone: z.string(),
  email: z.string(),
  residentsCount: z.number().int(),
  profession: z.string(),
  assetsDeclared: z.string(),
  propertyCode: z.string(),
  propertyAddress: z.string(),
  monthlyRent: z.number(),
  contractStatus: z.enum(CONTRACT_STATUSES),
  contractStartDate: isoDate,
  contractEndDate: isoDate,
  guarantorName: z.string(),
  guarantorCpf: z.string(),
  guarantorRelationship: z.string(),
  guarantorPhone: z.string(),
  guarantorAssets: z.string(),
  documents: z.array(clientDocumentSchema).default([]),
  updatedAt: z.string().optional(),
});
export type Client = z.infer<typeof clientSchema>;

// ---------- Estoque (DML) ----------
export const INVENTORY_CATEGORIES = ["Limpeza", "Obra / Manutenção", "Escritório"] as const;

export const inventoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  packageSpec: z.string(),
  unitPrice: z.number(),
  quantity: z.number().int(),
  minQuantity: z.number().int().default(5),
  category: z.enum(INVENTORY_CATEGORIES),
  lastPurchaseDate: isoDate,
});
export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export const INVENTORY_MOVEMENT_TYPES = ["ENTRADA", "RETIRADA", "DESCARTE"] as const;
export const INVENTORY_MOVEMENT_LABEL: Record<(typeof INVENTORY_MOVEMENT_TYPES)[number], string> = {
  ENTRADA: "Entrada (compra)",
  RETIRADA: "Retirada (uso)",
  DESCARTE: "Descarte",
};

export const inventoryMovementSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  itemName: z.string(),
  type: z.enum(INVENTORY_MOVEMENT_TYPES),
  quantity: z.number().int(),
  unitPrice: z.number().nullable().default(null),
  date: isoDate,
  responsible: z.string(),
  reason: z.string(),
  attachmentDocId: z.string().nullable().default(null),
  attachmentName: z.string().nullable().default(null),
  createdBy: z.string(),
  createdAt: z.string(),
});
export type InventoryMovement = z.infer<typeof inventoryMovementSchema>;

// ---------- Funcionários e presença ----------
export const EMPLOYEE_ROLES = ["Porteiro", "Serviços Gerais", "Assistente Administrativo", "Administrador", "Auxiliar de Limpeza"] as const;
export const EMPLOYEE_SITUATIONS = ["Ativo", "Inativo", "Afastado", "Férias", "Licença", "Desligado"] as const;
export type EmployeeSituation = (typeof EMPLOYEE_SITUATIONS)[number];

const employeeObject = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  cpf: z.string(),
  shiftStart: time,
  shiftEnd: time,
  breakStart: time,
  breakEnd: time,
  active: z.boolean().default(true),
  /** Situação no quadro (protótipo). "active" continua valendo: Desligado/Inativo saem da lista do dia. */
  situation: z.enum(EMPLOYEE_SITUATIONS).catch("Ativo"),
});

export const employeeSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object") return value;
  const raw = value as Record<string, unknown>;
  if (raw.situation === undefined) return { ...raw, situation: raw.active === false ? "Desligado" : "Ativo" };
  return raw;
}, employeeObject);
export type Employee = z.infer<typeof employeeObject>;

export const ATTENDANCE_STATUSES = ["Presente", "Ausente", "Folga", "Atestado"] as const;

export const attendanceSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  date: isoDate,
  status: z.enum(ATTENDANCE_STATUSES),
  entryTime: time.nullable().default(null),
  breakStart: time.nullable().default(null),
  breakEnd: time.nullable().default(null),
  exitTime: time.nullable().default(null),
  registeredBy: z.string().default(""),
});
export type Attendance = z.infer<typeof attendanceSchema>;

export const JUSTIFICATION_TYPES = ["Ausência", "Atraso", "Saída antecipada"] as const;
export const JUSTIFICATION_STATUSES = ["Pendente", "Aprovada", "Rejeitada"] as const;

export const justificationSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  date: isoDate,
  type: z.enum(JUSTIFICATION_TYPES),
  reason: z.string(),
  attachmentDocId: z.string().nullable().default(null),
  attachmentName: z.string().nullable().default(null),
  status: z.enum(JUSTIFICATION_STATUSES),
  submittedAt: z.string(),
  submittedBy: z.string(),
  reviewedBy: z.string().nullable().default(null),
  reviewedAt: z.string().nullable().default(null),
  reviewNote: z.string().nullable().default(null),
});
export type Justification = z.infer<typeof justificationSchema>;

// ---------- Documentos ----------
export const DOCUMENT_CATEGORIES = [
  "Contrato",
  "Comprovante",
  "Recibo",
  "Prestação de Contas",
  "Relatório",
  "Ata",
  "Notificação MP",
  "Laudo Técnico",
  "Documento Pessoal",
  "Justificativa",
  "Estatuto",
  "Outro",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const folderSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable().default(null),
  createdAt: z.string(),
});
export type Folder = z.infer<typeof folderSchema>;

// ---------- Formatação dos modelos (Backlog 3) ----------
export const TEMPLATE_FONTS = ["serif", "sans"] as const;
export const TEMPLATE_ALIGNS = ["justify", "left"] as const;
export const TEMPLATE_SIZES = ["normal", "large"] as const;

/** Texto e aparência de um documento. Nos modelos o texto tem {campos}; no documento gerado já vem preenchido. */
export const templateLayoutSchema = z.object({
  header: z.string(),
  title: z.string(),
  paragraphs: z.array(z.string()),
  font: z.enum(TEMPLATE_FONTS).catch("serif"),
  align: z.enum(TEMPLATE_ALIGNS).catch("justify"),
  size: z.enum(TEMPLATE_SIZES).catch("normal"),
});
export type TemplateLayout = z.infer<typeof templateLayoutSchema>;

/** Formatação escolhida para um modelo; o id é o id do modelo. Sem registro, vale o texto padrão. */
export const templateSettingSchema = templateLayoutSchema.extend({
  id: z.string(),
  updatedBy: z.string().default(""),
  updatedAt: z.string().default(""),
});
export type TemplateSetting = z.infer<typeof templateSettingSchema>;

export const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  folderId: z.string().nullable().default(null),
  category: z.enum(DOCUMENT_CATEGORIES).catch("Outro"),
  createdAt: z.string(),
  sizeBytes: z.number().int().default(0),
  mimeType: z.string().nullable().default(null),
  fileParts: z.number().int().default(0),
  protocol: z.string(),
  signed: z.boolean().default(false),
  description: z.string().default(""),
  template: z.string().nullable().default(null),
  templateData: z.record(z.string(), z.string()).nullable().default(null),
  /** Texto como foi gerado: mudar a formatação do modelo depois não altera documentos já emitidos. */
  rendered: templateLayoutSchema.nullable().catch(null),
  clientId: z.string().nullable().default(null),
  /** Movimentação financeira (entrada/saída) que este comprovante sustenta. */
  movementId: z.number().nullable().default(null),
  createdBy: z.string().default(""),
});
export type DocumentItem = z.infer<typeof documentSchema>;

export const documentFilePartSchema = z.object({
  id: z.string(),
  docId: z.string(),
  index: z.number().int(),
  content: z.string(),
});

// ---------- Ministério Público ----------
export const MP_STATUSES = ["Pendente", "Em revisão", "Aprovado", "Rejeitado", "Enviado", "Arquivado"] as const;
export const MP_CATEGORIES = [
  "Prestação de contas",
  "Relatórios financeiros",
  "Comprovante de despesas",
  "Contratos",
  "Documentos de imóveis",
  "Recibos de aluguel",
  "Notas fiscais",
  "Folhas de pagamento",
  "Documentos administrativos",
  "Outros",
] as const;
export type MpCategory = (typeof MP_CATEGORIES)[number];

// Valores gravados antes da tela seguir o protótipo (PDF "Tela de funcionários e MP").
const LEGACY_MP_CATEGORY: Record<string, MpCategory> = {
  "Prestação de Contas": "Prestação de contas",
  Imóveis: "Documentos de imóveis",
  Financeiro: "Relatórios financeiros",
  Atas: "Documentos administrativos",
  Relatórios: "Relatórios financeiros",
};

const mpSubmissionObject = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(MP_CATEGORIES).catch("Outros"),
  referencePeriod: z.string(),
  dueDate: isoDate,
  responsible: z.string(),
  status: z.enum(MP_STATUSES).catch("Pendente"),
  documentIds: z.array(z.string()).default([]),
  sentAt: z.string().nullable().default(null),
  /** Quando o MP confirmou o recebimento (antes era o status "Confirmado"). */
  confirmedAt: z.string().nullable().default(null),
  protocol: z.string().nullable().default(null),
  notes: z.string().default(""),
  /** Na lixeira: some da lista, mas pode ser restaurado. */
  trashedAt: z.string().nullable().default(null),
  history: z
    .array(z.object({ at: z.string(), by: z.string(), action: z.string() }))
    .default([]),
  createdAt: z.string(),
});

export const mpSubmissionSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object") return value;
  const raw = { ...(value as Record<string, unknown>) };
  if (typeof raw.category === "string" && LEGACY_MP_CATEGORY[raw.category]) raw.category = LEGACY_MP_CATEGORY[raw.category];
  if (raw.status === "Confirmado") {
    raw.status = "Enviado";
    raw.confirmedAt = raw.confirmedAt ?? raw.sentAt ?? null;
  }
  return raw;
}, mpSubmissionObject);
export type MpSubmission = z.infer<typeof mpSubmissionObject>;
