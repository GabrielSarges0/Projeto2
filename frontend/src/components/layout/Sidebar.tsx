"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Gauge,
  Landmark,
  Package,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";

const items = [
  { href: "/", label: "Painel", icon: Gauge },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/financeiro", label: "Financeiro", icon: WalletCards },
  { href: "/ministerio-publico", label: "Ministério Público", icon: Landmark },
  { href: "/funcionarios", label: "Funcionários", icon: Users },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/governanca", label: "Acesso e Governança", icon: ShieldCheck },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar" aria-label="Navegação principal">
      <div className="sidebar-brand" aria-label="Fundação Manuel Cruz">
        <div className="sidebar-brand-mark">FMC</div>
      </div>

      <nav className="sidebar-nav">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link${active ? " sidebar-link-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="sidebar-icon" aria-hidden="true" strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
