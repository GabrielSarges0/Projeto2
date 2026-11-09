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
export const employeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  cpf: z.string(),
  shiftStart: time,
  shiftEnd: time,
  breakStart: time,
  breakEnd: time,
  active: z.boolean().default(true),
});
export type Employee = z.infer<typeof employeeSchema>;

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
export const MP_STATUSES = ["Pendente", "Em revisão", "Enviado", "Confirmado"] as const;
export const MP_CATEGORIES = ["Prestação de Contas", "Imóveis", "Financeiro", "Contratos", "Atas", "Relatórios"] as const;

export const mpSubmissionSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(MP_CATEGORIES),
  referencePeriod: z.string(),
  dueDate: isoDate,
  responsible: z.string(),
  status: z.enum(MP_STATUSES),
  documentIds: z.array(z.string()).default([]),
  sentAt: z.string().nullable().default(null),
  protocol: z.string().nullable().default(null),
  notes: z.string().default(""),
  history: z
    .array(z.object({ at: z.string(), by: z.string(), action: z.string() }))
    .default([]),
  createdAt: z.string(),
});
export type MpSubmission = z.infer<typeof mpSubmissionSchema>;
