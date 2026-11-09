"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { logout } from "@/lib/logout";
import { useSession } from "@/lib/session";

export function Topbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const session = useSession();
  const name = session?.user.name ?? "";
  const firstName = name.split(" ")[0] || "usuário";

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function handleLogout() {
    setOpen(false);
    logout();
    router.replace("/login");
  }

  return (
    <header className="topbar">
      <div className="topbar-welcome">
        <h1>Olá, {firstName}</h1>
        <p>Bem-vindo(a) ao painel de gestão • Fundação Manuel Cruz</p>
      </div>

      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          className="account-button"
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="account-avatar" aria-hidden="true" style={{ background: "#092a54", color: "#ffffff" }}>
            <UserRound size={22} strokeWidth={2} />
          </span>
          <span className="account-name">{name}</span>
          <ChevronDown className="account-chevron" size={18} strokeWidth={2} aria-hidden="true" />
        </button>

        {open ? (
          <div className="ui-menu" role="menu" style={{ width: 240 }}>
            <div style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", marginBottom: 4 }}>
              <strong style={{ display: "block", fontSize: 13, color: "#0f172a" }}>{name}</strong>
              <span style={{ fontSize: 12, color: "#475569", wordBreak: "break-all" }}>{session?.user.username}</span>
            </div>
            <Link href="/perfil" role="menuitem" className="topbar-menu-link" onClick={() => setOpen(false)}>
              <UserRound size={16} aria-hidden="true" /> Ver meu perfil
            </Link>
            <button type="button" role="menuitem" className="ui-menu-danger" onClick={handleLogout}>
              <LogOut size={16} aria-hidden="true" /> Sair da conta
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
