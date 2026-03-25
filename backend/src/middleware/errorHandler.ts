// src/middleware/errorHandler.ts
import { FastifyInstance, FastifyError } from "fastify";
import { ZodError } from "zod";
import { env } from "../lib/env";

/**
 * Handler global de erros do Fastify.
 *
 * Problemas anteriores:
 * - Erros não capturados devolviam stack traces completos para o cliente
 * - Erros de validação Zod chegavam em formato diferente dos erros de negócio
 * - Erros do Prisma (P2002, P2025) causavam 500 em vez de 409/404
 *
 * Formato padronizado de erro:
 * {
 *   error: string,        // mensagem legível para o usuário
 *   code?: string,        // código de erro para o frontend tratar programaticamente
 *   details?: unknown     // detalhes de validação (apenas em development)
 * }
 */

interface AppError {
  error: string;
  code?: string;
  details?: unknown;
}

// Códigos de erro do Prisma mais comuns
const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: "Registro duplicado — já existe um com esses dados." },
  P2025: { status: 404, message: "Registro não encontrado." },
  P2003: { status: 409, message: "Operação bloqueada por dados relacionados." },
  P2014: { status: 409, message: "Violação de relação obrigatória." },
};

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError & { code?: string }, req, reply) => {
    const isDev = env.NODE_ENV === "development";

    // Erros de validação Zod vindos do fastify-type-provider-zod
    if (error instanceof ZodError) {
      const details = error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return reply.status(422).send({
        error: "Dados inválidos na requisição.",
        code: "VALIDATION_ERROR",
        details: isDev ? details : undefined,
      } satisfies AppError);
    }

    // Erros do Prisma (client errors têm prefixo P)
    const prismaMatch =
      error.code && PRISMA_ERROR_MAP[error.code]
        ? PRISMA_ERROR_MAP[error.code]
        : null;

    if (prismaMatch) {
      return reply.status(prismaMatch.status).send({
        error: prismaMatch.message,
        code: error.code,
      } satisfies AppError);
    }

    // Erros HTTP conhecidos (lançados pelo código da aplicação)
    if (error.statusCode && error.statusCode < 500) {
      return reply.status(error.statusCode).send({
        error: error.message,
        code: error.code,
      } satisfies AppError);
    }

    // Erros 5xx — loga internamente, não expõe detalhes para o cliente
    req.log.error({ err: error, url: req.url, method: req.method }, "Erro interno não tratado");

    return reply.status(500).send({
      error: "Erro interno do servidor.",
      code: "INTERNAL_ERROR",
      // Stack trace apenas em desenvolvimento local
      details: isDev ? error.stack : undefined,
    } satisfies AppError);
  });

  // Handler para rotas não encontradas
  app.setNotFoundHandler((req, reply) => {
    return reply.status(404).send({
      error: `Rota ${req.method} ${req.url} não encontrada.`,
      code: "ROUTE_NOT_FOUND",
    } satisfies AppError);
  });
}
