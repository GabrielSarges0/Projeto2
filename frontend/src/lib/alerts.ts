import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { z } from "zod";
import { FINANCE_CHANGED_EVENT, authApi, remindersApi, type ReminderItem } from "./financial-api";
import { daysUntil, formatDate } from "./format";
import { useCan } from "./permissions";
import { useRecords } from "./records";
import {
  clientSchema,
  inventoryItemSchema,
  justificationSchema,
  mpSubmissionSchema,
  type Client,
  type InventoryItem,
  type Justification,
  type MpSubmission,
} from "./schemas";

export const ALERT_KINDS = ["reminders", "contracts", "mp", "inventory", "justifications"] as const;
export type AlertKind = (typeof ALERT_KINDS)[number];

export const ALERT_KIND_LABEL: Record<AlertKind, string> = {
  reminders: "Lembretes com prazo",
  contracts: "Contratos de locação a vencer",
  mp: "Prazos do Ministério Público",
  inventory: "Estoque abaixo do mínimo",
  justifications: "Justificativas aguardando análise",
};

const alertPrefsSchema = z.object({
  enabled: z
    .object({
      reminders: z.boolean().catch(true),
      contracts: z.boolean().catch(true),
      mp: z.boolean().catch(true),
      inventory: z.boolean().catch(true),
      justifications: z.boolean().catch(true),
    })
    .catch({ reminders: true, contracts: true, mp: true, inventory: true, justifications: true }),
  reminderDays: z.number().int().min(0).max(30).catch(3),
  contractDays: z.number().int().min(7).max(120).catch(30),
  mpDays: z.number().int().min(1).max(60).catch(7),
  emailNotifications: z.boolean().catch(false),
});
export type AlertPrefs = z.infer<typeof alertPrefsSchema>;

export function parseAlertPrefs(preferences: Record<string, unknown> | null | undefined): AlertPrefs {
  return alertPrefsSchema.parse(preferences?.alerts ?? {});
}

export type AlertItem = {
  id: string;
  kind: AlertKind;
  severity: "critical" | "warning";
  title: string;
  detail: string;
  href: string;
  sortKey: string;
};

function dueText(days: number) {
  if (days < 0) return `atrasado há ${-days} dia(s)`;
  if (days === 0) return "vence hoje";
  return `vence em ${days} dia(s)`;
}

type Sources = {
  reminders: ReminderItem[];
  clients: Client[];
  submissions: MpSubmission[];
  inventory: InventoryItem[];
  justifications: Justification[];
  canReview: boolean;
};

/** Regras de alerta (Backlog 10): o que está atrasado é crítico; o que vence dentro da janela é aviso. */
export function buildAlerts(sources: Sources, prefs: AlertPrefs): AlertItem[] {
  const alerts: AlertItem[] = [];
  if (prefs.enabled.reminders) {
    sources.reminders
      .filter((reminder) => !reminder.done && daysUntil(reminder.dueDate) <= prefs.reminderDays)
      .forEach((reminder) => {
        const days = daysUntil(reminder.dueDate);
        alerts.push({
          id: `rem-${reminder.id}`,
          kind: "reminders",
          severity: days <= 0 ? "critical" : "warning",
          title: reminder.title,
          detail: `Lembrete ${dueText(days)} (${formatDate(reminder.dueDate)})${reminder.responsible ? ` · ${reminder.responsible}` : ""}`,
          href: "/alertas#lembretes-title",
          sortKey: reminder.dueDate,
        });
      });
  }
  if (prefs.enabled.contracts) {
    sources.clients
      .filter((client) => client.contractStatus !== "Encerrado" && daysUntil(client.contractEndDate) <= prefs.contractDays)
      .forEach((client) => {
        const days = daysUntil(client.contractEndDate);
        alerts.push({
          id: `cli-${client.id}`,
          kind: "contracts",
          severity: days < 0 ? "critical" : "warning",
          title: `Contrato de ${client.name} (${client.propertyCode})`,
          detail: days < 0 ? `Venceu em ${formatDate(client.contractEndDate)}: renove ou encerre` : `Contrato ${dueText(days)} (${formatDate(client.contractEndDate)})`,
          href: `/clientes?cliente=${client.id}`,
          sortKey: client.contractEndDate,
        });
      });
  }
  if (prefs.enabled.mp) {
    sources.submissions
      .filter((item) => (item.status === "Pendente" || item.status === "Em revisão") && daysUntil(item.dueDate) <= prefs.mpDays)
      .forEach((item) => {
        const days = daysUntil(item.dueDate);
        alerts.push({
          id: `mp-${item.id}`,
          kind: "mp",
          severity: days <= 0 ? "critical" : "warning",
          title: `${item.title} (${item.referencePeriod})`,
          detail: `Envio ao MP ${dueText(days)} · ${item.status} · ${item.responsible}`,
          href: "/ministerio-publico",
          sortKey: item.dueDate,
        });
      });
  }
  if (prefs.enabled.inventory) {
    sources.inventory
      .filter((item) => item.quantity <= item.minQuantity)
      .forEach((item) => {
        alerts.push({
          id: `est-${item.id}`,
          kind: "inventory",
          severity: item.quantity === 0 ? "critical" : "warning",
          title: `${item.name} (${item.packageSpec})`,
          detail: item.quantity === 0 ? "Sem estoque" : `Restam ${item.quantity} un. (mínimo ${item.minQuantity})`,
          href: "/estoque",
          sortKey: "9999-12-31",
        });
      });
  }
  if (prefs.enabled.justifications && sources.canReview) {
    sources.justifications
      .filter((item) => item.status === "Pendente")
      .forEach((item) => {
        alerts.push({
          id: `just-${item.id}`,
          kind: "justifications",
          severity: daysUntil(item.date) < -3 ? "critical" : "warning",
          title: `Justificativa de ${item.employeeName}`,
          detail: `${item.type} em ${formatDate(item.date)} aguardando análise`,
          href: "/funcionarios",
          sortKey: item.date,
        });
      });
  }
  return alerts.sort((a, b) => (a.severity === b.severity ? a.sortKey.localeCompare(b.sortKey) : a.severity === "critical" ? -1 : 1));
}

