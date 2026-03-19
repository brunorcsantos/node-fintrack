// src/routes/transactions.ts
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const createSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const listSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  categoryId: z.string().uuid().optional(),
  type: z.enum(["income", "expense"]).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

export async function transactionRoutes(app: FastifyInstance) {
  // GET /transactions
  app.get("/transactions", { onRequest: [authenticate] }, async (req) => {
    const { sub: userId } = req.user as { sub: string };
    const query = listSchema.parse(req.query);

    const where: any = { userId };

    if (query.month) {
      const [year, month] = query.month.split("-").map(Number);
      where.date = {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      };
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.type) where.type = query.type;

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true, subcategory: true },
        orderBy: { date: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  });

  // POST /transactions
  app.post("/transactions", { onRequest: [authenticate] }, async (req, reply) => {
    const { sub: userId } = req.user as { sub: string };
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const tx = await prisma.transaction.create({
      data: {
        ...parsed.data,
        date: new Date(parsed.data.date + "T12:00:00"),
        amount: parsed.data.amount,
        userId,
      },
      include: { category: true, subcategory: true },
    });

    return reply.status(201).send(tx);
  });

  // DELETE /transactions/:id
  app.delete("/transactions/:id", { onRequest: [authenticate] }, async (req, reply) => {
    const { sub: userId } = req.user as { sub: string };
    const { id } = req.params as { id: string };

    const tx = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!tx) return reply.status(404).send({ error: "Transação não encontrada." });

    await prisma.transaction.delete({ where: { id } });
    return reply.status(204).send();
  });

  // PUT /transactions/:id
  app.put("/transactions/:id", { onRequest: [authenticate] }, async (req, reply) => {
    const { sub: userId } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const parsed = createSchema.partial().safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const tx = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!tx) return reply.status(404).send({ error: "Transação não encontrada." });

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...parsed.data,
        date: parsed.data.date ? new Date(parsed.data.date + "T12:00:00") : undefined,
      },
      include: { category: true, subcategory: true },
    });

    return updated;
  });

  // GET /transactions/summary — aggregated data for charts
  app.get("/transactions/summary", { onRequest: [authenticate] }, async (req) => {
    const { sub: userId } = req.user as { sub: string };
    const { month } = req.query as { month?: string };

    const where: any = { userId };
    if (month) {
      const [year, m] = month.split("-").map(Number);
      where.date = { gte: new Date(year, m - 1, 1), lt: new Date(year, m, 1) };
    }

    const [byCategory, totals, monthly] = await Promise.all([
      // Sum by category
      prisma.transaction.groupBy({
        by: ["categoryId", "type"],
        where,
        _sum: { amount: true },
      }),
      // Total income / expense
      prisma.transaction.groupBy({
        by: ["type"],
        where,
        _sum: { amount: true },
      }),
      // Last 6 months evolution
      prisma.$queryRaw<{ month: string; type: string; total: number }[]>`
        SELECT 
          TO_CHAR(date, 'YYYY-MM') as month,
          type,
          SUM(amount)::float as total
        FROM "Transaction"
        WHERE "userId" = ${userId}
          AND date >= NOW() - INTERVAL '6 months'
        GROUP BY month, type
        ORDER BY month ASC
      `,
    ]);

    return { byCategory, totals, monthly };
  });
}
