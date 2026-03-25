// src/lib/rateLimit.ts
import { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { env } from "./env";

/**
 * Configura dois níveis de rate limiting:
 *
 * 1. Limite global: protege todas as rotas contra abuso geral
 *    Padrão: 100 req / 60s por IP
 *
 * 2. Limite de autenticação: protege /auth/login e /auth/register
 *    contra brute force e credential stuffing
 *    Padrão: 10 req / 15min por IP
 *
 * Os valores são configuráveis via variáveis de ambiente para facilitar
 * ajuste em produção sem redeploy.
 *
 * Instalação necessária: npm install @fastify/rate-limit
 */
export async function registerRateLimit(app: FastifyInstance) {
  await app.register(rateLimit, {
    global: true,
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    // Usa o IP real mesmo atrás de proxy reverso (Nginx, Cloudflare)
    keyGenerator: (req) => {
      return (
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.headers["x-real-ip"] as string ||
        req.ip
      );
    },
    // Resposta padronizada igual ao errorHandler
    errorResponseBuilder: (_req, context) => ({
      error: "Muitas requisições. Tente novamente em alguns instantes.",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: context.after,
    }),
    // Não loga rate limit hits como erro — é comportamento esperado
    addHeaders: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
      "retry-after": true,
    },
  });
}

/**
 * Opções de rate limit para as rotas de autenticação.
 * Aplicadas diretamente no schema da rota:
 *
 * app.post("/auth/login", {
 *   config: authRateLimitConfig,
 *   ...
 * })
 */
export const authRateLimitConfig = {
  rateLimit: {
    max: (env as typeof env & { AUTH_RATE_LIMIT_MAX: number }).AUTH_RATE_LIMIT_MAX,
    timeWindow: (env as typeof env & { AUTH_RATE_LIMIT_WINDOW_MS: number }).AUTH_RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder: (_req: unknown, context: { after: string }) => ({
      error: "Muitas tentativas de login. Tente novamente em 15 minutos.",
      code: "AUTH_RATE_LIMIT_EXCEEDED",
      retryAfter: context.after,
    }),
  },
};
