// Credenciais só na sessionStorage: somem ao fechar a aba e nunca vão para o servidor Next.js.
const STORAGE_KEY = "fmc-auth";
const AUTH_CHANGED_EVENT = "fmc-auth-changed";

function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function subscribeAuth(onChange: () => void) {
  window.addEventListener(AUTH_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function toBase64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function basicAuthToken(username: string, password: string) {
  return toBase64(`${username}:${password}`);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveAuthToken(token: string) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Navegação privada sem storage: o login vale só até a próxima página.
  }
  notifyAuthChanged();
}

export function clearAuthToken() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nada a limpar.
  }
  notifyAuthChanged();
}
