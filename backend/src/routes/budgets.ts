// src/routes/budgets.ts
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const upsertSchema = z.object({
  amount: z.number().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
});

export async function budgetRoutes(app: FastifyInstance) {
  // GET /budgets?month=2026-03
  app.get("/budgets", { onRequest: [authenticate] }, async (req) => {
    const { sub: userId } = req.user as { sub: string };
    const { month } = req.query as { month?: string };

    return prisma.budget.findMany({
      where: { userId, ...(month ? { month } : {}) },
      include: { category: true, subcategory: true },
    });
  });

  // PUT /budgets — upsert
  app.put("/budgets", { onRequest: [authenticate] }, async (req, reply) => {
    const { sub: userId } = req.user as { sub: string };
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const { amount, month, categoryId, subcategoryId } = parsed.data;

    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_subcategoryId_month: {
          userId,
          categoryId: categoryId ?? null,
          subcategoryId: subcategoryId ?? null,
          month,
        },
      },
      update: { amount },
      create: { amount, month, userId, categoryId, subcategoryId },
      include: { category: true, subcategory: true },
    });

    return budget;
  });

  // DELETE /budgets/:id
  app.delete("/budgets/:id", { onRequest: [authenticate] }, async (req, reply) => {
    const { sub: userId } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const budget = await prisma.budget.findFirst({ where: { id, userId } });
    if (!budget) return reply.status(404).send({ error: "Orçamento não encontrado." });
    await prisma.budget.delete({ where: { id } });
    return reply.status(204).send();
  });
}
