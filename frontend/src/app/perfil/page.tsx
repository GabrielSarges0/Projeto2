"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { authApi, errorMessage } from "@/lib/financial-api";
import { formatDateTime } from "@/lib/format";
import { logout } from "@/lib/logout";
import { saveSession, useSession } from "@/lib/session";

export default function PerfilPage() {
  const session = useSession();
  const router = useRouter();
  const { show, node: toast } = useToast();
  const [name, setName] = useState(session?.user.name ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (trimmed.length < 3 || trimmed.length > 120) {
      setError("O nome deve ter entre 3 e 120 caracteres.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await authApi.updateName(trimmed);
      saveSession({ token: response.token, expiresAt: response.expiresAt, user: response.user });
      show("Nome de exibição atualizado.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <AppShell>
      <section className="ui-page" aria-labelledby="perfil-title" style={{ maxWidth: 640 }}>
        <div className="ui-page-header">
          <div>
            <h1 id="perfil-title">Perfil</h1>
            <p>Seus dados de acesso ao painel.</p>
          </div>
        </div>

        <form className="ui-card" onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="ui-stat-icon" style={{ background: "#092a54", color: "#fff", borderRadius: "50%" }} aria-hidden="true">
              <UserRound size={22} />
            </span>
            <div>
              <strong style={{ display: "block", fontSize: 16 }}>{session?.user.name}</strong>
              <span className="ui-field-hint">{session?.user.username}</span>
            </div>
          </div>
          <Field label="Nome de exibição" error={error} required hint="Aparece no cabeçalho e como responsável nos registros que você criar.">
            {(props) => <input {...props} className="ui-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="name" />}
          </Field>
          <Field label="E-mail de acesso" hint="O e-mail identifica sua conta e não pode ser trocado aqui.">
            {(props) => <input {...props} className="ui-input" value={session?.user.username ?? ""} disabled />}
          </Field>
          <p className="ui-field-hint" style={{ margin: 0 }}>
            Sessão válida até {formatDateTime(session?.expiresAt)}. Neste ambiente o acesso aceita qualquer conta, por isso não há troca de senha.
          </p>
          <div className="ui-row-actions" style={{ justifyContent: "space-between" }}>
            <button type="button" className="ui-btn ui-btn-secondary" onClick={handleLogout}>
              <LogOut size={16} aria-hidden="true" /> Sair da conta
            </button>
            <button type="submit" className="ui-btn ui-btn-primary" disabled={saving} aria-busy={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </section>
      {toast}
    </AppShell>
  );
}
