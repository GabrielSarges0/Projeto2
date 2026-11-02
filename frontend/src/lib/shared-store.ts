// Gerenciador de Estado Compartilhado e Persistência Local para a Fundação Manuel Cruz
// Garante sincronização imediata entre DashboardHome, Painel Financeiro e Documentos

export type PropertySituation = "Ocupado" | "Livre" | "Manutenção";

export type FMCProperty = {
  id: string;
  code: string;
  address: string;
  situation: PropertySituation;
  statusType: "green" | "yellow" | "red";
  value: string;
  monthlyRentNum: number;
  tenant: string;
  details: string;
};

export type FMCReminder = {
  id: string;
  title: string;
  category: "Financeiro" | "Imóvel / Reforma" | "Prestação MP" | "Contrato" | "Operacional" | "Outro";
  priority: "Alta" | "Média" | "Baixa";
  deadline: string;
  responsible: string;
  description: string;
  done: boolean;
  createdAt: string;
};

export type FMCSharedMovement = {
  id: number | string;
  date: string; // YYYY-MM-DD
  tenantName: string;
  propertyRegistration: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category?: string;
  documentId?: string;
  documentName?: string;
  protocol?: string;
  observations?: string;
};

const DEFAULT_PROPERTIES: FMCProperty[] = [
  {
    id: "1",
    code: "IM-001",
    address: "Rua A, 120 - Boa Vista",
    situation: "Ocupado",
    statusType: "green",
    value: "R$ 3.200,00",
    monthlyRentNum: 3200,
    tenant: "João Pedro Cavalcanti",
    details: "Imóvel residencial locado. Contrato ativo com vencimento em Outubro/2026.",
  },
  {
    id: "2",
    code: "IM-002",
    address: "Rua A, 26 - Sala Comercial",
    situation: "Ocupado",
    statusType: "green",
    value: "R$ 2.850,00",
    monthlyRentNum: 2850,
    tenant: "Maria Helena Silva",
    details: "Imóvel comercial locado. Vistoria regular realizada em 2026.",
  },
  {
    id: "3",
    code: "IM-003",
    address: "Rua B, 75 - Térreo",
    situation: "Livre",
    statusType: "yellow",
    value: "R$ 2.400,00",
    monthlyRentNum: 2400,
    tenant: "Disponível para locação",
    details: "Imóvel desocupado e disponível para locação. Chaves sob custódia da administração.",
  },
  {
    id: "4",
    code: "IM-004",
    address: "Rua C, 173 - Apartamento",
    situation: "Manutenção",
    statusType: "red",
    value: "R$ 2.100,00",
    monthlyRentNum: 2100,
    tenant: "Em Manutenção",
    details: "Imóvel em manutenção hidráulica e elétrica preventiva.",
  },
  {
    id: "5",
    code: "IM-005",
    address: "Rua C, 50 - Conjunto 405",
    situation: "Livre",
    statusType: "yellow",
    value: "R$ 4.500,00",
    monthlyRentNum: 4500,
    tenant: "Disponível para locação",
    details: "Imóvel comercial térreo disponível para locação institucional.",
  },
];

const DEFAULT_REMINDERS: FMCReminder[] = [
  {
    id: "1",
    title: "Vencimento aluguel IM-001",
    category: "Financeiro",
    priority: "Alta",
    deadline: "2026-10-25",
    responsible: "Gabriel Sarges",
    description: "Confirmar recebimento do boleto de aluguel do inquilino João Pedro Cavalcanti (IM-001).",
    done: true,
    createdAt: "2026-10-01",
  },
  {
    id: "2",
    title: "Vistoria predial IM-003",
    category: "Imóvel / Reforma",
    priority: "Média",
    deadline: "2026-10-28",
    responsible: "Flávio",
    description: "Realizar vistoria de entrega e conferência de chaves do imóvel desocupado da Rua B, 75.",
    done: false,
    createdAt: "2026-10-15",
  },
  {
    id: "3",
    title: "Cobrança taxa condominial IM-005",
    category: "Financeiro",
    priority: "Média",
    deadline: "2026-10-30",
    responsible: "Daniel",
    description: "Verificar quitação de taxa condominial e rateio de despesas comuns junto à administração do prédio.",
    done: false,
    createdAt: "2026-10-18",
  },
  {
    id: "4",
    title: "Relatório Trimestral do Ministério Público",
    category: "Prestação MP",
    priority: "Alta",
    deadline: "2026-11-05",
    responsible: "Gabriel Sarges",
    description: "Reunir balancetes, extratos bancários e atas do conselho para anexar ao pacote de prestação de contas.",
    done: false,
    createdAt: "2026-10-20",
  },
];

