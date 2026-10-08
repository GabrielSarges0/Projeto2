import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export function ModulePlaceholder({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <AppShell>
      <section className="module-page">
        <h2>{title}</h2>
        <div className="module-card">
          {children ?? <p>Este módulo será implementado em um próximo update funcional.</p>}
        </div>
      </section>
    </AppShell>
  );
}
