"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, FileText, Plus, RotateCcw, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/financial-api";
import { formatDateTime } from "@/lib/format";
import { useCan } from "@/lib/permissions";
import { TEMPLATE_ALIGNS, TEMPLATE_FONTS, TEMPLATE_SIZES, type TemplateLayout, type TemplateSetting } from "@/lib/schemas";
import { getSession } from "@/lib/session";
import {
  DOCUMENT_TEMPLATES,
  GLOBAL_PLACEHOLDERS,
  LAYOUT_LIMITS,
  defaultLayout,
  findTemplate,
  layoutOf,
  renderTemplate,
  sampleData,
  useTemplateSettings,
  validateLayout,
  type DocumentTemplate,
} from "@/lib/templates";

const FONT_LABEL: Record<TemplateLayout["font"], string> = { serif: "Serifada", sans: "Sem serifa" };
const ALIGN_LABEL: Record<TemplateLayout["align"], string> = { justify: "Justificado", left: "À esquerda" };
const SIZE_LABEL: Record<TemplateLayout["size"], string> = { normal: "Normal", large: "Grande" };

function setModelInUrl(id: string | null) {
  window.history.replaceState(null, "", id ? `?modelo=${encodeURIComponent(id)}` : window.location.pathname);
}

/** Backlog 3 — Escolha da formatação: texto e aparência de cada modelo de documento. */
export default function ModelosPage() {
  const canEdit = useCan("edit");
  const settings = useTemplateSettings();
  const { show, node: toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("modelo");
    // O parâmetro só existe no navegador (a página é pré-renderizada sem ele).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id && findTemplate(id)) setSelectedId(id);
  }, []);

  function select(id: string | null) {
    setSelectedId(id);
    setModelInUrl(id);
    window.scrollTo({ top: 0 });
  }

  const selected = findTemplate(selectedId);
  const settingOf = (id: string) => settings.items.find((item) => item.id === id);

  return (
    <AppShell>
      <section className="ui-page" aria-labelledby="modelos-title">
        <div className="ui-page-header">
          <div>
            <Link href="/documentos" className="ui-link" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14 }}>
              <ArrowLeft size={14} aria-hidden="true" /> Documentos
            </Link>
            <h1 id="modelos-title" style={{ marginTop: 6 }}>
              {selected ? `Formatação: ${selected.label}` : "Formatação dos modelos"}
            </h1>
            <p>Escolha o texto, a fonte e o alinhamento de cada modelo. Vale para os próximos documentos; os já emitidos não mudam.</p>
          </div>
        </div>

        {!canEdit ? (
          <p className="ui-alert ui-alert-info">Só Gerente ou Administrador altera a formatação dos modelos. Os documentos continuam sendo gerados em Documentos → Novo documento.</p>
        ) : settings.loading ? (
          <div className="ui-skeleton" style={{ height: 240 }} aria-busy="true" />
        ) : settings.error ? (
          <div className="ui-alert ui-alert-error" role="alert" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
            <span>{settings.error}</span>
            <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => void settings.reload()}>
              Tentar de novo
            </button>
          </div>
        ) : selected ? (
          <TemplateEditor
            key={selected.id}
            template={selected}
            setting={settingOf(selected.id)}
            onBack={() => select(null)}
            onSave={async (layout) => {
              await settings.save({ ...layout, id: selected.id, updatedBy: getSession()?.user.name ?? "", updatedAt: new Date().toISOString() });
              show("Formatação salva. Vale para os próximos documentos deste modelo.");
            }}
            onReset={async () => {
              await settings.remove(selected.id);
              show("Modelo voltou ao texto padrão.");
            }}
            notifyError={(message) => show(message, "error")}
          />
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 12 }}>
            {DOCUMENT_TEMPLATES.map((template) => {
              const setting = settingOf(template.id);
              return (
                <li key={template.id} className="ui-card" style={{ display: "grid", gap: 8, alignContent: "start" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                    <h2 style={{ margin: 0, fontSize: 15.5, color: "var(--ui-primary)", display: "flex", gap: 6, alignItems: "flex-start" }}>
                      <FileText size={18} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
                      {template.label}
                    </h2>
                    <span className={`ui-badge ${setting ? "ui-badge-info" : "ui-badge-neutral"}`} style={{ flexShrink: 0 }}>
                      {setting ? "Personalizado" : "Padrão"}
                    </span>
                  </div>
                  <p className="ui-field-hint" style={{ margin: 0 }}>
                    {template.description}
                  </p>
                  {setting ? (
                    <p className="ui-field-hint" style={{ margin: 0 }}>
                      Alterado{setting.updatedBy ? ` por ${setting.updatedBy}` : ""}
                      {setting.updatedAt ? ` em ${formatDateTime(setting.updatedAt)}` : ""}
                    </p>
                  ) : null}
                  <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" style={{ justifySelf: "start" }} onClick={() => select(template.id)}>
                    Editar formatação<span className="sr-only"> de {template.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {toast}
    </AppShell>
  );
}

type TextTarget = { kind: "header" } | { kind: "title" } | { kind: "paragraph"; index: number };

function normalize(layout: TemplateLayout): TemplateLayout {
  return { ...layout, header: layout.header.trim(), title: layout.title.trim(), paragraphs: layout.paragraphs.map((paragraph) => paragraph.trim()) };
}

function sameLayout(a: TemplateLayout, b: TemplateLayout) {
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

function TemplateEditor({
  template,
  setting,
  onBack,
  onSave,
  onReset,
  notifyError,
}: {
  template: DocumentTemplate;
  setting: TemplateSetting | undefined;
  onBack: () => void;
  onSave: (layout: TemplateLayout) => Promise<void>;
  onReset: () => Promise<void>;
  notifyError: (message: string) => void;
}) {
  const saved = useMemo(() => (setting ? layoutOf(setting) : defaultLayout(template)), [setting, template]);
  const [draft, setDraft] = useState<TemplateLayout>(saved);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<"reset" | "leave" | null>(null);
  const target = useRef<TextTarget>({ kind: "paragraph", index: 0 });
  const elements = useRef(new Map<string, HTMLInputElement | HTMLTextAreaElement>());

  const dirty = !sameLayout(draft, saved);
  const differsFromDefault = !sameLayout(draft, defaultLayout(template));
  const errors = submitted ? validateLayout(template, draft) : {};
  const preview = renderTemplate(template, sampleData(template), draft);

  // Avisa antes de fechar a aba com alterações não salvas.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const keyOf = (t: TextTarget) => (t.kind === "paragraph" ? `paragraph-${t.index}` : t.kind);
  const register = (t: TextTarget) => (element: HTMLInputElement | HTMLTextAreaElement | null) => {
    if (element) elements.current.set(keyOf(t), element);
    else elements.current.delete(keyOf(t));
  };

  function textOf(layout: TemplateLayout, t: TextTarget) {
    return t.kind === "paragraph" ? (layout.paragraphs[t.index] ?? "") : layout[t.kind];
  }

  function withText(layout: TemplateLayout, t: TextTarget, value: string): TemplateLayout {
    if (t.kind === "paragraph") return { ...layout, paragraphs: layout.paragraphs.map((paragraph, index) => (index === t.index ? value : paragraph)) };
    return { ...layout, [t.kind]: value };
  }

  function focusAt(t: TextTarget, position: number) {
    requestAnimationFrame(() => {
      const element = elements.current.get(keyOf(t));
      if (!element) return;
      element.focus();
      element.setSelectionRange(position, position);
    });
  }

  /** Insere {campo} onde estava o cursor no último texto editado. */
  function insertPlaceholder(key: string) {
    let t = target.current;
    if (t.kind === "paragraph" && t.index >= draft.paragraphs.length) t = { kind: "paragraph", index: Math.max(0, draft.paragraphs.length - 1) };
    const element = elements.current.get(keyOf(t));
    const current = textOf(draft, t);
    const start = element?.selectionStart ?? current.length;
    const end = element?.selectionEnd ?? start;
    const token = `{${key}}`;
    setDraft(withText(draft, t, current.slice(0, start) + token + current.slice(end)));
    focusAt(t, start + token.length);
  }

  function moveParagraph(index: number, delta: -1 | 1) {
    const next = index + delta;
    if (next < 0 || next >= draft.paragraphs.length) return;
    const paragraphs = [...draft.paragraphs];
    [paragraphs[index], paragraphs[next]] = [paragraphs[next], paragraphs[index]];
    setDraft({ ...draft, paragraphs });
    target.current = { kind: "paragraph", index: next };
    focusAt({ kind: "paragraph", index: next }, paragraphs[next].length);
  }

  function removeParagraph(index: number) {
    if (draft.paragraphs.length <= 1) return;
    const paragraphs = draft.paragraphs.filter((_, i) => i !== index);
    setDraft({ ...draft, paragraphs });
    const focusIndex = Math.min(index, paragraphs.length - 1);
    target.current = { kind: "paragraph", index: focusIndex };
    focusAt(target.current, paragraphs[focusIndex].length);
  }

  function addParagraph() {
    if (draft.paragraphs.length >= LAYOUT_LIMITS.paragraphs) return;
    const index = draft.paragraphs.length;
    setDraft({ ...draft, paragraphs: [...draft.paragraphs, ""] });
    target.current = { kind: "paragraph", index };
    focusAt(target.current, 0);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    const found = validateLayout(template, draft);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found).find((key) => elements.current.has(key));
      if (first) elements.current.get(first)?.focus();
      return;
    }
    setSaving(true);
    try {
      await onSave(normalize(draft));
      setDraft(normalize(draft));
      setSubmitted(false);
    } catch (error) {
      notifyError(errorMessage(error, "Não foi possível salvar a formatação."));
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    setDraft(saved);
    setSubmitted(false);
  }

  async function confirmReset() {
    if (setting) await onReset();
    setDraft(defaultLayout(template));
    setSubmitted(false);
    setConfirm(null);
  }

  const fieldChips = [...template.fields.map((field) => ({ key: field.key, label: field.label })), ...GLOBAL_PLACEHOLDERS];
  const errorCount = Object.keys(errors).length;

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
        <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => (dirty ? setConfirm("leave") : onBack())}>
          <ArrowLeft size={14} aria-hidden="true" /> Todos os modelos
        </button>
        <span className={`ui-badge ${setting ? "ui-badge-info" : "ui-badge-neutral"}`}>{setting ? "Formatação personalizada" : "Texto padrão"}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))", gap: 16, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
          <section className="ui-card" aria-labelledby="aparencia-titulo" style={{ display: "grid", gap: 10 }}>
            <h2 id="aparencia-titulo" style={sectionTitle}>
              Aparência
            </h2>
            <div className="ui-form-grid-3">
              <Field label="Fonte">
                {(props) => (
                  <select {...props} className="ui-input" value={draft.font} onChange={(e) => setDraft({ ...draft, font: TEMPLATE_FONTS.find((f) => f === e.target.value) ?? "serif" })}>
                    {TEMPLATE_FONTS.map((font) => (
                      <option key={font} value={font}>
                        {FONT_LABEL[font]}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Alinhamento do texto">
                {(props) => (
                  <select {...props} className="ui-input" value={draft.align} onChange={(e) => setDraft({ ...draft, align: TEMPLATE_ALIGNS.find((a) => a === e.target.value) ?? "justify" })}>
                    {TEMPLATE_ALIGNS.map((align) => (
                      <option key={align} value={align}>
                        {ALIGN_LABEL[align]}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Tamanho da letra">
                {(props) => (
                  <select {...props} className="ui-input" value={draft.size} onChange={(e) => setDraft({ ...draft, size: TEMPLATE_SIZES.find((s) => s === e.target.value) ?? "normal" })}>
                    {TEMPLATE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {SIZE_LABEL[size]}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
          </section>

          <section className="ui-card" aria-labelledby="texto-titulo" style={{ display: "grid", gap: 12 }}>
            <h2 id="texto-titulo" style={sectionTitle}>
              Texto
            </h2>
            <div role="group" aria-labelledby="campos-titulo" style={{ display: "grid", gap: 6 }}>
              <span id="campos-titulo" style={{ fontSize: 13.5, fontWeight: 600 }}>
                Inserir campo do formulário
              </span>
              <span className="ui-field-hint">Clique num campo para colocá-lo onde está o cursor. No documento, ele vira o valor preenchido.</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {fieldChips.map((chip) => (
                  <button key={chip.key} type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => insertPlaceholder(chip.key)}>
                    <Plus size={12} aria-hidden="true" /> {chip.label}
                    <span className="sr-only"> (insere {`{${chip.key}}`})</span>
                  </button>
                ))}
              </div>
            </div>

            <Field label="Cabeçalho" hint="Aparece no topo, em destaque. Deixe vazio para não usar." error={errors.header}>
              {(props) => (
                <input
                  {...props}
                  ref={register({ kind: "header" })}
                  className="ui-input"
                  value={draft.header}
                  maxLength={LAYOUT_LIMITS.header}
                  onFocus={() => {
                    target.current = { kind: "header" };
                  }}
                  onChange={(e) => setDraft({ ...draft, header: e.target.value })}
                />
              )}
            </Field>
            <Field label="Título" required error={errors.title}>
              {(props) => (
                <input
                  {...props}
                  ref={register({ kind: "title" })}
                  className="ui-input"
                  value={draft.title}
                  maxLength={LAYOUT_LIMITS.title}
                  onFocus={() => {
                    target.current = { kind: "title" };
                  }}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              )}
            </Field>

            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
              {draft.paragraphs.map((paragraph, index) => (
                <li key={index} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 6, alignItems: "start" }}>
                  <Field label={`Parágrafo ${index + 1}`} error={errors[`paragraph-${index}`]}>
                    {(props) => (
                      <textarea
                        {...props}
                        ref={register({ kind: "paragraph", index })}
                        className="ui-input"
                        rows={Math.min(8, Math.max(2, Math.ceil(paragraph.length / 60)))}
                        value={paragraph}
                        maxLength={LAYOUT_LIMITS.paragraph}
                        onFocus={() => {
                          target.current = { kind: "paragraph", index };
                        }}
                        onChange={(e) => setDraft(withText(draft, { kind: "paragraph", index }, e.target.value))}
                      />
                    )}
                  </Field>
                  <div style={{ display: "grid", gap: 2, paddingTop: 22 }}>
                    <button type="button" className="ui-icon-btn" onClick={() => moveParagraph(index, -1)} disabled={index === 0} aria-label={`Subir parágrafo ${index + 1}`}>
                      <ArrowUp size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="ui-icon-btn"
                      onClick={() => moveParagraph(index, 1)}
                      disabled={index === draft.paragraphs.length - 1}
                      aria-label={`Descer parágrafo ${index + 1}`}
                    >
                      <ArrowDown size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="ui-icon-btn"
                      onClick={() => removeParagraph(index)}
                      disabled={draft.paragraphs.length <= 1}
                      aria-label={`Remover parágrafo ${index + 1}`}
                      style={{ color: "var(--ui-danger)" }}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
            {errors.paragraphs ? (
              <p className="ui-field-error" style={{ margin: 0 }}>
                {errors.paragraphs}
              </p>
            ) : null}
            <button
              type="button"
              className="ui-btn ui-btn-secondary ui-btn-sm"
              style={{ justifySelf: "start" }}
              onClick={addParagraph}
              disabled={draft.paragraphs.length >= LAYOUT_LIMITS.paragraphs}
            >
              <Plus size={14} aria-hidden="true" /> Adicionar parágrafo
            </button>
            <p className="ui-field-hint" style={{ margin: 0 }}>
              Um parágrafo que usa um campo opcional deixado em branco não aparece no documento.
            </p>
          </section>
        </div>

        <aside aria-labelledby="previa-titulo" className="ui-card" style={{ display: "grid", gap: 10, position: "sticky", top: 12, background: "#fff", minWidth: 0 }}>
          <h2 id="previa-titulo" style={sectionTitle}>
            Pré-visualização
          </h2>
          <span className="ui-field-hint">Com dados de exemplo. Os campos aparecem entre colchetes.</span>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
            <DocumentPreview layout={preview} compact />
          </div>
        </aside>
      </div>

      {errorCount > 0 ? (
        <p className="ui-alert ui-alert-error" role="alert">
          Corrija {errorCount === 1 ? "o campo destacado" : `os ${errorCount} campos destacados`} antes de salvar.
        </p>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
        {setting || differsFromDefault ? (
          <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setConfirm("reset")} disabled={saving}>
            <RotateCcw size={16} aria-hidden="true" /> Restaurar padrão
          </button>
        ) : null}
        {dirty ? (
          <button type="button" className="ui-btn ui-btn-secondary" onClick={discardChanges} disabled={saving}>
            Descartar alterações
          </button>
        ) : null}
        <button type="submit" className="ui-btn ui-btn-primary" disabled={saving || !dirty} aria-busy={saving}>
          {saving ? "Salvando..." : "Salvar formatação"}
        </button>
      </div>

      {confirm === "reset" ? (
        <ConfirmDialog
          title="Restaurar o texto padrão?"
          message={
            setting
              ? `A formatação personalizada de “${template.label}” será apagada. Documentos já emitidos não mudam.`
              : "As alterações não salvas serão descartadas."
          }
          confirmLabel="Restaurar padrão"
          danger
          onConfirm={confirmReset}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
      {confirm === "leave" ? (
        <ConfirmDialog
          title="Sair sem salvar?"
          message="As alterações feitas neste modelo serão perdidas."
          confirmLabel="Sair sem salvar"
          danger
          onConfirm={() => {
            setConfirm(null);
            onBack();
          }}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </form>
  );
}

const sectionTitle = { margin: 0, fontSize: 16, color: "var(--ui-primary)" } as const;
