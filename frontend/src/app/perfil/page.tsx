"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Award, Check, FileCheck, LogOut, PenLine, PenTool, ShieldCheck, Upload, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { USER_ROLE_LABEL, authApi, errorMessage } from "@/lib/financial-api";
import { formatDateTime } from "@/lib/format";
import { logout } from "@/lib/logout";
import { readFileAsDataUrl } from "@/lib/files";
import type { SignatureType, UserSignaturePrefs } from "@/lib/schemas";
import { saveSession, useSession } from "@/lib/session";
import {
  CURSIVE_STYLES,
  FMC_INSTITUTIONAL,
  parseSignaturePrefs,
} from "@/lib/signatures";
import { SignatureCanvas } from "@/components/documents/SignatureCanvas";

export default function PerfilPage() {
  const session = useSession();
  const router = useRouter();
  const { show, node: toast } = useToast();

  const [name, setName] = useState(session?.user.name ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Assinatura digital padrão
  const savedSig = parseSignaturePrefs(session?.user?.preferences as Record<string, unknown> | undefined);
  const [sigType, setSigType] = useState<SignatureType>(savedSig.defaultType || "hash");
  const [sigRole, setSigRole] = useState(savedSig.defaultRole || "Representante Legal");
  const [sigImage, setSigImage] = useState<string | null>(savedSig.signatureImage || null);
  const [cursiveStyle, setCursiveStyle] = useState(savedSig.cursiveStyle || "classic");
  const [sigSaving, setSigSaving] = useState(false);
  const [sigError, setSigError] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session?.user.name) setName(session.user.name);
    if (session?.user.preferences) {
      const p = parseSignaturePrefs(session.user.preferences as Record<string, unknown>);
      setSigType(p.defaultType || "hash");
      setSigRole(p.defaultRole || "Representante Legal");
      setSigImage(p.signatureImage || null);
      setCursiveStyle(p.cursiveStyle || "classic");
    }
  }, [session?.user.name, session?.user.preferences]);

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
      saveSession({
        token: response.token,
        expiresAt: response.expiresAt,
        user: {
          username: response.user.username,
          name: response.user.name,
          role: response.user.role,
          preferences: response.user.preferences as Record<string, unknown> | null,
        },
      });
      show("Nome de exibição atualizado.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(file: File | undefined) {
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      setSigError("A imagem da assinatura deve ter no máximo 1,5 MB.");
      return;
    }
    setSigError("");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setSigImage(dataUrl);
    } catch {
      setSigError("Não foi possível carregar a imagem.");
    }
  }

  async function handleSaveSignature(e: FormEvent) {
    e.preventDefault();
    if (!sigRole.trim()) {
      setSigError("Informe seu cargo ou função de representação.");
      return;
    }
    if (sigType === "draw" && !sigImage) {
      setSigError("Desenhe sua assinatura no quadro antes de salvar.");
      return;
    }
    if (sigType === "upload" && !sigImage) {
      setSigError("Selecione um arquivo de imagem da assinatura.");
      return;
    }

    setSigSaving(true);
    setSigError("");
    try {
      const currentPrefs = (session?.user?.preferences as Record<string, unknown> | null) ?? {};
      const newSigPrefs: UserSignaturePrefs = {
        defaultType: sigType,
        defaultRole: sigRole.trim(),
        signatureImage: sigType === "draw" || sigType === "upload" ? sigImage : null,
        cursiveName: name.trim(),
        cursiveStyle: sigType === "cursive" ? cursiveStyle : "classic",
      };

      const updatedUser = await authApi.updatePreferences({
        ...currentPrefs,
        signature: newSigPrefs,
      });

      if (session) {
        saveSession({
          ...session,
          user: {
            ...session.user,
            preferences: updatedUser.preferences as Record<string, unknown> | null,
          },
        });
      }

      show("Assinatura padrão salva com sucesso.");
    } catch (err) {
      setSigError(errorMessage(err, "Não foi possível salvar as preferências de assinatura."));
    } finally {
      setSigSaving(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const tabOptions: Array<{ type: SignatureType; label: string; icon: typeof Award }> = [
    { type: "hash", label: "Carimbo Digital", icon: ShieldCheck },
    { type: "draw", label: "Desenhar na tela", icon: PenLine },
    { type: "cursive", label: "Digitar Caligráfica", icon: PenTool },
    { type: "upload", label: "Enviar Imagem", icon: Upload },
    { type: "institutional", label: "Chancela FMC", icon: FileCheck },
  ];

  return (
    <AppShell>
      <section className="ui-page" aria-labelledby="perfil-title" style={{ maxWidth: 680, display: "grid", gap: 20 }}>
        <div className="ui-page-header">
          <div>
            <h1 id="perfil-title">Perfil</h1>
            <p>Seus dados de acesso e configurações de assinatura digital.</p>
          </div>
        </div>

        {/* Card 1: Dados do Usuário */}
        <form className="ui-card" onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="ui-stat-icon" style={{ background: "#092a54", color: "#fff", borderRadius: "50%" }} aria-hidden="true">
              <UserRound size={22} />
            </span>
            <div>
              <strong style={{ display: "block", fontSize: 16 }}>{session?.user.name}</strong>
              <span className="ui-field-hint">{session?.user.username}</span>
              {session ? (
                <span className="ui-badge ui-badge-info" style={{ marginTop: 4 }}>
                  {USER_ROLE_LABEL[session.user.role]}
                </span>
              ) : null}
            </div>
          </div>
          <Field label="Nome de exibição" error={error} required hint="Aparece no cabeçalho e como signatário nos documentos gerados.">
            {(props) => <input {...props} className="ui-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="name" />}
          </Field>
          <Field label="E-mail de acesso" hint="O e-mail identifica sua conta e não pode ser trocado aqui.">
            {(props) => <input {...props} className="ui-input" value={session?.user.username ?? ""} disabled />}
          </Field>
          <p className="ui-field-hint" style={{ margin: 0 }}>
            Sessão válida até {formatDateTime(session?.expiresAt)}.
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

        {/* Card 2: Assinatura Digital Padrão */}
        <form className="ui-card" onSubmit={handleSaveSignature} noValidate style={{ display: "grid", gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 16, margin: 0, color: "var(--ui-primary)" }}>Minha Assinatura Digital Padrão</h2>
            <p className="ui-field-hint" style={{ margin: "2px 0 0" }}>
              Configure o formato padrão com que você assinará documentos, contratos e recibos no sistema.
            </p>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Modalidade Padrão
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
              {tabOptions.map((tab) => {
                const Icon = tab.icon;
                const active = sigType === tab.type;
                return (
                  <button
                    key={tab.type}
                    type="button"
                    onClick={() => {
                      setSigType(tab.type);
                      setSigError("");
                    }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 6px",
                      borderRadius: 8,
                      border: active ? "2px solid var(--ui-primary)" : "1px solid #cbd5e1",
                      background: active ? "var(--ui-surface-muted, #f0f7ff)" : "#ffffff",
                      color: active ? "var(--ui-primary)" : "#475569",
                      fontWeight: active ? 600 : 500,
                      fontSize: 12,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Cargo / Função de Representação" required hint="Ex.: Representante Legal, Diretor Executivo, Gestor Patrimonial">
            {(props) => (
              <input
                {...props}
                className="ui-input"
                value={sigRole}
                onChange={(e) => setSigRole(e.target.value)}
                maxLength={80}
              />
            )}
          </Field>

          {/* Área de customização conforme a modalidade */}
          <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
            {sigType === "hash" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#065f46" }}>
                <ShieldCheck size={22} />
                <span style={{ fontSize: 13 }}>
                  Carimbo formal com hash criptográfico SHA-256 e selo digital verde em cada documento emitido.
                </span>
              </div>
            ) : sigType === "draw" ? (
              <div style={{ display: "grid", gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>
                  Desenhe sua assinatura padrão:
                </span>
                <SignatureCanvas onChange={setSigImage} initialImage={sigImage} height={150} />
              </div>
            ) : sigType === "cursive" ? (
              <div style={{ display: "grid", gap: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>
                  Estilo caligráfico de rubrica:
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                  {Object.values(CURSIVE_STYLES).map((style) => {
                    const selected = cursiveStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setCursiveStyle(style.id)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: selected ? "2px solid #092a54" : "1px solid #cbd5e1",
                          background: selected ? "#fff" : "#fafafa",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ display: "block", fontSize: 11, color: "#64748b" }}>{style.label}</span>
                        <span
                          style={{
                            display: "block",
                            marginTop: 3,
                            fontSize: 20,
                            fontFamily: style.fontFamily,
                            color: "#092a54",
                            ...style.sampleStyle,
                          }}
                        >
                          {name || "Gabriel Cruz"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : sigType === "upload" ? (
              <div style={{ display: "grid", gap: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>
                  Foto ou scan da assinatura / rubrica (PNG com transparência ou JPG):
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <label className="ui-btn ui-btn-secondary" style={{ cursor: "pointer" }}>
                    <Upload size={16} aria-hidden="true" /> Selecionar imagem
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={(e) => void handleImageUpload(e.target.files?.[0])}
                    />
                  </label>
                  {sigImage ? (
                    <button
                      type="button"
                      className="ui-btn ui-btn-secondary ui-btn-sm"
                      onClick={() => setSigImage(null)}
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
                {sigImage ? (
                  <div style={{ background: "#fff", border: "1px dashed #cbd5e1", borderRadius: 8, padding: 8, textAlign: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sigImage} alt="Assinatura enviada" style={{ maxHeight: 80, maxWidth: "100%", objectFit: "contain" }} />
                  </div>
                ) : null}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#092a54" }}>
                <ShieldCheck size={22} />
                <span style={{ fontSize: 13 }}>
                  Chancela oficial de pessoa jurídica da <strong>{FMC_INSTITUTIONAL.name}</strong> (CNPJ {FMC_INSTITUTIONAL.cnpj}).
                </span>
              </div>
            )}
          </div>

          {sigError ? (
            <p className="ui-alert ui-alert-error" role="alert" style={{ margin: 0 }}>
              {sigError}
            </p>
          ) : null}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="ui-btn ui-btn-primary" disabled={sigSaving} aria-busy={sigSaving}>
              <Check size={16} aria-hidden="true" /> {sigSaving ? "Salvando..." : "Salvar assinatura padrão"}
            </button>
          </div>
        </form>
      </section>
      {toast}
    </AppShell>
  );
}
