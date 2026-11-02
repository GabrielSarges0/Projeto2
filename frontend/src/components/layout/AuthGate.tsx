"use client";

import { type ReactNode } from "react";

export function AuthGate({ children }: { children: ReactNode }) {
  // Tela de login desativada conforme solicitado pelo usuário: acesso direto sem bloqueio
  return <>{children}</>;
}
