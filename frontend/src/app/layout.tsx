import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthGate } from "@/components/layout/AuthGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fundação Manuel Cruz | Painel de Gestão",
  description: "Sistema de gestão da Fundação Manuel Cruz",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
