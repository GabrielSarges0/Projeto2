"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { USER_ROLES, USER_ROLE_LABEL, errorMessage, usersApi, type TeamMember, type UserRole } from "@/lib/financial-api";
import { formatDateTime, normalizeText } from "@/lib/format";
import { useCan } from "@/lib/permissions";
import { useSession } from "@/lib/session";

const ROLE_HELP: Record<UserRole, string> = {
  GERENTE: "Tudo, inclusive papéis da equipe e exclusões.",
  ADMINISTRADOR: "Cadastra e edita em todos os módulos (financeiro, imóveis, clientes, documentos, MP, funcionários, estoque).",
  FUNCIONARIO: "Consulta tudo; registra ponto, envia justificativas e documentos e faz retiradas do estoque.",
};

export default function EquipePage() {
  const canManage = useCan("team");
  const session = useSession();
  const { show, node: toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [toggling, setToggling] = useState<TeamMember | null>(null);
  const [savingEmail, setSavingEmail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      setMembers(await usersApi.list());
    } catch (err) {
      setError(errorMessage(err, "Não foi possível carregar a equipe."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManage) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial vinda da API
    void load();
  }, [canManage, load]);

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    return members.filter(
      (member) => (roleFilter === "ALL" || member.role === roleFilter) && (!term || normalizeText(`${member.name} ${member.email}`).includes(term))
    );
  }, [members, search, roleFilter]);

  function replace(updated: TeamMember) {
    setMembers((current) => current.map((member) => (member.email === updated.email ? updated : member)));
  }

  async function changeRole(member: TeamMember, role: UserRole) {
    setSavingEmail(member.email);
    try {
      replace(await usersApi.changeRole(member.email, role));
      show(`${member.name} agora é ${USER_ROLE_LABEL[role]}.`);
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setSavingEmail(null);
    }
  }

  if (!canManage) {
    return (
      <AppShell>
        <section className="ui-page">
          <div className="ui-page-header">
            <h1>Gestão de equipe</h1>
          </div>
          <p className="ui-alert ui-alert-info">Só o Gerente acessa a gestão de equipe. Seu papel atual aparece no Perfil.</p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="ui-page" aria-labelledby="equipe-title">
        <div className="ui-page-header">
          <div>
            <h1 id="equipe-title">Gestão de equipe</h1>
            <p>Quem acessa o painel e o que cada pessoa pode alterar. Contas novas entram como Funcionário.</p>
          </div>
        </div>

        <div className="ui-stat-grid">
          {USER_ROLES.map((role) => (
            <div key={role} className="ui-card" style={{ display: "grid", gap: 4 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "var(--ui-primary)" }}>
                <ShieldCheck size={16} aria-hidden="true" /> {USER_ROLE_LABEL[role]} ({members.filter((m) => m.role === role && m.active).length})
              </span>
              <span className="ui-field-hint">{ROLE_HELP[role]}</span>
            </div>
          ))}
        </div>

        <div className="ui-toolbar">
          <div className="ui-field" style={{ flex: "2 1 220px" }}>
            <label htmlFor="equipe-busca">Buscar</label>
            <input id="equipe-busca" className="ui-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome ou e-mail" />
          </div>
          <div className="ui-field">
            <label htmlFor="equipe-papel">Papel</label>
            <select id="equipe-papel" className="ui-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as UserRole | "ALL")}>
              <option value="ALL">Todos</option>
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {USER_ROLE_LABEL[role]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {error}{" "}
            <button type="button" className="ui-link" onClick={() => void load()}>
              Tentar de novo
            </button>
          </p>
        ) : null}

        <div className="ui-table-wrap">
          <table className="ui-table">
            <caption className="sr-only">Membros da equipe</caption>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">E-mail</th>
                <th scope="col">Papel</th>
                <th scope="col">Situação</th>
                <th scope="col">Último acesso</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="ui-skeleton" style={{ height: 22 }} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ui-empty">
                    Ninguém encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((member) => {
                  const isMe = member.email === session?.user.username;
                  return (
                    <tr key={member.email}>
                      <td>
                        <strong>{member.name}</strong>
                        {isMe ? <span className="ui-field-hint"> (você)</span> : null}
                      </td>
                      <td style={{ wordBreak: "break-all" }}>{member.email}</td>
                      <td>
                        <label className="sr-only" htmlFor={`papel-${member.email}`}>
                          Papel de {member.name}
                        </label>
                        <select
                          id={`papel-${member.email}`}
                          className="ui-input"
                          style={{ minWidth: 150 }}
                          value={member.role}
                          disabled={isMe || !member.active || savingEmail === member.email}
                          title={isMe ? "Você não pode mudar o seu próprio papel" : undefined}
                          onChange={(e) => void changeRole(member, e.target.value as UserRole)}
                        >
                          {USER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {USER_ROLE_LABEL[role]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className={`ui-badge ${member.active ? "ui-badge-success" : "ui-badge-neutral"}`}>{member.active ? "Ativa" : "Desativada"}</span>
                      </td>
                      <td>{formatDateTime(member.lastLoginAt)}</td>
                      <td>
                        {!isMe ? (
                          <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => setToggling(member)}>
                            {member.active ? "Desativar" : "Reativar"}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {toggling ? (
        <ConfirmDialog
          title={toggling.active ? "Desativar conta" : "Reativar conta"}
          danger={toggling.active}
          confirmLabel={toggling.active ? "Desativar" : "Reativar"}
          message={
            toggling.active ? (
              <>
                <strong>{toggling.name}</strong> ({toggling.email}) perde o acesso ao painel na hora. Os registros feitos por essa conta continuam.
              </>
            ) : (
              <>
                <strong>{toggling.name}</strong> volta a acessar o painel com o papel {USER_ROLE_LABEL[toggling.role]}.
              </>
            )
          }
          onConfirm={async () => {
            replace(await usersApi.changeActive(toggling.email, !toggling.active));
            show(toggling.active ? `Conta de ${toggling.name} desativada.` : `Conta de ${toggling.name} reativada.`);
            setToggling(null);
          }}
          onCancel={() => setToggling(null)}
        />
      ) : null}
      {toast}
    </AppShell>
  );
}