// ---------------------------------------------------------------- dados compartilhados entre telas
type SharedState = {
  reminders: ReminderItem[];
  remindersLoadedAt: number;
  prefs: AlertPrefs | null;
  rawPreferences: Record<string, unknown> | null;
  prefsLoaded: boolean;
};
const DEFAULT_PREFS = parseAlertPrefs(null);
const listeners = new Set<() => void>();
let shared: SharedState = { reminders: [], remindersLoadedAt: 0, prefs: null, rawPreferences: null, prefsLoaded: false };
let inflight: Promise<void> | null = null;
const REMINDERS_STALE_MS = 60_000;

function setShared(patch: Partial<SharedState>) {
  shared = { ...shared, ...patch };
  listeners.forEach((listener) => listener());
}

function refresh(force = false): Promise<void> {
  if (inflight) return inflight;
  const needsReminders = force || Date.now() - shared.remindersLoadedAt > REMINDERS_STALE_MS;
  const needsPrefs = !shared.prefsLoaded;
  if (!needsReminders && !needsPrefs) return Promise.resolve();
  inflight = Promise.allSettled([
    needsReminders ? remindersApi.list() : Promise.resolve(shared.reminders),
    needsPrefs ? authApi.me() : Promise.resolve(null),
  ])
    .then(([reminders, me]) => {
      const patch: Partial<SharedState> = {};
      if (reminders.status === "fulfilled") {
        patch.reminders = reminders.value;
        patch.remindersLoadedAt = Date.now();
      }
      if (me.status === "fulfilled" && me.value) {
        patch.prefs = parseAlertPrefs(me.value.preferences);
        patch.rawPreferences = me.value.preferences;
        patch.prefsLoaded = true;
      }
      setShared(patch);
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function resetAlertsCache() {
  shared = { reminders: [], remindersLoadedAt: 0, prefs: null, rawPreferences: null, prefsLoaded: false };
  listeners.forEach((listener) => listener());
}

/** Salva só a parte de alertas, preservando outras preferências da conta. */
export async function saveAlertPrefs(prefs: AlertPrefs) {
  const me = await authApi.updatePreferences({ ...(shared.rawPreferences ?? {}), alerts: prefs });
  setShared({ prefs: parseAlertPrefs(me.preferences), rawPreferences: me.preferences, prefsLoaded: true });
}

export function useAlerts() {
  const subscribe = useCallback((listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  const state = useSyncExternalStore(subscribe, () => shared, () => shared);
  const canReview = useCan("review");
  const clients = useRecords("clients", clientSchema);
  const submissions = useRecords("mp-submissions", mpSubmissionSchema);
  const inventory = useRecords("inventory", inventoryItemSchema);
  const justifications = useRecords("justifications", justificationSchema);

  useEffect(() => {
    void refresh();
    const onFinance = () => void refresh(true);
    const onFocus = () => void refresh();
    window.addEventListener(FINANCE_CHANGED_EVENT, onFinance);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener(FINANCE_CHANGED_EVENT, onFinance);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const prefs = state.prefs ?? DEFAULT_PREFS;
  const alerts = useMemo(
    () =>
      buildAlerts(
        {
          reminders: state.reminders,
          clients: clients.items,
          submissions: submissions.items,
          inventory: inventory.items,
          justifications: justifications.items,
          canReview,
        },
        prefs
      ),
    [state.reminders, clients.items, submissions.items, inventory.items, justifications.items, canReview, prefs]
  );

  return {
    alerts,
    prefs,
    loading: !state.prefsLoaded || clients.loading || submissions.loading,
    refresh: () => refresh(true),
  };
}
