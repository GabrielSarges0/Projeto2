"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthToken, subscribeAuth } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/login"]);
const UNKNOWN = "unknown";

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.has(pathname);
  // No servidor não há sessionStorage: "unknown" segura a tela até o navegador responder.
  const token = useSyncExternalStore(subscribeAuth, getAuthToken, () => UNKNOWN);
  const signedOut = token === null;

  useEffect(() => {
    if (!isPublic && signedOut) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isPublic, signedOut, pathname, router]);

  if (isPublic || (token !== null && token !== UNKNOWN)) return <>{children}</>;
  return (
    <div className="auth-loading" role="status" aria-live="polite">
      Verificando acesso…
    </div>
  );
}
