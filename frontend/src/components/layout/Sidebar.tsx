"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Painel" },
  { href: "/documentos", label: "Documentos" },
  { href: "/financeiro", label: "Financeiro" },
  { href: "/ministerio-publico", label: "Ministério Público" },
  { href: "/funcionarios", label: "Funcionários" },
  { href: "/estoque", label: "Estoque" },
  { href: "/governanca", label: "Acesso e Governança" },
  { href: "/configuracoes", label: "Configurações" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar" aria-label="Navegação principal">
      <div className="sidebar-brand" aria-label="Fundação Manuel Cruz">
        <div className="sidebar-brand-mark">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ marginBottom: "12px" }}
          >
            <circle cx="32" cy="32" r="30" stroke="#D4B35A" strokeWidth="2" />
            <path
              d="M32 14V50M32 24L20 36M32 24L44 36M32 34L22 44M32 34L42 44"
              stroke="#D4B35A"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#D4B35A",
              lineHeight: "16px",
            }}
          >
            FUNDAÇÃO
          </span>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              color: "#FFFFFF",
              lineHeight: "14px",
            }}
          >
            MANUEL CRUZ
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map(({ href, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link${active ? " sidebar-link-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

