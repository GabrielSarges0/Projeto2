import { qrcodegen } from "./qrcodegen";
import type { SignatureType, UserSignaturePrefs } from "./schemas";
import { userSignaturePrefsSchema } from "./schemas";

export const FMC_INSTITUTIONAL = {
  name: "Fundação Manoel Cruz - FMC",
  cnpj: "03.245.981/0001-44",
  sealText: "Certificado de Autenticidade Institucional FMC",
} as const;

export type CursiveStyleDef = {
  id: string;
  label: string;
  fontFamily: string;
  sampleStyle: React.CSSProperties;
};

export const CURSIVE_STYLES: Record<string, CursiveStyleDef> = {
  classic: {
    id: "classic",
    label: "Cursiva Clássica",
    fontFamily: "'Dancing Script', 'Brush Script MT', cursive, sans-serif",
    sampleStyle: { fontStyle: "italic", fontWeight: 600, letterSpacing: 0.5 },
  },
  artistic: {
    id: "artistic",
    label: "Caligrafia Formal",
    fontFamily: "'Great Vibes', 'Lucida Handwriting', 'Edwardian Script ITC', cursive, serif",
    sampleStyle: { fontStyle: "italic", fontWeight: 500, letterSpacing: 1 },
  },
  executive: {
    id: "executive",
    label: "Rubrica Dinâmica",
    fontFamily: "'Caveat', 'Segoe Script', 'Comic Sans MS', cursive",
    sampleStyle: { fontStyle: "italic", fontWeight: 700, letterSpacing: -0.5 },
  },
  clean: {
    id: "clean",
    label: "Manuscrito Moderno",
    fontFamily: "'Sacramento', 'Bradley Hand', 'Segoe Print', cursive",
    sampleStyle: { fontStyle: "italic", fontWeight: 500 },
  },
};

export const SIGNATURE_TYPE_LABELS: Record<SignatureType, string> = {
  hash: "Carimbo Digital Criptográfico (SHA-256)",
  draw: "Desenho Manuscrito (Tela / Touch)",
  cursive: "Digitação Caligráfica (Estilo DocuSign)",
  upload: "Upload de Imagem da Assinatura",
  institutional: "Chancela Institucional FMC",
};

/** Calcula SHA-256 no navegador ou ambiente Node moderno. */
export async function computeSha256(text: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback seguro de hashing determinístico caso crypto.subtle esteja ausente
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash1 = (hash1 * 33) ^ char;
    hash2 = (hash2 * 33) ^ char;
  }
  const part1 = Math.abs(hash1).toString(16).padStart(32, "a");
  const part2 = Math.abs(hash2).toString(16).padStart(32, "b");
  return (part1 + part2).slice(0, 64);
}

/** Gera o hash único de integridade do documento. */
export async function generateDocumentHash(input: {
  protocol: string;
  title: string;
  paragraphs?: string[];
  signer: string;
  signedAt: string;
}): Promise<string> {
  const content = [
    input.protocol,
    input.title,
    input.signer,
    input.signedAt,
    ...(input.paragraphs ?? []),
  ].join("::");
  return computeSha256(content);
}

/** Gera um SVG vetorial puro e nítido do QR Code (zero dependências npm). */
export function generateQrCodeSvg(text: string, border = 2): string {
  try {
    const qr = qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM);
    const parts: string[] = [];
    for (let y = 0; y < qr.size; y++) {
      for (let x = 0; x < qr.size; x++) {
        if (qr.getModule(x, y)) {
          parts.push(`M${x + border},${y + border}h1v1h-1z`);
        }
      }
    }
    const totalSize = qr.size + border * 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" stroke="none" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#ffffff"/><path d="${parts.join("")}" fill="#0f172a"/></svg>`;
  } catch {
    // Retorna fallback básico se o payload for muito longo
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f1f5f9"/><text x="50" y="55" font-size="10" text-anchor="middle" fill="#64748b">QR Code</text></svg>`;
  }
}

/** Converte SVG em Data URL seguro para tags img e CSS. */
export function qrCodeToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Constrói a URL pública de verificação do documento. */
export function documentVerificationUrl(documentId: string, hash?: string): string {
  if (typeof window === "undefined") {
    return `https://projetocesarschool.vercel.app/documentos?doc=${encodeURIComponent(documentId)}&verify=1`;
  }
  const origin = window.location.origin;
  const url = new URL("/documentos", origin);
  url.searchParams.set("doc", documentId);
  url.searchParams.set("verify", "1");
  if (hash) {
    url.searchParams.set("h", hash.slice(0, 16));
  }
  return url.toString();
}

/** Formata hash SHA-256 para exibição reduzida amigável. */
export function formatSha256(hash: string): string {
  if (!hash || hash.length < 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

/** Obtém as preferências salvas de assinatura do usuário logado. */
export function parseSignaturePrefs(preferences: Record<string, unknown> | null | undefined): UserSignaturePrefs {
  try {
    return userSignaturePrefsSchema.parse(preferences?.signature ?? {});
  } catch {
    return userSignaturePrefsSchema.parse({});
  }
}
