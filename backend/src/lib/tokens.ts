// src/lib/tokens.ts
import { FastifyInstance } from "fastify";

/**
 * Utilitários para geração e verificação de tokens JWT.
 *
 * Arquitetura de dois tokens:
 * - Access token: curta duração (15min), usado em todas as requests
 * - Refresh token: longa duração (30 dias), usado APENAS para renovar o access token
 *
 * O @fastify/jwt não suporta secret por chamada — a solução correta é registrar
 * duas instâncias do plugin com namespaces distintos via decorador.
 * O server.ts registra:
 *   app.register(jwt, { secret: env.JWT_SECRET, namespace: "access" })
 *   app.register(jwt, { secret: env.JWT_REFRESH_SECRET, namespace: "refresh" })
 *
 * Isso expõe app.accessJwt e app.refreshJwt como decoradores separados.
 *
 * Segurança:
 * - Refresh tokens são persistidos no banco (tabela RefreshToken)
 * - Cada uso gera um novo refresh token (rotação) — tokens usados são revogados
 * - Reutilização de refresh token revoga toda a sessão do usuário
 */

export const TOKEN_EXPIRY = {
  access: "15m",
  refresh: "30d",
} as const;

export function generateAccessToken(
  app: FastifyInstance,
  payload: { sub: string; email: string },
): string {
  return (app as FastifyInstance & { accessJwt: { sign: (p: object, o: object) => string } })
    .accessJwt.sign(payload, { expiresIn: TOKEN_EXPIRY.access });
}

export function generateRefreshToken(
  app: FastifyInstance,
  payload: { sub: string },
): string {
  return (app as FastifyInstance & { refreshJwt: { sign: (p: object, o: object) => string } })
    .refreshJwt.sign(payload, { expiresIn: TOKEN_EXPIRY.refresh });
}

export function verifyRefreshToken(
  app: FastifyInstance,
  token: string,
): { sub: string } {
  return (app as FastifyInstance & { refreshJwt: { verify: (t: string) => unknown } })
    .refreshJwt.verify(token) as { sub: string };
}