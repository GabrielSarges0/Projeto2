"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { clearAuthToken } from "@/lib/auth";

export function Topbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  function handleLogout() {
    clearAuthToken();
    router.replace("/login");
  }

  return (
    <header className="topbar" style={{ position: "relative" }}>
      <div className="topbar-welcome">
        <h1>Olá Gabriel Sarges</h1>
        <p>Bem-vindo(a) ao painel de gestão • Fundação Manuel Cruz</p>
      </div>

      <div style={{ position: "relative" }}>
        <button
          className="account-button"
          type="button"
          aria-label="Abrir menu do perfil de usuário"
          onClick={() => setDropdownOpen((v) => !v)}
        >
          <span className="account-avatar" aria-hidden="true" style={{ background: "#092a54", color: "#ffffff" }}>
            <UserRound size={22} strokeWidth={2} />
          </span>
          <span className="account-name">Gabriel Sarges</span>
          <ChevronDown className="account-chevron" size={18} strokeWidth={2} aria-hidden="true" />
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              width: "220px",
              zIndex: 1000,
              padding: "6px",
            }}
          >
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", marginBottom: "4px" }}>
              <strong style={{ display: "block", fontSize: "13px", color: "#0f172a" }}>Gabriel Pedro Sarges</strong>
              <span style={{ fontSize: "11px", color: "#64748b" }}>gpss@cesar.school</span>
            </div>

            <Link
              href="/perfil"
              onClick={() => setDropdownOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#1e293b",
                textDecoration: "none",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <UserRound size={16} color="#092a54" />
              <span>Ver Meu Perfil</span>
            </Link>

            <Link
              href="/configuracoes"
              onClick={() => setDropdownOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#1e293b",
                textDecoration: "none",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <Settings size={16} color="#64748b" />
              <span>Configurações</span>
            </Link>

            <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "4px", paddingTop: "4px" }}>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: "#dc2626",
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fee2e2")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <LogOut size={16} />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
