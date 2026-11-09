import { z } from "zod";
import { clearSession, getAuthToken } from "./session";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// O Render (plano free) leva ~1 min para acordar; acima disso a requisição é dada como perdida.
const REQUEST_TIMEOUT_MS = 90_000;

const apiErrorBodySchema = z.object({
  message: z.string().optional(),
  fieldErrors: z.record(z.string(), z.string()).optional(),
});

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: Record<string, string> = {}
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor() {
    super("Sua sessão expirou. Entre novamente.", 401);
    this.name = "UnauthorizedError";
  }
}

export class NetworkError extends Error {
  constructor(message = "Servidor indisponível. Se for o primeiro acesso do dia, aguarde cerca de 1 minuto e tente de novo.") {
    super(message);
    this.name = "NetworkError";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function errorMessage(error: unknown, fallback = "Não foi possível concluir a operação."): string {
  if (error instanceof ApiError || error instanceof NetworkError) return error.message;
  return fallback;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Rotas públicas (login) não enviam token nem derrubam a sessão em 401. */
  anonymous?: boolean;
};

export async function apiRequest<T>(path: string, schema: z.ZodType<T>, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options);
  if (response.status === 204) {
    return schema.parse(undefined);
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ApiError("Resposta inválida do servidor.", response.status);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`Resposta fora do formato esperado em ${path}`, parsed.error.issues);
    }
    throw new ApiError("Resposta do servidor em formato inesperado.", response.status);
  }
  return parsed.data;
}

export async function apiRequestVoid(path: string, options: RequestOptions = {}): Promise<void> {
  await send(path, options);
}

async function send(path: string, { method = "GET", body, anonymous = false }: RequestOptions): Promise<Response> {
  const token = anonymous ? null : getAuthToken();
  if (!anonymous && !token) {
    clearSession();
    throw new UnauthorizedError();
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new NetworkError();
  }

  if (response.status === 401 && !anonymous) {
    clearSession();
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    let message = `Falha no servidor (HTTP ${response.status}).`;
    let fieldErrors: Record<string, string> = {};
    try {
      const parsed = apiErrorBodySchema.safeParse(await response.json());
      if (parsed.success) {
        fieldErrors = parsed.data.fieldErrors ?? {};
        message = Object.values(fieldErrors)[0] ?? parsed.data.message ?? message;
      }
    } catch {
      // Corpo sem JSON: mantém a mensagem com o código HTTP.
    }
    throw new ApiError(message, response.status, fieldErrors);
  }

  return response;
}
