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

const security = [{ bearerAuth: [] }];

export async function budgetRoutes(app: FastifyInstance) {
  // GET /budgets?month=2026-03
  app.get(
    "/budgets",
    {
      schema: {
        tags: ["Budgets"],
        summary: "Listar orçamentos",
        security,
        querystring: z.object({
          month: z.string().optional().describe("Mês YYYY-MM"),
        }),
      },
      onRequest: [authenticate],
    },
    async (req) => {
      const { sub: userId } = req.user as { sub: string };
      const { month } = req.query as { month?: string };

      return prisma.budget.findMany({
        where: { userId, ...(month ? { month } : {}) },
        include: { category: true, subcategory: true },
      });
    },
  );

  // PUT /budgets — upsert
  app.put(
    "/budgets",
    {
      schema: {
        tags: ["Budgets"],
        summary: "Criar ou atualizar orçamento",
        security,
        body: upsertSchema,
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const parsed = upsertSchema.safeParse(req.body);
      if (!parsed.success)
        return reply.status(400).send({ error: parsed.error.flatten() });

      const { amount, month, categoryId, subcategoryId } = parsed.data;

      // CORREÇÃO: O Prisma não aceita null em chaves únicas compostas no `where`
      // do upsert. A constraint `@@unique([userId, categoryId, subcategoryId, month])`
      // no banco usa NULL, mas Prisma exige que os campos opcionais sejam omitidos
      // ou tratados com `deleteMany + create` quando o valor é null/undefined.
      //
      // Estratégia: busca o registro existente primeiro, depois atualiza ou cria.
      // Isso evita o erro "Value null is not valid" do Prisma no upsert composto.
      const existing = await prisma.budget.findFirst({
        where: {
          userId,
          month,
          categoryId: categoryId ?? null,
          subcategoryId: subcategoryId ?? null,
        },
      });

      if (existing) {
        const budget = await prisma.budget.update({
          where: { id: existing.id },
          data: { amount },
          include: { category: true, subcategory: true },
        });
        return budget;
      }

      const budget = await prisma.budget.create({
        data: {
          amount,
          month,
          userId,
          categoryId: categoryId ?? null,
          subcategoryId: subcategoryId ?? null,
        },
        include: { category: true, subcategory: true },
      });

      return reply.status(201).send(budget);
    },
  );

  // DELETE /budgets/:id
  app.delete(
    "/budgets/:id",
    {
      schema: { tags: ["Budgets"], summary: "Remover orçamento", security },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const { id } = req.params as { id: string };
      const budget = await prisma.budget.findFirst({ where: { id, userId } });
      if (!budget)
        return reply.status(404).send({ error: "Orçamento não encontrado." });
      await prisma.budget.delete({ where: { id } });
      return reply.status(204).send();
    },
  );
}