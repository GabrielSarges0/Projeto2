import { useId, type ReactNode } from "react";

type FieldProps = {
  label: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
};

/** Rótulo, dica e erro ligados ao campo por id/aria (leitores de tela anunciam o erro). */
export function Field({ label, error, hint, required = false, children }: FieldProps) {
  const id = useId();
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="ui-field">
      <label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {hint ? (
        <span id={`${id}-hint`} className="ui-field-hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-error`} className="ui-field-error">
          {error}
        </span>
      ) : null}
    </div>
  );
}
