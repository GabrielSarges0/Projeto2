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
