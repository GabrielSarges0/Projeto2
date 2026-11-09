"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  Building2,
  CircleDollarSign,
  Contact,
  FileText,
  Home,
  LogOut,
  Scale,
  Users,
} from "lucide-react";
import { logout } from "@/lib/logout";

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
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <aside className="sidebar" aria-label="Navegação principal">
      <nav className="sidebar-nav">
        {items.map(({ href, label, icon: Icon }) => {
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
