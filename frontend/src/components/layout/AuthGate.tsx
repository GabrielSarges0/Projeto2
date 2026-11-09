"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/session";

const PUBLIC_PATHS = new Set(["/login", "/cadastro"]);

export function AuthGate({ children }: { children: ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (session === undefined) return;
    if (!session && !isPublic) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (session && isPublic) {
      router.replace("/");
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
