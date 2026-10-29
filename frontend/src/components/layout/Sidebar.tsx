"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  CircleDollarSign,
  Contact,
  FileText,
  Home,
  Image as ImageIcon,
  LogOut,
  Scale,
  Settings,
} from "lucide-react";
import { clearAuthToken } from "@/lib/auth";

const items = [
  { href: "/", label: "Painel", icon: Home },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/financeiro", label: "Financeiro", icon: CircleDollarSign },
  { href: "/ministerio-publico", label: "Ministério Público", icon: Scale },
  { href: "/funcionarios", label: "Funcionários", icon: Contact },
  { href: "/estoque", label: "Estoque", icon: Boxes },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearAuthToken();
    router.replace("/login");
  }

  return (
    <aside className="sidebar" aria-label="Navegação principal">
      <div className="sidebar-brand" aria-label="Manuel Cruz">
        <div className="sidebar-brand-box">
          <div className="sidebar-brand-avatar">
            <ImageIcon size={20} strokeWidth={1.8} />
          </div>
          <span className="sidebar-brand-name">Manuel Cruz</span>
        </div>
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
              <Icon size={18} className="sidebar-link-icon" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
        <button type="button" className="sidebar-link sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} className="sidebar-link-icon" aria-hidden="true" />
          <span>Sair</span>
        </button>
      </nav>
    </aside>
  );
}
