"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Landmark } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { authApi, errorMessage } from "@/lib/financial-api";
import { saveSession } from "@/lib/session";
import { isValidEmail } from "@/lib/validation";
import styles from "@/app/login/login.module.css";

type Mode = "login" | "signup";
type Errors = Partial<Record<"name" | "email" | "password" | "confirm", string>>;

function safeNextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  // Só caminhos internos: evita redirecionamento aberto para outro site.
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const isSignup = mode === "signup";

  function validate(): Errors {
    const next: Errors = {};
    if (isSignup && name.trim().length < 3) next.name = "Informe seu nome (mínimo 3 letras).";
    if (!isValidEmail(email)) next.email = "Informe um e-mail válido.";
    if (password.length < 6) next.password = "A senha deve ter ao menos 6 caracteres.";
    if (isSignup && confirm !== password) next.confirm = "As senhas não conferem.";
    return next;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const response = await authApi.login(email.trim(), password, isSignup ? name.trim() : undefined);
      saveSession({ token: response.token, expiresAt: response.expiresAt, user: response.user });
      router.replace(safeNextPath());
    } catch (error) {
      setFormError(errorMessage(error, "Não foi possível entrar."));
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.brand} aria-label="Fundação Manuel Cruz">
        <span className={styles.brandMark} aria-hidden="true">
          <Landmark size={34} />
        </span>
        <h1>MANUEL CRUZ</h1>
        <p>Gestão de imóveis, finanças, documentos e prestação de contas da Fundação Manuel Cruz.</p>
      </section>

      <section className={styles.formSide}>
        <form className={styles.card} onSubmit={handleSubmit} noValidate>
          <h2 className={styles.title}>{isSignup ? "Cadastrar" : "Entrar"}</h2>
          <p className={styles.subtitle}>
            {isSignup ? "Crie seu acesso ao painel." : "Use seu e-mail e senha para acessar o painel."}
          </p>

          {isSignup ? (
            <Field label="Seu nome" error={errors.name} required>
              {(props) => (
                <input
                  {...props}
                  className="ui-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  maxLength={120}
                />
              )}
            </Field>
          ) : null}

          <Field label="E-mail" error={errors.email} required>
            {(props) => (
              <input
                {...props}
                className="ui-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                maxLength={160}
              />
            )}
          </Field>

          <Field label="Senha" error={errors.password} required hint={isSignup ? "Mínimo de 6 caracteres." : undefined}>
            {(props) => (
              <input
                {...props}
                className="ui-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignup ? "new-password" : "current-password"}
                maxLength={128}
              />
            )}
          </Field>

          {isSignup ? (
            <Field label="Confirmar senha" error={errors.confirm} required>
              {(props) => (
                <input
                  {...props}
                  className="ui-input"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  maxLength={128}
                />
              )}
            </Field>
          ) : (
            <div className={styles.row}>
              <button type="button" className="ui-link" onClick={() => setShowHelp((v) => !v)} aria-expanded={showHelp}>
                Esqueceu a senha?
              </button>
            </div>
          )}

          {showHelp && !isSignup ? (
            <p className="ui-alert ui-alert-info">
              Neste ambiente o acesso aceita qualquer conta: entre com seu e-mail e uma senha de 6 ou mais caracteres.
            </p>
          ) : null}

          {formError ? (
            <p className="ui-alert ui-alert-error" role="alert">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            className={`ui-btn ui-btn-primary ${styles.submit}`}
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? "Entrando..." : isSignup ? "Cadastrar e entrar" : "Entrar"}
          </button>

          <p className={styles.switch}>
            {isSignup ? (
              <>
                Já tem conta?{" "}
                <Link href="/login" className="ui-link">
                  Entrar
                </Link>
              </>
            ) : (
              <>
                Primeiro acesso?{" "}
                <Link href="/cadastro" className="ui-link">
                  Criar conta
                </Link>
              </>
            )}
          </p>
        </form>
      </section>
    </main>
  );
}
