"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import type { DocumentSignature } from "@/lib/schemas";
import {
  CURSIVE_STYLES,
  FMC_INSTITUTIONAL,
  documentVerificationUrl,
  formatSha256,
  generateQrCodeSvg,
  qrCodeToDataUrl,
} from "@/lib/signatures";
import { formatDateTime } from "@/lib/format";

type Props = {
  signature: DocumentSignature;
  documentId?: string;
  compact?: boolean;
};

export function SignatureBlock({ signature, documentId, compact = false }: Props) {
  const cursive = CURSIVE_STYLES[signature.cursiveStyle ?? "classic"] ?? CURSIVE_STYLES.classic;
  const qrUrl = documentVerificationUrl(documentId ?? "doc-preview", signature.sha256);
  const qrSvg = signature.includeQrCode ? generateQrCodeSvg(qrUrl, 2) : null;
  const qrDataUrl = qrSvg ? qrCodeToDataUrl(qrSvg) : null;

  return (
    <div
      style={{
        marginTop: compact ? 24 : 36,
        paddingTop: 16,
        borderTop: "1px solid #cbd5e1",
        display: "grid",
        gap: 12,
        fontFamily: "inherit",
        color: "#1e293b",
      }}
    >
      {signature.type === "institutional" ? (
        // Chancela Institucional da Fundação Manoel Cruz
        <div
          style={{
            border: "1.5px solid #092a54",
            borderRadius: 8,
            padding: "12px 16px",
            background: "#f8fafc",
            display: "grid",
            gridTemplateColumns: qrDataUrl ? "1fr auto" : "1fr",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#092a54", fontWeight: 700, fontSize: 13.5 }}>
              <ShieldCheck size={18} aria-hidden="true" />
              <span>{FMC_INSTITUTIONAL.sealText.toUpperCase()}</span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 600 }}>{FMC_INSTITUTIONAL.name}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#475569" }}>CNPJ: {FMC_INSTITUTIONAL.cnpj}</p>
            <p style={{ margin: "4px 0 0", fontSize: 12 }}>
              Representante Emissor: <strong>{signature.signedBy}</strong> ({signature.signerRole})
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
              Emitido em {formatDateTime(signature.signedAt)} · Hash SHA-256: <code>{formatSha256(signature.sha256)}</code>
            </p>
          </div>
          {qrDataUrl ? (
            <div style={{ textAlign: "center", justifySelf: "end" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR Code de Verificação" style={{ width: 68, height: 68, display: "block" }} />
              <span style={{ fontSize: 9.5, color: "#64748b", display: "block", marginTop: 2 }}>Verificar</span>
            </div>
          ) : null}
        </div>
      ) : signature.type === "hash" ? (
        // Carimbo Digital Criptográfico
        <div
          style={{
            border: "1px solid #10b981",
            borderRadius: 8,
            padding: "10px 14px",
            background: "#ecfdf5",
            display: "grid",
            gridTemplateColumns: qrDataUrl ? "1fr auto" : "1fr",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#065f46", fontWeight: 700, fontSize: 13 }}>
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>DOCUMENTO ASSINADO DIGITALMENTE</span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 600, color: "#064e3b" }}>
              {signature.signedBy} · <span style={{ fontWeight: 500 }}>{signature.signerRole}</span>
            </p>
            {signature.signerEmail ? (
              <p style={{ margin: "1px 0 0", fontSize: 11.5, color: "#047857" }}>{signature.signerEmail}</p>
            ) : null}
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#065f46" }}>
              Assinado em {formatDateTime(signature.signedAt)} · SHA-256: <code>{formatSha256(signature.sha256)}</code>
            </p>
          </div>
          {qrDataUrl ? (
            <div style={{ textAlign: "center", justifySelf: "end" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR Code de Verificação" style={{ width: 64, height: 64, display: "block" }} />
              <span style={{ fontSize: 9.5, color: "#065f46", display: "block", marginTop: 2 }}>Validar</span>
            </div>
          ) : null}
        </div>
      ) : (
        // Assinatura com Traço (Desenho, Imagem ou Cursiva)
        <div
          style={{
            display: "grid",
            gridTemplateColumns: qrDataUrl ? "1fr auto" : "1fr",
            gap: 16,
            alignItems: "end",
          }}
        >
          <div style={{ maxWidth: 380 }}>
            {signature.signatureImage ? (
              // Imagem manuscrita ou upload
              <div style={{ height: 60, display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signature.signatureImage}
                  alt={`Assinatura de ${signature.signedBy}`}
                  style={{ maxHeight: 56, maxWidth: 260, objectFit: "contain" }}
                />
              </div>
            ) : signature.type === "cursive" ? (
              // Estilo caligráfico
              <div
                style={{
                  height: 52,
                  display: "flex",
                  alignItems: "flex-end",
                  paddingBottom: 4,
                  fontSize: 26,
                  fontFamily: cursive.fontFamily,
                  color: "#092a54",
                  ...cursive.sampleStyle,
                }}
              >
                {signature.signedBy}
              </div>
            ) : null}

            <div style={{ borderTop: "1.5px solid #334155", paddingTop: 4 }}>
              <strong style={{ display: "block", fontSize: 13, color: "#0f172a" }}>{signature.signedBy}</strong>
              <span style={{ display: "block", fontSize: 11.5, color: "#475569" }}>{signature.signerRole}</span>
              {signature.signerEmail ? (
                <span style={{ display: "block", fontSize: 11, color: "#64748b" }}>{signature.signerEmail}</span>
              ) : null}
              <div style={{ marginTop: 4, fontSize: 10.5, color: "#64748b" }}>
                <span>Assinado eletronicamente em {formatDateTime(signature.signedAt)}</span>
                <span style={{ display: "block" }}>
                  SHA-256: <code>{formatSha256(signature.sha256)}</code>
                </span>
              </div>
            </div>
          </div>

          {qrDataUrl ? (
            <div style={{ textAlign: "center", justifySelf: "end", paddingBottom: 4 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR Code de Verificação" style={{ width: 64, height: 64, display: "block" }} />
              <span style={{ fontSize: 9.5, color: "#64748b", display: "block", marginTop: 2 }}>Verificar</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
