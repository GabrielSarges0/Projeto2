"use client";

import { useState, type ReactNode } from "react";
import { Modal } from "./Modal";

type ConfirmDialogProps = {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
};

export function ConfirmDialog({ title, message, confirmLabel = "Confirmar", danger = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir.");
      setBusy(false);
    }
  }

  return (
    <Modal
      title={title}
      onClose={onCancel}
      busy={busy}
      role="alertdialog"
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onCancel} disabled={busy} data-autofocus>
            Cancelar
          </button>
          <button
            type="button"
            className={`ui-btn ${danger ? "ui-btn-danger" : "ui-btn-primary"}`}
            onClick={handleConfirm}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? "Aguarde..." : confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ fontSize: 14, lineHeight: "21px", color: "var(--ui-text)" }}>{message}</div>
      {error ? (
        <p className="ui-alert ui-alert-error" role="alert">
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
