// src/middleware/auth.ts
import { FastifyRequest, FastifyReply } from "fastify";
import "@fastify/jwt";

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    reply.status(401).send({ error: "Token inválido ou expirado." });
  }
}
