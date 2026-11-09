"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Boxes,
  Building2,
  CircleDollarSign,
  Contact,
  FileText,
  Home,
  LogOut,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAlerts } from "@/lib/alerts";
import { logout } from "@/lib/logout";
import { useCan } from "@/lib/permissions";

// "Formulários" agora fica dentro de Documentos → Novo Documento (Relatório Sprint 3).
const items = [
  { href: "/", label: "Painel", icon: Home },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/imoveis", label: "Imóveis", icon: Building2 },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/financeiro", label: "Financeiro", icon: CircleDollarSign },
  { href: "/ministerio-publico", label: "Ministério Público", icon: Scale },
  { href: "/funcionarios", label: "Funcionários", icon: Contact },
  { href: "/estoque", label: "Estoque", icon: Boxes },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const canManageTeam = useCan("team");
  const { alerts } = useAlerts();
  const critical = alerts.filter((alert) => alert.severity === "critical").length;
  const visibleItems = [
    ...items,
    { href: "/alertas", label: "Alertas", icon: Bell },
    ...(canManageTeam ? [{ href: "/equipe", label: "Equipe", icon: ShieldCheck }] : []),
  ];

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <aside className="sidebar" aria-label="Navegação principal">
      <nav className="sidebar-nav">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link${active ? " sidebar-link-active" : ""}`}
              aria-current={active ? "page" : undefined}
              title={label}
            >
              <Icon size={18} className="sidebar-link-icon" aria-hidden="true" />
              <span>{label}</span>
              {href === "/alertas" && alerts.length > 0 ? (
                <b className={`sidebar-badge${critical > 0 ? " sidebar-badge-critical" : ""}`} aria-label={`${alerts.length} alerta(s), ${critical} crítico(s)`}>
                  {alerts.length > 99 ? "99+" : alerts.length}
                </b>
              ) : null}
            </Link>
          );
        })}
        <button type="button" className="sidebar-link sidebar-logout" onClick={handleLogout} title="Sair da conta">
          <LogOut size={18} className="sidebar-link-icon" aria-hidden="true" />
          <span>Sair</span>
        </button>
      </nav>
    </aside>
  );
}
