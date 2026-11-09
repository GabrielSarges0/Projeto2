"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authApi } from "@/lib/financial-api";
import { getSession, saveSession, useSession } from "@/lib/session";

const PUBLIC_PATHS = new Set(["/login", "/cadastro"]);

/** Destino após o login: só caminhos internos, para não virar redirecionamento aberto. */
function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/";
}

export function AuthGate({ children }: { children: ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.has(pathname);

  // Papel e nome vêm do cadastro: atualiza a sessão ao abrir o painel (o gerente pode ter mudado o papel).
  const token = session?.token;
  useEffect(() => {
    if (!token) return;
    authApi
      .me()
      .then((me) => {
        const current = getSession();
        if (current && current.token === token && (current.user.role !== me.role || current.user.name !== me.name)) {
          saveSession({ ...current, user: { username: me.username, name: me.name, role: me.role } });
        }
      })
      .catch(() => {
        // 401 já encerra a sessão no cliente da API; outros erros não impedem o uso.
      });
  }, [token]);

  useEffect(() => {
    if (session === undefined) return;
    if (!session && !isPublic) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (session && isPublic) {
      router.replace(nextPath());
    }
  }, [session, isPublic, pathname, router]);

  if (session === undefined || (!session && !isPublic) || (session && isPublic)) {
    return (
      <div className="auth-loading" role="status">
        Carregando...
      </div>
    );
  }
  return <>{children}</>;
}
