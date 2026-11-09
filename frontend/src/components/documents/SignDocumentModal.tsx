"use client";

import { useId, useState, type FormEvent } from "react";
import { Award, Check, FileCheck, PenLine, PenTool, ShieldCheck, Upload } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import type { DocumentSignature, SignatureType } from "@/lib/schemas";
import {
  CURSIVE_STYLES,
  FMC_INSTITUTIONAL,
  generateDocumentHash,
  parseSignaturePrefs,
} from "@/lib/signatures";
import { readFileAsDataUrl } from "@/lib/files";
import { useSession } from "@/lib/session";
import { SignatureCanvas } from "./SignatureCanvas";

type Props = {
  documentTitle: string;
  protocol: string;
  paragraphs?: string[];
  initialSignature?: DocumentSignature | null;
  onClose: () => void;
  onSign: (signature: DocumentSignature, saveAsDefault: boolean) => Promise<void> | void;
};

export function SignDocumentModal({
  documentTitle,
  protocol,
  paragraphs = [],
  initialSignature,
  onClose,
  onSign,
}: Props) {
  const session = useSession();
  const formId = useId();
  const savedPrefs = parseSignaturePrefs(session?.user?.preferences as Record<string, unknown> | undefined);

  const [type, setType] = useState<SignatureType>(
    initialSignature?.type ?? savedPrefs.defaultType ?? "hash"
  );
  const [signerName, setSignerName] = useState(
    initialSignature?.signedBy || session?.user?.name || ""
  );
  const [signerRole, setSignerRole] = useState(
    initialSignature?.signerRole || savedPrefs.defaultRole || "Representante Legal"
  );
  const [signerEmail, setSignerEmail] = useState(
    initialSignature?.signerEmail || session?.user?.username || ""
  );
  const [cursiveStyle, setCursiveStyle] = useState(
    initialSignature?.cursiveStyle || savedPrefs.cursiveStyle || "classic"
  );
  const [signatureImage, setSignatureImage] = useState<string | null>(
    initialSignature?.signatureImage || savedPrefs.signatureImage || null
  );
  const [includeQrCode, setIncludeQrCode] = useState(
    initialSignature ? initialSignature.includeQrCode : true
  );
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const tabOptions: Array<{ type: SignatureType; label: string; icon: typeof Award }> = [
    { type: "hash", label: "Carimbo Digital", icon: ShieldCheck },
    { type: "draw", label: "Desenhar na tela", icon: PenLine },
    { type: "cursive", label: "Digitar Caligráfica", icon: PenTool },
    { type: "upload", label: "Enviar Imagem", icon: Upload },
    { type: "institutional", label: "Chancela FMC", icon: FileCheck },
  ];

  async function handleImageUpload(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("A imagem da assinatura deve ter no máximo 2 MB.");
      return;
    }
    setError("");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setSignatureImage(dataUrl);
    } catch {
      setError("Não foi possível ler o arquivo da imagem.");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!signerName.trim()) {
      setError("Informe o nome do signatário.");
      return;
    }
    if (type === "draw" && !signatureImage) {
      setError("Desenhe sua assinatura no quadro antes de confirmar.");
      return;
    }
    if (type === "upload" && !signatureImage) {
      setError("Selecione um arquivo de imagem com sua assinatura.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const signedAt = new Date().toISOString();
      const sha256 = await generateDocumentHash({
        protocol,
        title: documentTitle,
        paragraphs,
        signer: signerName.trim(),
        signedAt,
      });

      const signature: DocumentSignature = {
        type,
        signedBy: signerName.trim(),
        signerRole: signerRole.trim() || "Representante",
        signerEmail: signerEmail.trim(),
        signedAt,
        sha256,
        signatureImage: type === "draw" || type === "upload" ? signatureImage : null,
        cursiveStyle: type === "cursive" ? cursiveStyle : null,
        includeQrCode,
      };

      await onSign(signature, saveAsDefault);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao assinar documento.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Assinatura Digital de Documento"
      wide
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form={formId} className="ui-btn ui-btn-primary" disabled={saving} aria-busy={saving}>
            <Check size={16} aria-hidden="true" /> {saving ? "Assinando..." : "Confirmar e Assinar"}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
            Modalidade de Assinatura
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 8,
            }}
          >
            {tabOptions.map((tab) => {
              const Icon = tab.icon;
              const active = type === tab.type;
              return (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => {
                    setType(tab.type);
                    setError("");
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 8px",
                    borderRadius: 8,
                    border: active ? "2px solid var(--ui-primary)" : "1px solid #cbd5e1",
                    background: active ? "var(--ui-surface-muted, #f0f7ff)" : "#ffffff",
                    color: active ? "var(--ui-primary)" : "#475569",
                    fontWeight: active ? 600 : 500,
                    fontSize: 12.5,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo específico da modalidade escolhida */}
        <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
          {type === "hash" ? (
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#065f46" }}>
                <ShieldCheck size={20} />
                <strong>Carimbo Digital com Hash Criptográfico SHA-256</strong>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                Gera um carimbo formal com validação criptográfica inviolável, contendo identificação completa do signatário, protocolo, data/hora e hash de integridade.
              </p>
            </div>
          ) : type === "draw" ? (
            <div style={{ display: "grid", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                Desenhe sua assinatura com mouse, caneta ou dedo:
              </span>
              <SignatureCanvas onChange={setSignatureImage} initialImage={signatureImage} height={160} />
            </div>
          ) : type === "cursive" ? (
            <div style={{ display: "grid", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                Selecione o estilo caligráfico de rubrica:
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
                {Object.values(CURSIVE_STYLES).map((style) => {
                  const selected = cursiveStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setCursiveStyle(style.id)}
                      style={{
                        padding: "10px 12px",
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
                          marginTop: 4,
                          fontSize: 22,
                          fontFamily: style.fontFamily,
                          color: "#092a54",
                          ...style.sampleStyle,
                        }}
                      >
                        {signerName || "Assinatura Modelo"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : type === "upload" ? (
            <div style={{ display: "grid", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                Envie o arquivo da sua assinatura ou rubrica (PNG com transparência ou JPG):
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <label className="ui-btn ui-btn-secondary" style={{ cursor: "pointer" }}>
                  <Upload size={16} aria-hidden="true" /> Selecionar imagem
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={(e) => void handleImageUpload(e.target.files?.[0])}
                  />
                </label>
                {signatureImage ? (
                  <button
                    type="button"
                    className="ui-btn ui-btn-secondary ui-btn-sm"
                    onClick={() => setSignatureImage(null)}
                  >
                    Remover imagem
                  </button>
                ) : null}
              </div>
              {signatureImage ? (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px dashed #cbd5e1",
                    borderRadius: 8,
                    padding: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    maxHeight: 120,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signatureImage}
                    alt="Pré-visualização da assinatura"
                    style={{ maxHeight: 90, maxWidth: "100%", objectFit: "contain" }}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            // Institutional
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#092a54" }}>
                <ShieldCheck size={20} />
                <strong>Chancela Institucional Pessoa Jurídica</strong>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#334155" }}>
                Documento emitido com a fé pública e dados estatutários de <strong>{FMC_INSTITUTIONAL.name}</strong> (CNPJ {FMC_INSTITUTIONAL.cnpj}), subscrito pelo responsável autorizado.
              </p>
            </div>
          )}
        </div>

        {/* Dados do signatário */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <Field label="Nome do Signatário" required hint="Aparecerá sob a assinatura">
            {(props) => (
              <input
                {...props}
                className="ui-input"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                maxLength={100}
              />
            )}
          </Field>
          <Field label="Cargo / Função" required hint="Ex: Representante Legal, Gestor, Diretor">
            {(props) => (
              <input
                {...props}
                className="ui-input"
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value)}
                maxLength={80}
              />
            )}
          </Field>
          <Field label="E-mail Institucional" hint="Para registro na trilha de auditoria">
            {(props) => (
              <input
                {...props}
                className="ui-input"
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
              />
            )}
          </Field>
        </div>

        {/* Opções adicionais */}
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={includeQrCode}
              onChange={(e) => setIncludeQrCode(e.target.checked)}
            />
            <span>Incluir <strong>QR Code oficial de validação pública</strong> no rodapé do documento</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={saveAsDefault}
              onChange={(e) => setSaveAsDefault(e.target.checked)}
            />
            <span>Salvar esta modalidade e dados como <strong>minha assinatura padrão</strong> no Perfil</span>
          </label>
        </div>

        {error ? (
          <p className="ui-alert ui-alert-error" role="alert" style={{ margin: 0 }}>
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
