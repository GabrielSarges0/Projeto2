import type { UserRole } from "./financial-api";
import { useSession } from "./session";

/** Espelha as regras do backend (SecurityConfig + RecordService); o backend continua sendo quem decide. */
export type Permission =
  | "edit" // cadastros: financeiro, imóveis, lembretes, clientes, pastas, MP, funcionários, modelos
  | "delete"
  | "review" // aprovar justificativas, ajustar ponto
  | "team" // gestão de equipe e papéis
  | "staff"; // dia a dia: ponto, justificativa, retirada do estoque, enviar documento

const RULES: Record<Permission, UserRole[]> = {
  edit: ["GERENTE", "ADMINISTRADOR"],
  delete: ["GERENTE", "ADMINISTRADOR"],
  review: ["GERENTE", "ADMINISTRADOR"],
  team: ["GERENTE"],
  staff: ["GERENTE", "ADMINISTRADOR", "FUNCIONARIO"],
};

export function can(role: UserRole | undefined, permission: Permission): boolean {
  return role ? RULES[permission].includes(role) : false;
}

export function useCan(permission: Permission): boolean {
  return can(useSession()?.user.role, permission);
}

export function useRole(): UserRole | undefined {
  return useSession()?.user.role;
}
