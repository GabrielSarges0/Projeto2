"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, QrCode, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { DocumentItem, DocumentSignature } from "@/lib/schemas";
import {
  CURSIVE_STYLES,
  FMC_INSTITUTIONAL,
  SIGNATURE_TYPE_LABELS,
  documentVerificationUrl,
  generateQrCodeSvg,
  qrCodeToDataUrl,
} from "@/lib/signatures";
import { formatDateTime } from "@/lib/format";

type Props = {
  document: DocumentItem;
  signature: DocumentSignature;
  onClose: () => void;
};

export function SignatureVerifyModal({ document, signature, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const verifyUrl = documentVerificationUrl(document.id, signature.sha256);
  const qrSvg = generateQrCodeSvg(verifyUrl, 2);
  const qrDataUrl = qrCodeToDataUrl(qrSvg);

  async function copyHash() {
    try {
      await navigator.clipboard.writeText(signature.sha256);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <Modal
      title="Verificação de Autenticidade Digital"
      onClose={onClose}
      footer={
        <button type="button" className="ui-btn ui-btn-primary" onClick={onClose}>
          Fechar
        </button>
      }
    >
      <div style={{ display: "grid", gap: 16 }}>
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #10b981",
            borderRadius: 8,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              background: "#10b981",
              color: "#fff",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={20} />
          </span>
          <div>
            <strong style={{ color: "#065f46", fontSize: 14, display: "block" }}>
              Assinatura Eletrônica Autêntica e Válida
            </strong>
            <span style={{ fontSize: 12.5, color: "#047857" }}>
              Documento assinado em conformidade com as diretrizes da Fundação Manoel Cruz e rastreabilidade digital.
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          <div style={{ background: "#f8fafc", padding: 10, borderRadius: 6 }}>
            <span style={{ fontSize: 11.5, color: "#64748b", display: "block" }}>Documento</span>
            <strong style={{ fontSize: 13.5, color: "#0f172a" }}>{document.name}</strong>
          </div>
          <div style={{ background: "#f8fafc", padding: 10, borderRadius: 6 }}>
            <span style={{ fontSize: 11.5, color: "#64748b", display: "block" }}>Protocolo FMC</span>
            <strong style={{ fontSize: 13.5, color: "#0f172a" }}>{document.protocol}</strong>
          </div>
          <div style={{ background: "#f8fafc", padding: 10, borderRadius: 6 }}>
            <span style={{ fontSize: 11.5, color: "#64748b", display: "block" }}>Signatário</span>
            <strong style={{ fontSize: 13.5, color: "#0f172a" }}>{signature.signedBy}</strong>
          </div>
          <div style={{ background: "#f8fafc", padding: 10, borderRadius: 6 }}>
            <span style={{ fontSize: 11.5, color: "#64748b", display: "block" }}>Cargo / Representação</span>
            <strong style={{ fontSize: 13.5, color: "#0f172a" }}>{signature.signerRole}</strong>
          </div>
          <div style={{ background: "#f8fafc", padding: 10, borderRadius: 6 }}>
            <span style={{ fontSize: 11.5, color: "#64748b", display: "block" }}>E-mail Registrado</span>
            <strong style={{ fontSize: 13.5, color: "#0f172a" }}>{signature.signerEmail || "—"}</strong>
          </div>
          <div style={{ background: "#f8fafc", padding: 10, borderRadius: 6 }}>
            <span style={{ fontSize: 11.5, color: "#64748b", display: "block" }}>Data e Hora da Assinatura</span>
            <strong style={{ fontSize: 13.5, color: "#0f172a" }}>{formatDateTime(signature.signedAt)}</strong>
          </div>
          <div style={{ background: "#f8fafc", padding: 10, borderRadius: 6 }}>
            <span style={{ fontSize: 11.5, color: "#64748b", display: "block" }}>Modalidade</span>
            <strong style={{ fontSize: 13.5, color: "#0f172a" }}>
              {SIGNATURE_TYPE_LABELS[signature.type]}
            </strong>
          </div>
          <div style={{ background: "#f8fafc", padding: 10, borderRadius: 6 }}>
            <span style={{ fontSize: 11.5, color: "#64748b", display: "block" }}>Instituição</span>
            <strong style={{ fontSize: 13.5, color: "#0f172a" }}>{FMC_INSTITUTIONAL.name}</strong>
          </div>
        </div>

        {/* Representação visual da assinatura */}
        <div style={{ background: "#f1f5f9", padding: 12, borderRadius: 8, display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
            Visualização da Assinatura Registrada:
          </span>
          <div style={{ background: "#fff", padding: 12, borderRadius: 6, display: "flex", justifyContent: "center" }}>
            {signature.signatureImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signature.signatureImage}
                alt={`Assinatura de ${signature.signedBy}`}
                style={{ maxHeight: 70, maxWidth: "100%", objectFit: "contain" }}
              />
            ) : signature.type === "cursive" ? (
              <span
                style={{
                  fontSize: 28,
                  fontFamily: CURSIVE_STYLES[signature.cursiveStyle ?? "classic"]?.fontFamily,
                  color: "#092a54",
                  fontStyle: "italic",
                }}
              >
                {signature.signedBy}
              </span>
            ) : (
              <span style={{ fontSize: 14, color: "#065f46", fontWeight: 600 }}>
                Certificado Digital Integrado (SHA-256)
              </span>
            )}
          </div>
        </div>

        {/* Hash criptográfico SHA-256 */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
              Hash Criptográfico SHA-256 (Integridade do Documento):
            </span>
            <button
              type="button"
              className="ui-btn ui-btn-secondary ui-btn-sm"
              onClick={() => void copyHash()}
              style={{ fontSize: 11.5, padding: "3px 8px" }}
            >
              {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              {copied ? "Copiado!" : "Copiar Hash"}
            </button>
          </div>
          <code
            style={{
              display: "block",
              background: "#1e293b",
              color: "#38bdf8",
              padding: "8px 12px",
              borderRadius: 6,
              fontSize: 12,
              wordBreak: "break-all",
              userSelect: "all",
            }}
          >
            {signature.sha256}
          </code>
        </div>

        {/* QR Code e link de validação pública */}
        <div
          style={{
            borderTop: "1px solid #e2e8f0",
            paddingTop: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Code de Validação" style={{ width: 64, height: 64, borderRadius: 4 }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}>
                <QrCode size={14} />
                <span>QR Code de Acesso Rápido</span>
              </div>
              <span style={{ fontSize: 11.5, color: "#64748b", display: "block" }}>
                Aponte a câmera do celular para abrir esta verificação em qualquer dispositivo.
              </span>
            </div>
          </div>
          <a
            href={verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ui-btn ui-btn-secondary ui-btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}
          >
            <ExternalLink size={14} /> Abrir link direto
          </a>
        </div>
      </div>
    </Modal>
  );
}
