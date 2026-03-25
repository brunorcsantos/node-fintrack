// src/middleware/auth.ts
import { FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    accessVerify(): Promise<void>;
  }
}

/**
 * Verifica o access token usando o namespace "access" registrado no server.ts.
 * O @fastify/jwt com namespace expõe req.accessVerify() em vez de req.jwtVerify().
 */
export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.accessVerify();
  } catch {
    reply.status(401).send({ error: "Token inválido ou expirado." });
  }
}