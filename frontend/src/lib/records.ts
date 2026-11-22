import { useCallback, useEffect, useSyncExternalStore } from "react";
import { z } from "zod";
import { apiRequest, apiRequestVoid, errorMessage } from "./api-client";

/** Coleções aceitas pelo backend (RecordCollection.java). */
export type CollectionName =
  | "clients"
  | "inventory"
  | "inventory-movements"
  | "attendance"
  | "employees"
  | "justifications"
  | "documents"
  | "document-files"
  | "folders"
  | "mp-submissions"
  | "template-settings";

const recordEnvelopeSchema = z.object({
  id: z.string(),
  data: z.unknown(),
  updatedAt: z.string(),
  updatedBy: z.string(),
});

type Identified = { id: string };

type CollectionState<T> = {
  items: T[];
  status: "idle" | "loading" | "ready" | "error";
  error: string;
  loadedAt: number;
};

type Store<T> = {
  state: CollectionState<T>;
  listeners: Set<() => void>;
  schema: z.ZodType<T>;
  inflight: Promise<void> | null;
};

const stores = new Map<CollectionName, Store<Identified>>();
// Dados de outros usuários: recarrega ao voltar para a aba se a última leitura tiver mais de 30 s.
const STALE_AFTER_MS = 30_000;

function getStore<T extends Identified>(collection: CollectionName, schema: z.ZodType<T>): Store<T> {
  let store = stores.get(collection);
  if (!store) {
    store = {
      state: { items: [], status: "idle", error: "", loadedAt: 0 },
      listeners: new Set(),
      schema: schema as z.ZodType<Identified>,
      inflight: null,
    };
    stores.set(collection, store);
  }
  return store as unknown as Store<T>;
}

function setState<T extends Identified>(store: Store<T>, patch: Partial<CollectionState<T>>) {
  store.state = { ...store.state, ...patch };
  store.listeners.forEach((listener) => listener());
}

export function recordPath(collection: CollectionName, id?: string) {
  return `/api/v1/records/${collection}${id ? `/${encodeURIComponent(id)}` : ""}`;
}

export async function fetchRecords<T extends Identified>(collection: CollectionName, schema: z.ZodType<T>): Promise<T[]> {
  const envelopes = await apiRequest(recordPath(collection), z.array(recordEnvelopeSchema));
  const items: T[] = [];
  for (const envelope of envelopes) {
    const parsed = schema.safeParse(envelope.data);
    if (parsed.success) {
      items.push(parsed.data);
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(`Registro ignorado em ${collection}/${envelope.id}`, parsed.error.issues);
    }
  }
  return items;
}

export async function fetchRecord<T extends Identified>(collection: CollectionName, id: string, schema: z.ZodType<T>): Promise<T> {
  const envelope = await apiRequest(recordPath(collection, id), recordEnvelopeSchema);
  return schema.parse(envelope.data);
}

export async function putRecord<T extends Identified>(collection: CollectionName, item: T): Promise<void> {
  await apiRequest(recordPath(collection, item.id), recordEnvelopeSchema, { method: "PUT", body: item });
}

export async function deleteRecord(collection: CollectionName, id: string): Promise<void> {
  await apiRequestVoid(recordPath(collection, id), { method: "DELETE" });
}

function load<T extends Identified>(collection: CollectionName, store: Store<T>): Promise<void> {
  if (store.inflight) return store.inflight;
  setState(store, { status: store.state.status === "ready" ? "ready" : "loading", error: "" });
  store.inflight = fetchRecords(collection, store.schema)
    .then((items) => setState(store, { items, status: "ready", error: "", loadedAt: Date.now() }))
    .catch((error: unknown) => setState(store, { status: "error", error: errorMessage(error, "Não foi possível carregar os dados.") }))
    .finally(() => {
      store.inflight = null;
    });
  return store.inflight;
}

type UseRecordsOptions = {
  /**
   * Desligado, não chama a API nem devolve o que estiver em cache. Use quando o papel não pode ler a coleção
   * (dados pessoais): o backend responderia 403 e a tela mostraria erro.
   */
  enabled?: boolean;
};

const NO_ITEMS: never[] = [];

/**
 * Coleção compartilhada no servidor com cache em memória: todas as telas que usam a mesma coleção
 * veem a mesma lista e as mudanças aparecem na hora (atualização otimista, desfeita se o servidor recusar).
 */
export function useRecords<T extends Identified>(collection: CollectionName, schema: z.ZodType<T>, { enabled = true }: UseRecordsOptions = {}) {
  const store = getStore(collection, schema);

  const subscribe = useCallback(
    (listener: () => void) => {
      store.listeners.add(listener);
      return () => {
        store.listeners.delete(listener);
      };
    },
    [store]
  );
  const getSnapshot = useCallback(() => store.state, [store]);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!enabled) return;
    if (store.state.status === "idle") void load(collection, store);
    const onFocus = () => {
      if (Date.now() - store.state.loadedAt > STALE_AFTER_MS) void load(collection, store);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [collection, store, enabled]);

  const save = useCallback(
    async (item: T) => {
      const previous = store.state.items;
      const exists = previous.some((current) => current.id === item.id);
      setState(store, {
        items: exists ? previous.map((current) => (current.id === item.id ? item : current)) : [...previous, item],
      });
      try {
        await putRecord(collection, item);
      } catch (error) {
        setState(store, { items: previous });
        throw error;
      }
    },
    [collection, store]
  );

  const saveMany = useCallback(
    async (items: T[]) => {
      for (const item of items) await save(item);
    },
    [save]
  );

  const remove = useCallback(
    async (id: string) => {
      const previous = store.state.items;
      setState(store, { items: previous.filter((item) => item.id !== id) });
      try {
        await deleteRecord(collection, id);
      } catch (error) {
        setState(store, { items: previous });
        throw error;
      }
    },
    [collection, store]
  );

  const reload = useCallback(() => load(collection, store), [collection, store]);

  return {
    items: enabled ? state.items : NO_ITEMS,
    loading: enabled && (state.status === "idle" || state.status === "loading"),
    error: enabled && state.status === "error" ? state.error : "",
    save,
    saveMany,
    remove,
    reload,
  };
}

/** Ao sair da conta, nenhum dado do usuário anterior fica em memória. */
export function resetRecordCaches() {
  stores.forEach((store) => {
    store.state = { items: [], status: "idle", error: "", loadedAt: 0 };
    store.listeners.forEach((listener) => listener());
  });
}

/** Atualiza o cache de uma coleção após gravação feita fora do hook (ex.: anexos criados por outra tela). */
export function applyLocalUpsert<T extends Identified>(collection: CollectionName, item: T) {
  const store = stores.get(collection);
  if (!store || store.state.status === "idle") return;
  const exists = store.state.items.some((current) => current.id === item.id);
  setState(store, {
    items: exists ? store.state.items.map((current) => (current.id === item.id ? item : current)) : [...store.state.items, item],
  });
}
