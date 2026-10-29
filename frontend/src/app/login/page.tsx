"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { basicAuthToken, saveAuthToken } from "@/lib/auth";
import { authApi } from "@/lib/financial-api";
import styles from "./login.module.css";

function safeNextPath(value: string | null) {
  // Só caminhos internos: evita redirecionar para outro site após o login.
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const token = basicAuthToken(username.trim(), password);
    try {
      await authApi.verify(token);
      saveAuthToken(token);
      router.replace(safeNextPath(searchParams.get("next")));
    } catch (cause) {
      // fetch rejeita com TypeError quando não há resposta (servidor fora do ar ou ainda acordando).
      setError(
        cause instanceof TypeError
          ? "Não foi possível conectar ao servidor. Tente de novo em instantes."
          : cause instanceof Error
            ? cause.message
            : "Não foi possível entrar."
      );
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
      <span className={styles.icon} aria-hidden="true">
        <LockKeyhole size={22} strokeWidth={1.8} />
      </span>
      <h1 className={styles.title}>Fundação Manuel Cruz</h1>
      <p className={styles.subtitle}>Entre para acessar o painel de gestão</p>

      <label className={styles.field}>
        <span>Usuário</span>
        <input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          disabled={submitting}
        />
      </label>

      <label className={styles.field}>
        <span>Senha</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={submitting}
        />
      </label>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <button className={styles.submit} type="submit" disabled={submitting || !username.trim() || !password}>
        {submitting ? "Entrando… (o servidor pode levar até 1 min para acordar)" : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
