import { useSyncExternalStore } from "react";
import { z } from "zod";

// sessionStorage: o token some ao fechar a aba e nunca fica em localStorage.
const STORAGE_KEY = "fmc-session";
const SESSION_EVENT = "fmc-session-changed";

const sessionSchema = z.object({
  token: z.string().min(10),
  expiresAt: z.string(),
  user: z.object({ username: z.string(), name: z.string() }),
});

export type Session = z.infer<typeof sessionSchema>;
export type SessionUser = Session["user"];

let cachedRaw: string | null = null;
let cachedSession: Session | null = null;

function readRaw(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSession = null;
    if (raw) {
      try {
        const parsed = sessionSchema.safeParse(JSON.parse(raw));
        cachedSession = parsed.success ? parsed.data : null;
      } catch {
        cachedSession = null;
      }
    }
  }
  if (cachedSession && Date.parse(cachedSession.expiresAt) <= Date.now()) {
    return null;
  }
  return cachedSession;
}

export function getAuthToken(): string | null {
  return getSession()?.token ?? null;
}

function notify() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function saveSession(session: Session) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Navegação privada sem storage: a sessão vale só enquanto a página estiver aberta.
    cachedRaw = JSON.stringify(session);
    cachedSession = session;
  }
  notify();
}

export function clearSession() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nada a limpar.
  }
  cachedRaw = null;
  cachedSession = null;
  notify();
}

function subscribe(onChange: () => void) {
  window.addEventListener(SESSION_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SESSION_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** `undefined` enquanto o navegador ainda não foi lido (renderização no servidor / hidratação). */
export function useSession(): Session | null | undefined {
  return useSyncExternalStore(subscribe, getSession, () => undefined);
}