// --- PROPRIEDADES ---
export function getStoredProperties(): FMCProperty[] {
  if (typeof window === "undefined") return DEFAULT_PROPERTIES;
  try {
    const saved = localStorage.getItem("fmc_properties_store_v2");
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_PROPERTIES;
}

export function saveProperties(list: FMCProperty[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("fmc_properties_store_v2", JSON.stringify(list));
    window.dispatchEvent(new Event("fmc_properties_updated"));
  } catch {}
}

export function updatePropertySituation(
  id: string,
  situation: PropertySituation,
  extra?: { address?: string; value?: string; tenant?: string; details?: string }
): FMCProperty[] {
  const current = getStoredProperties();
  const statusType: "green" | "yellow" | "red" =
    situation === "Ocupado" ? "green" : situation === "Livre" ? "yellow" : "red";

  const updated = current.map((p) => {
    if (p.id !== id && p.code !== id) return p;
    return {
      ...p,
      situation,
      statusType,
      address: extra?.address ?? p.address,
      value: extra?.value ?? p.value,
      tenant: extra?.tenant ?? p.tenant,
      details: extra?.details ?? p.details,
    };
  });

  saveProperties(updated);
  return updated;
}

export function getPropertyMetricsFromStore() {
  const props = getStoredProperties();
  // Multiplicador proporcional para escala dos 124 imóveis reais da fundação
  const occupiedCount = props.filter((p) => p.situation === "Ocupado").length;
  const availableCount = props.filter((p) => p.situation === "Livre").length;
  const maintenanceCount = props.filter((p) => p.situation === "Manutenção").length;

  return {
    totalProperties: 124,
    occupied: Math.round((occupiedCount / props.length) * 124),
    available: Math.round((availableCount / props.length) * 124),
    underMaintenance: Math.max(1, 124 - Math.round((occupiedCount / props.length) * 124) - Math.round((availableCount / props.length) * 124)),
    sampleOccupied: occupiedCount,
    sampleAvailable: availableCount,
    sampleMaintenance: maintenanceCount,
  };
}

// --- LEMBRETES ---
export function getStoredReminders(): FMCReminder[] {
  if (typeof window === "undefined") return DEFAULT_REMINDERS;
  try {
    const saved = localStorage.getItem("fmc_reminders_store_v2");
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_REMINDERS;
}

export function saveReminders(list: FMCReminder[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("fmc_reminders_store_v2", JSON.stringify(list));
    window.dispatchEvent(new Event("fmc_reminders_updated"));
  } catch {}
}

// --- MOVIMENTAÇÕES COMPARTILHADAS ---
export function getStoredMovements(month: number, year: number): FMCSharedMovement[] {
  if (typeof window === "undefined") return [];
  try {
    const key = `fmc_movements_store_${month}_${year}`;
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export function saveMovement(movement: FMCSharedMovement) {
  if (typeof window === "undefined") return;
  try {
    const [y, m] = movement.date.split("-").map(Number);
    const key = `fmc_movements_store_${m}_${y}`;
    const existing = getStoredMovements(m, y);
    const updated = [movement, ...existing];
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new Event("fmc_movements_updated"));
  } catch {}
}

// --- CLIENTES (INQUILINOS E FIADORES - BP11) ---
export type FMCClient = {
  id: string;
  name: string;
  cpf: string;
  age: number;
  phone: string;
  email: string;
  residentsCount: number; // quantas pessoas moram na casa
  profession: string;
  assetsDeclared: string; // se tem bens para pagar o aluguel
  propertyCode: string; // Imóvel alugado
  propertyAddress: string;
  monthlyRent: number; // quanto paga de aluguel
  contractStatus: "Ativo" | "Próximo ao Vencimento" | "Renovado" | "Em Análise";
  contractStartDate: string; // data em que foi adicionado / início
  contractEndDate: string; // data limite de vencimento
  guarantorName: string; // Fiador
  guarantorCpf: string;
  guarantorRelationship: string;
  guarantorPhone: string;
  guarantorAssets: string;
  documents: { id: string; name: string; category: string }[];
};

export const DEFAULT_CLIENTS: FMCClient[] = [
  {
    id: "cli-1",
    name: "João Pedro Cavalcanti",
    cpf: "123.456.789-01",
    age: 42,
    phone: "(92) 98112-3401",
    email: "joao.cavalcanti@email.com",
    residentsCount: 3,
    profession: "Engenheiro Civil",
    assetsDeclared: "Veículo próprio quitado (R$ 65.000) e renda comprovada 4x valor do aluguel",
    propertyCode: "IM-001",
    propertyAddress: "Rua A, 120 - Boa Vista",
    monthlyRent: 1200,
    contractStatus: "Próximo ao Vencimento",
    contractStartDate: "15/11/2025",
    contractEndDate: "15/11/2026",
    guarantorName: "Roberto Cavalcanti",
    guarantorCpf: "234.567.890-12",
    guarantorRelationship: "Irmão",
    guarantorPhone: "(92) 99234-5678",
    guarantorAssets: "Imóvel residencial próprio em Manaus matriculado sob nº 45.120",
    documents: [
      { id: "doc-1", name: "Contrato_Locacao_IM001.pdf", category: "Contratos" },
      { id: "doc-2", name: "Comprovante_Renda_JoaoPedro.pdf", category: "Documentos Pessoais" },
      { id: "doc-3", name: "Doc_Fiador_RobertoCavalcanti.pdf", category: "Documentos Pessoais" },
    ],
  },
  {
    id: "cli-2",
    name: "Maria Helena Silva",
    cpf: "345.678.901-23",
    age: 38,
    phone: "(92) 98223-4567",
    email: "maria.helena@silvaadv.com",
    residentsCount: 2,
    profession: "Advogada",
    assetsDeclared: "Imóvel comercial próprio e aplicação de liquidez diária",
    propertyCode: "IM-002",
    propertyAddress: "Rua A, 26 - Sala Comercial",
    monthlyRent: 1800,
    contractStatus: "Próximo ao Vencimento",
    contractStartDate: "20/11/2025",
    contractEndDate: "20/11/2026",
    guarantorName: "Patrícia Helena Silva",
    guarantorCpf: "456.789.012-34",
    guarantorRelationship: "Irmã",
    guarantorPhone: "(92) 99345-6789",
    guarantorAssets: "Imóvel próprio e vínculo público estatutário",
    documents: [
      { id: "doc-4", name: "Contrato_Locacao_IM002_Comercial.pdf", category: "Contratos" },
      { id: "doc-5", name: "Termo_Vistoria_IM002.pdf", category: "Vistorias" },
    ],
  },
  {
    id: "cli-3",
    name: "Marcos Antônio Ferreira",
    cpf: "567.890.123-45",
    age: 49,
    phone: "(92) 98456-7890",
    email: "marcos.antonio@ferreira.com.br",
    residentsCount: 4,
    profession: "Comerciante",
    assetsDeclared: "Capital social da empresa matriz e dois veículos comerciais",
    propertyCode: "IM-006",
    propertyAddress: "Av. Constantino Nery, 410",
    monthlyRent: 2400,
    contractStatus: "Ativo",
    contractStartDate: "10/12/2025",
    contractEndDate: "10/12/2026",
    guarantorName: "Paulo Ferreira",
    guarantorCpf: "678.901.234-56",
    guarantorRelationship: "Pai",
    guarantorPhone: "(92) 98765-4321",
    guarantorAssets: "Terreno urbano escriturado",
    documents: [
      { id: "doc-6", name: "Contrato_Locacao_IM006.pdf", category: "Contratos" },
      { id: "doc-7", name: "Recibo_Ultimo_Aluguel_IM006.pdf", category: "Recibos" },
    ],
  },
  {
    id: "cli-4",
    name: "Beatriz Albuquerque",
    cpf: "789.012.345-67",
    age: 29,
    phone: "(92) 98567-8901",
    email: "beatriz.albuquerque@gov.br",
    residentsCount: 1,
    profession: "Servidora Pública",
    assetsDeclared: "Renda estável de servidora pública estadual (concurso público)",
    propertyCode: "IM-007",
    propertyAddress: "Rua Saldanha Marinho, 88",
    monthlyRent: 2100,
    contractStatus: "Ativo",
    contractStartDate: "05/01/2026",
    contractEndDate: "05/01/2027",
    guarantorName: "Cecília Albuquerque",
    guarantorCpf: "890.123.456-78",
    guarantorRelationship: "Mãe",
    guarantorPhone: "(92) 99876-5432",
    guarantorAssets: "Casa própria quitada no bairro Adrianópolis",
    documents: [
      { id: "doc-8", name: "Contrato_Locacao_IM007.pdf", category: "Contratos" },
      { id: "doc-9", name: "Contracheque_Beatriz.pdf", category: "Documentos Pessoais" },
    ],
  },
];

export function getStoredClients(): FMCClient[] {
  if (typeof window === "undefined") return DEFAULT_CLIENTS;
  try {
    const saved = localStorage.getItem("fmc_clients_store_v1");
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_CLIENTS;
}

export function saveClients(list: FMCClient[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("fmc_clients_store_v1", JSON.stringify(list));
    window.dispatchEvent(new Event("fmc_clients_updated"));
  } catch {}
}

// --- ESTOQUE E GESTÃO DML (COM QUANTIDADE POR PACOTE - BP08) ---
export type FMCInventoryItem = {
  id: string;
  name: string;
  packageSpec: string; // Ex: detergente 540ml; tinta 1l; papel higiênico 10x (Pedido do cliente)
  unitPrice: number;
  quantity: number;
  purchaseDate: string;
  category: "Limpeza" | "Obra / Manutenção" | "Escritório";
};

export const DEFAULT_INVENTORY: FMCInventoryItem[] = [
  {
    id: "est-1",
    name: "Papel Higiênico",
    packageSpec: "Pacote c/ 10 rolos (10x)",
    unitPrice: 4.5,
    quantity: 50,
    purchaseDate: "15/10/2026",
    category: "Limpeza",
  },
  {
    id: "est-2",
    name: "Detergente",
    packageSpec: "Frasco 540ml",
    unitPrice: 2.29,
    quantity: 20,
    purchaseDate: "15/10/2026",
    category: "Limpeza",
  },
  {
    id: "est-3",
    name: "Esponja",
    packageSpec: "Unidade individual",
    unitPrice: 0.8,
    quantity: 15,
    purchaseDate: "15/10/2026",
    category: "Limpeza",
  },
  {
    id: "est-4",
    name: "Saco de Lixo",
    packageSpec: "Pacote 100L c/ 30 unidades",
    unitPrice: 10.0,
    quantity: 30,
    purchaseDate: "15/10/2026",
    category: "Limpeza",
  },
  {
    id: "est-5",
    name: "Tinta",
    packageSpec: "Galão / Lata 1L (1l)",
    unitPrice: 52.91,
    quantity: 5,
    purchaseDate: "15/10/2026",
    category: "Obra / Manutenção",
  },
];

export function getStoredInventory(): FMCInventoryItem[] {
  if (typeof window === "undefined") return DEFAULT_INVENTORY;
  try {
    const saved = localStorage.getItem("fmc_inventory_store_v1");
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_INVENTORY;
}

export function saveInventory(list: FMCInventoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("fmc_inventory_store_v1", JSON.stringify(list));
    window.dispatchEvent(new Event("fmc_inventory_updated"));
  } catch {}
}

// --- FUNCIONÁRIOS E PRESENÇA (COM HORÁRIO DE SAÍDA - BP07) ---
export type FMCEmployeeAttendance = {
  id: string;
  name: string;
  role: string;
  status: "Presente" | "Ausente" | "Folga";
  entryTime: string; // Horário de Entrada (ex: 08:02)
  exitTime: string; // Horário de Saída (ex: 17:00) (Pedido do cliente)
  date: string;
  cpf: string;
};

export type FMCAbsenceJustification = {
  id: string;
  employeeName: string;
  date: string;
  reason: string;
  approved: boolean;
};

export const DEFAULT_ATTENDANCE: FMCEmployeeAttendance[] = [
  {
    id: "func-1",
    name: "Ana Souza",
    role: "Administrativo",
    status: "Presente",
    entryTime: "08:02",
    exitTime: "17:00",
    date: "15/10/2026",
    cpf: "111.222.333-44",
  },
  {
    id: "func-2",
    name: "Carlos Lima",
    role: "Técnico",
    status: "Ausente",
    entryTime: "-",
    exitTime: "-",
    date: "15/10/2026",
    cpf: "222.333.444-55",
  },
  {
    id: "func-3",
    name: "Fernandes Alves",
    role: "Serviços Gerais",
    status: "Presente",
    entryTime: "08:15",
    exitTime: "17:10",
    date: "15/10/2026",
    cpf: "333.444.555-66",
  },
  {
    id: "func-4",
    name: "João Pereira",
    role: "Limpeza",
    status: "Presente",
    entryTime: "08:20",
    exitTime: "17:05",
    date: "15/10/2026",
    cpf: "444.555.666-77",
  },
  {
    id: "func-5",
    name: "Mariana Costa",
    role: "Porteiro",
    status: "Presente",
    entryTime: "08:10",
    exitTime: "18:00",
    date: "15/10/2026",
    cpf: "555.666.777-88",
  },
];

export const DEFAULT_JUSTIFICATIONS: FMCAbsenceJustification[] = [
  {
    id: "just-1",
    employeeName: "Carlos Lima",
    date: "15/10/2026",
    reason: "Consulta médica preventiva com atestado de dispensa anexado.",
    approved: true,
  },
];

export function getStoredAttendance(): FMCEmployeeAttendance[] {
  if (typeof window === "undefined") return DEFAULT_ATTENDANCE;
  try {
    const saved = localStorage.getItem("fmc_attendance_store_v1");
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_ATTENDANCE;
}

export function saveAttendance(list: FMCEmployeeAttendance[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("fmc_attendance_store_v1", JSON.stringify(list));
    window.dispatchEvent(new Event("fmc_attendance_updated"));
  } catch {}
}

export function getStoredJustifications(): FMCAbsenceJustification[] {
  if (typeof window === "undefined") return DEFAULT_JUSTIFICATIONS;
  try {
    const saved = localStorage.getItem("fmc_justifications_store_v1");
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_JUSTIFICATIONS;
}

export function saveJustifications(list: FMCAbsenceJustification[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("fmc_justifications_store_v1", JSON.stringify(list));
    window.dispatchEvent(new Event("fmc_justifications_updated"));
  } catch {}
}
