"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Shield, User, Bell, Key, Building2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import styles from "./perfil.module.css";

export default function PerfilPage() {
  const [name, setName] = useState("Gabriel Pedro Sarges da Silva");
  const [email, setEmail] = useState("gpss@cesar.school");
  const [role, setRole] = useState("Administrador Geral & Gestor de Patrimônio");
  const [department, setDepartment] = useState("Diretoria de Patrimônio e Finanças");
  const [phone, setPhone] = useState("(81) 98877-6655");

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  }

  const permissions = [
    "Painel Geral (Visualização & Indicadores)",
    "Painel Financeiro (Receitas, Despesas, Saldo)",
    "Gestão de Documentos (Upload, Busca, Exclusão)",
    "Controle de Imóveis (Cadastro & Situação)",
    "Prestação de Contas (Ministério Público)",
    "Controle de Funcionários & Presença",
    "Estoque & Materiais (DML)",
    "Configurações Globais do Sistema",
  ];

  return (
    <AppShell>
      <div className={styles.profileContainer}>
        <div className={styles.headerBack}>
          <Link href="/" className={styles.backBtn}>
            <ArrowLeft size={16} /> Voltar ao Painel
          </Link>
        </div>

        <form onSubmit={handleSave} className={styles.profileCard}>
          <div className={styles.profileHero}>
            <div className={styles.avatarWrapper}>GS</div>
            <div className={styles.heroInfo}>
              <h1>{name}</h1>
              <span className={styles.heroRole}>
                <Shield size={14} /> {role}
              </span>
              <span className={styles.heroOrg}>
                <Building2 size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                Fundação Manuel Cruz • Instituição Filantrópica desde 1941
              </span>
            </div>
          </div>

          <h2 className={styles.sectionTitle}>
            <User size={18} /> Informações Pessoais e Cadastrais
          </h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Nome Completo</label>
              <input
                type="text"
                className={styles.formInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>E-mail Institucional</label>
              <input
                type="email"
                className={styles.formInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Cargo / Função</label>
              <input
                type="text"
                className={styles.formInput}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Departamento</label>
              <input
                type="text"
                className={styles.formInput}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Telefone / Contato</label>
              <input
                type="text"
                className={styles.formInput}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Identificador de Login (Auth)</label>
              <input type="text" className={styles.formInput} value="admin (Sessão Ativa)" disabled />
            </div>
          </div>

          <h2 className={styles.sectionTitle}>
            <Shield size={18} /> Permissões do Perfil
          </h2>
          <div className={styles.permissionsGrid}>
            {permissions.map((p) => (
              <div key={p} className={styles.permissionPill}>
                <span className={styles.permissionDot} />
                <span>{p}</span>
              </div>
            ))}
          </div>

          <h2 className={styles.sectionTitle}>
            <Bell size={18} /> Notificações e Alertas (BP10)
          </h2>
          <div className={styles.preferencesList}>
            <label className={styles.prefItem}>
              <div className={styles.prefInfo}>
                <strong>Alertas de Vencimento de Aluguel e Contratos</strong>
                <span>Receber e-mail quando um contrato estiver a 30 dias do vencimento</span>
              </div>
              <input
                type="checkbox"
                checked={deadlineReminders}
                onChange={(e) => setDeadlineReminders(e.target.checked)}
              />
            </label>

            <label className={styles.prefItem}>
              <div className={styles.prefInfo}>
                <strong>Alertas de Prestação de Contas (Ministério Público)</strong>
                <span>Notificar prazos de envio de relatórios e balancetes ao MP</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
              />
            </label>

            <label className={styles.prefItem}>
              <div className={styles.prefInfo}>
                <strong>Resumo Financeiro Semanal</strong>
                <span>Envio semanal consolidado com entradas, saídas e saldo operacional</span>
              </div>
              <input
                type="checkbox"
                checked={weeklyDigest}
                onChange={(e) => setWeeklyDigest(e.target.checked)}
              />
            </label>
          </div>

          <div className={styles.saveRow}>
            <Link href="/" className={styles.backBtn}>
              Cancelar
            </Link>
            <button type="submit" className={styles.saveBtn}>
              Salvar Alterações
            </button>
          </div>
        </form>

        {savedToast && (
          <div className={styles.toast}>
            <CheckCircle2 size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />
            Perfil e preferências atualizados com sucesso!
          </div>
        )}
      </div>
    </AppShell>
  );
}
