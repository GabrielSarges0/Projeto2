import type { DocumentSignature, TemplateLayout } from "@/lib/schemas";
import { LAYOUT_FONT_SIZE, LAYOUT_FONT_STACK } from "@/lib/templates";
import { SignatureBlock } from "./SignatureBlock";

type Props = {
  layout: TemplateLayout;
  signature?: DocumentSignature | null;
  documentId?: string;
  compact?: boolean;
};

/** Documento gerado por modelo, com a formatação escolhida e assinatura digital integrada. */
export function DocumentPreview({ layout, signature, documentId, compact = false }: Props) {
  const fontSize = LAYOUT_FONT_SIZE[layout.size] - (compact ? 0.5 : 0);
  return (
    <article
      style={{
        fontFamily: LAYOUT_FONT_STACK[layout.font],
        fontSize,
        lineHeight: 1.6,
        maxWidth: 640,
        margin: "0 auto",
        color: "#111827",
      }}
    >
      {layout.header ? (
        <p style={{ textAlign: "center", fontWeight: 700, margin: 0, fontSize: 12.5, letterSpacing: 0.3 }}>
          {layout.header}
        </p>
      ) : null}
      <h3 style={{ textAlign: "center", color: "var(--ui-primary)", fontSize: fontSize + 2, overflowWrap: "anywhere" }}>
        {layout.title}
      </h3>
      {layout.paragraphs.map((paragraph, index) => (
        <p key={index} style={{ textAlign: layout.align, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
          {paragraph}
        </p>
      ))}

      {signature ? <SignatureBlock signature={signature} documentId={documentId} compact={compact} /> : null}
    </article>
  );
}
