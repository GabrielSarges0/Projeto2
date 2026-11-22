"use client";

import Image from "next/image";
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
  type LucideIcon,
} from "lucide-react";
import { useAlerts } from "@/lib/alerts";
import { logout } from "@/lib/logout";
import { can, useRole, type Permission } from "@/lib/permissions";

type NavItem = { href: string; label: string; icon: LucideIcon; permission?: Permission };

// "Formulários" agora fica dentro de Documentos → Novo Documento (Relatório Sprint 3).
const items: NavItem[] = [
  { href: "/", label: "Painel", icon: Home },
  { href: "/clientes", label: "Clientes", icon: Users, permission: "personal" },
  { href: "/imoveis", label: "Imóveis", icon: Building2 },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/financeiro", label: "Financeiro", icon: CircleDollarSign },
  { href: "/ministerio-publico", label: "Ministério Público", icon: Scale },
  { href: "/funcionarios", label: "Funcionários", icon: Contact },
  { href: "/estoque", label: "Estoque", icon: Boxes },
  { href: "/alertas", label: "Alertas", icon: Bell },
  { href: "/equipe", label: "Equipe", icon: ShieldCheck, permission: "team" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const role = useRole();
  const { alerts } = useAlerts();
  const critical = alerts.filter((alert) => alert.severity === "critical").length;
  const visibleItems = items.filter((item) => !item.permission || can(role, item.permission));

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <aside className="sidebar" aria-label="Navegação principal">
      <div className="sidebar-brand">
        <Link href="/" className="sidebar-brand-link" title="Fundação Manuel Cruz — Início">
          <Image
            src="/fmc-logo-sidebar.png"
            alt="Fundação Manuel Cruz"
            width={187}
            height={57}
            priority
            className="sidebar-brand-full"
          />
          <Image
            src="/fmc-icon.png"
            alt="Fundação Manuel Cruz"
            width={44}
            height={44}
            priority
            className="sidebar-brand-compact"
          />
        </Link>
      </div>
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
