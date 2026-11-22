"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";

type Props = {
  onChange: (dataUrl: string | null) => void;
  initialImage?: string | null;
  height?: number;
};

type Point = { x: number; y: number };
type Stroke = { points: Point[]; color: string; width: number };

export function SignatureCanvas({ onChange, initialImage, height = 180 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState<"#092a54" | "#111827">("#092a54");
  const [lineWidth, setLineWidth] = useState(2.5);
  const currentStroke = useRef<Stroke | null>(null);
  // Assinatura salva antes: aparece até o primeiro traço novo e não volta ao desfazer/limpar.
  const [baseImage, setBaseImage] = useState<string | null>(initialImage ?? null);

  // Redesenha os traços no canvas sempre que a lista de strokes mudar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ajusta resolução nítida para Retina / alta densidade de pixels
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 400;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.scale(ratio, ratio);

    ctx.clearRect(0, 0, width, height);

    // Linha de base sutil para o signatário se guiar
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, height - 35);
    ctx.lineTo(width - 30, height - 35);
    ctx.stroke();
    ctx.setLineDash([]);

    // Desenha todos os traços armazenados
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }

    if (strokes.length > 0) {
      // Exporta em PNG com fundo transparente
      onChange(canvas.toDataURL("image/png"));
    } else {
      onChange(baseImage);
    }
  }, [strokes, height, baseImage, onChange]);

  function getCoords(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setBaseImage(null);
    const point = getCoords(e);
    currentStroke.current = {
      points: [point],
      color,
      width: lineWidth,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing || !currentStroke.current) return;
    const point = getCoords(e);
    currentStroke.current.points.push(point);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // O contexto já está escalado pelo devicePixelRatio no efeito de redesenho.
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const pts = currentStroke.current.points;
    if (pts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function handlePointerUp() {
    // Copia o traço antes de zerar a ref: o updater do setState roda depois, e com a ref já nula quebrava a página.
    const stroke = currentStroke.current;
    currentStroke.current = null;
    setIsDrawing(false);
    if (stroke && stroke.points.length > 1) {
      setStrokes((prev) => [...prev, stroke]);
    }
  }

  function clear() {
    setStrokes([]);
    setBaseImage(null);
  }

  function undo() {
    setStrokes((prev) => prev.slice(0, -1));
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div
        style={{
          border: "2px dashed #cbd5e1",
          borderRadius: 8,
          background: "#ffffff",
          touchAction: "none",
          position: "relative",
          overflow: "hidden",
          cursor: "crosshair",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height, display: "block" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        {strokes.length === 0 && baseImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL local, next/image não otimiza
          <img
            src={baseImage}
            alt="Assinatura salva"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }}
          />
        ) : null}
        {strokes.length === 0 && !baseImage ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              fontSize: 14,
            }}
          >
            Assine aqui usando o dedo, mouse ou caneta digital
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>Caneta:</span>
          <button
            type="button"
            className="ui-btn ui-btn-sm"
            onClick={() => setColor("#092a54")}
            style={{
              background: color === "#092a54" ? "#092a54" : "#f1f5f9",
              color: color === "#092a54" ? "#fff" : "#092a54",
              border: "1px solid #cbd5e1",
              padding: "4px 8px",
            }}
          >
            Azul Caneta
          </button>
          <button
            type="button"
            className="ui-btn ui-btn-sm"
            onClick={() => setColor("#111827")}
            style={{
              background: color === "#111827" ? "#111827" : "#f1f5f9",
              color: color === "#111827" ? "#fff" : "#111827",
              border: "1px solid #cbd5e1",
              padding: "4px 8px",
            }}
          >
            Preto Tinta
          </button>
          <button
            type="button"
            className="ui-btn ui-btn-sm"
            onClick={() => setLineWidth((prev) => (prev === 2.5 ? 4 : 2.5))}
            style={{ border: "1px solid #cbd5e1", padding: "4px 8px" }}
          >
            {lineWidth === 2.5 ? "Traço Normal" : "Traço Grosso"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            className="ui-btn ui-btn-secondary ui-btn-sm"
            onClick={undo}
            disabled={strokes.length === 0}
            title="Desfazer último traço"
          >
            <RotateCcw size={14} aria-hidden="true" /> Desfazer
          </button>
          <button
            type="button"
            className="ui-btn ui-btn-secondary ui-btn-sm"
            onClick={clear}
            disabled={strokes.length === 0 && !baseImage}
            title="Limpar assinatura"
          >
            <Trash2 size={14} aria-hidden="true" /> Limpar
          </button>
        </div>
      </div>
    </div>
  );
}
