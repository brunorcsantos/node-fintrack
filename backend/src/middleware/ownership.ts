// src/middleware/ownership.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";

/**
 * Guards de ownership por recurso.
 *
 * Problema anterior: cada rota fazia seu próprio `findFirst({ where: { id, userId } })`
 * e algumas esqueciam o `userId` — qualquer usuário autenticado podia acessar
 * recursos de outros (IDOR — Insecure Direct Object Reference).
 *
 * Uso:
 *   onRequest: [authenticate, ownershipGuards.transaction]
 *
 * O guard extrai o `id` de `req.params`, verifica que o recurso pertence
 * ao usuário autenticado, e lança 404 se não pertencer (não 403 — não
 * confirmamos nem a existência do recurso para outros usuários).
 */

type GuardFn = (req: FastifyRequest, reply: FastifyReply) => Promise<void>;

function makeGuard(
  tableName: string,
  finder: (id: string, userId: string) => Promise<unknown>,
): GuardFn {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const { sub: userId } = req.user as { sub: string };
    const { id } = req.params as { id: string };

    if (!id) return; // rota sem parâmetro :id — não aplica

    const record = await finder(id, userId);

    if (!record) {
      return reply.status(404).send({
        error: `${tableName} não encontrado.`,
      });
    }

    // Armazena o recurso no contexto da request para evitar segunda consulta
    (req as FastifyRequest & { resource: unknown }).resource = record;
  };
}

export const ownershipGuards = {
  transaction: makeGuard("Transação", (id, userId) =>
    prisma.transaction.findFirst({ where: { id, userId } }),
  ),

  budget: makeGuard("Orçamento", (id, userId) =>
    prisma.budget.findFirst({ where: { id, userId } }),
  ),

  category: makeGuard("Categoria", (id, userId) =>
    prisma.category.findFirst({ where: { id, userId } }),
  ),

  recurring: makeGuard("Recorrente", (id, userId) =>
    prisma.recurringTransaction.findFirst({ where: { id, userId } }),
  ),

  notification: makeGuard("Notificação", (id, userId) =>
    prisma.notification.findFirst({ where: { id, userId } }),
  ),

  creditCard: makeGuard("Cartão", (id, userId) =>
    prisma.creditCard.findFirst({ where: { id, userId } }),
  ),

  creditCardInvoice: makeGuard("Fatura", (id, userId) =>
    prisma.creditCardInvoice.findFirst({ where: { id, userId } }),
  ),
};

/**
 * Tipo helper para acessar o recurso verificado dentro do handler,
 * sem fazer uma segunda consulta ao banco.
 *
 * Uso dentro do handler:
 *   const tx = getResource<Transaction>(req);
 */
export function getResource<T>(req: FastifyRequest): T {
  return (req as FastifyRequest & { resource: T }).resource;
}
