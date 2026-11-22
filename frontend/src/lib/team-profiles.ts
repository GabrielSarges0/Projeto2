import { z } from "zod";
import { isValidIsoDate } from "./format";
import { isValidCpf, isValidPhone, lengthError, personNameError } from "./validation";

/**
 * Ficha da equipe (dados pessoais e contrato). Fica na coleção "team-profiles", que o backend só
 * libera para o Gerente (leitura e escrita), porque guarda dados pessoais.
 */
export const teamProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  fullName: z.string().default(""),
  cpf: z.string().default(""),
  rg: z.string().default(""),
  birthDate: z.string().default(""),
  phone: z.string().default(""),
  address: z.string().default(""),
  position: z.string().default(""),
  admissionDate: z.string().default(""),
  emergencyContactName: z.string().default(""),
  emergencyContactPhone: z.string().default(""),
  notes: z.string().default(""),
  contractDocId: z.string().nullable().default(null),
  contractName: z.string().nullable().default(null),
  updatedAt: z.string().default(""),
});
export type TeamProfile = z.infer<typeof teamProfileSchema>;

/** Id estável a partir do e-mail (o backend só aceita letras, números, "-" e "_"): uma ficha por conta. */
export async function teamProfileId(email: string): Promise<string> {
  const bytes = new TextEncoder().encode(email.trim().toLowerCase());
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const hex = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `tm-${hex.slice(0, 40)}`;
}

export function emptyTeamProfile(id: string, email: string, fullName: string): TeamProfile {
  return teamProfileSchema.parse({ id, email, fullName });
}

export type TeamProfileErrors = Partial<Record<keyof TeamProfile, string>>;

/** Campos vazios são permitidos (a ficha é preenchida aos poucos); o que for preenchido precisa ser válido. */
export function validateTeamProfile(profile: TeamProfile, today: string): TeamProfileErrors {
  const errors: TeamProfileErrors = {};
  const nameError = profile.fullName.trim() ? personNameError(profile.fullName, "Nome completo") : "Informe o nome completo.";
  if (nameError) errors.fullName = nameError;
  if (profile.cpf && !isValidCpf(profile.cpf)) errors.cpf = "CPF inválido.";
  if (profile.phone && !isValidPhone(profile.phone)) errors.phone = "Telefone inválido.";
  if (profile.emergencyContactPhone && !isValidPhone(profile.emergencyContactPhone)) errors.emergencyContactPhone = "Telefone inválido.";
  if (profile.birthDate && (!isValidIsoDate(profile.birthDate) || profile.birthDate >= today)) errors.birthDate = "Data de nascimento inválida.";
  if (profile.admissionDate && (!isValidIsoDate(profile.admissionDate) || profile.admissionDate > today)) {
    errors.admissionDate = "A admissão não pode ser no futuro.";
  }
  const lengthChecks: Array<[keyof TeamProfile, string, number]> = [
    ["rg", "RG", 20],
    ["address", "Endereço", 200],
    ["position", "Cargo", 80],
    ["emergencyContactName", "Contato de emergência", 120],
    ["notes", "Observações", 1000],
  ];
  for (const [key, label, max] of lengthChecks) {
    const value = String(profile[key] ?? "");
    const error = value ? lengthError(value, label, 0, max) : null;
    if (error) errors[key] = error;
  }
  return errors;
}
