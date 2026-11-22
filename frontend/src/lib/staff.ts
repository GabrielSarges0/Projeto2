import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { apiRequest, errorMessage } from "./api-client";
import { attendanceSchema, justificationSchema, type Attendance, type Justification } from "./schemas";

/**
 * Autoatendimento do ponto (StaffController.java). As coleções de pessoal só são lidas por Gerente/Administrador;
 * aqui vêm só nome e função da equipe e, com o CPF conferido no servidor, os registros do próprio funcionário.
 */
export const staffMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
});
export type StaffMember = z.infer<typeof staffMemberSchema>;

const selfServiceResponseSchema = z.object({
  employee: staffMemberSchema,
  attendance: z.array(z.unknown()),
  justifications: z.array(z.unknown()),
});

export type StaffSelfService = {
  employee: StaffMember;
  attendance: Attendance[];
  justifications: Justification[];
};

// Registro fora do formato é ignorado, como em fetchRecords, para um dado antigo não travar a tela.
function parseEach<T>(values: unknown[], schema: z.ZodType<T>): T[] {
  return values.flatMap((value) => {
    const parsed = schema.safeParse(value);
    return parsed.success ? [parsed.data] : [];
  });
}

export const staffApi = {
  directory: () => apiRequest("/api/v1/staff/directory", z.array(staffMemberSchema)),
  async selfService(employeeId: string, cpf: string): Promise<StaffSelfService> {
    const response = await apiRequest(`/api/v1/staff/${encodeURIComponent(employeeId)}/self`, selfServiceResponseSchema, {
      method: "POST",
      body: { cpf },
    });
    return {
      employee: response.employee,
      attendance: parseEach(response.attendance, attendanceSchema),
      justifications: parseEach(response.justifications, justificationSchema),
    };
  },
};

/** Nomes e funções da equipe ativa (lista do ponto, responsável no estoque), sem CPF. */
export function useStaffDirectory() {
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setMembers(await staffApi.directory());
    } catch (err) {
      setError(errorMessage(err, "Não foi possível carregar a lista de funcionários."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial vinda da API
    void load();
  }, [load]);

  return { members, loading, error, reload: load };
}
