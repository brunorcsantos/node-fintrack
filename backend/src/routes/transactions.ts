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
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  categoryId: z.string().uuid().optional(),
  type: z.enum(["income", "expense"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

const security = [{ bearerAuth: [] }];

export async function transactionRoutes(app: FastifyInstance) {
  // GET /transactions
  app.get(
    "/transactions",
    {
      schema: {
        tags: ["Transactions"],
        summary: "Listar transações",
        security,
        querystring: listSchema,
      },
      onRequest: [authenticate],
    },
    async (req) => {
      const { sub: userId } = req.user as { sub: string };
      const query = listSchema.parse(req.query);

      const where: any = { userId };

      if (query.month) {
        const [year, month] = query.month.split("-").map(Number);
        where.date = {
          gte: new Date(Date.UTC(year, month - 1, 1)),
          lt: new Date(Date.UTC(year, month, 1)),
        };
      }
      if (query.categoryId) where.categoryId = query.categoryId;
      if (query.type) where.type = query.type;
      if (query.search) {
        where.description = { contains: query.search, mode: "insensitive" };
      }

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
      console.log("query:", query);
      console.log("where:", where);
      return { data, total, page: query.page, limit: query.limit };
    },
  );

  // POST /transactions
  app.post(
    "/transactions",
    {
      schema: {
        tags: ["Transactions"],
        summary: "Criar transação",
        security,
        body: createSchema,
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success)
        return reply.status(400).send({ error: parsed.error.flatten() });

      const tx = await prisma.transaction.create({
        data: {
          ...parsed.data,
          date: new Date(parsed.data.date + "T12:00:00.000Z"),
          amount: parsed.data.amount,
          userId,
        },
        include: { category: true, subcategory: true },
      });

      return reply.status(201).send(tx);
    },
  );

  // DELETE /transactions/:id
  app.delete(
    "/transactions/:id",
    {
      schema: {
        tags: ["Transactions"],
        summary: "Remover transação",
        security,
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const { id } = req.params as { id: string };

      const tx = await prisma.transaction.findFirst({ where: { id, userId } });
      if (!tx)
        return reply.status(404).send({ error: "Transação não encontrada." });

      await prisma.transaction.delete({ where: { id } });
      return reply.status(204).send();
    },
  );

  // PUT /transactions/:id
  app.put(
    "/transactions/:id",
    {
      schema: {
        tags: ["Transactions"],
        summary: "Atualizar transação",
        security,
        body: createSchema.partial(),
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const { id } = req.params as { id: string };
      const parsed = createSchema.partial().safeParse(req.body);
      if (!parsed.success)
        return reply.status(400).send({ error: parsed.error.flatten() });

      const tx = await prisma.transaction.findFirst({ where: { id, userId } });
      if (!tx)
        return reply.status(404).send({ error: "Transação não encontrada." });

      const updated = await prisma.transaction.update({
        where: { id },
        data: {
          ...parsed.data,
          date: parsed.data.date
            ? new Date(parsed.data.date + "T12:00:00.000Z")
            : undefined,
        },
        include: { category: true, subcategory: true },
      });

      return updated;
    },
  );

  // GET /transactions/summary — aggregated data for charts
  app.get(
    "/transactions/summary",
    {
      schema: {
        tags: ["Transactions"],
        summary: "Resumo para gráficos",
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

      const where: any = { userId };
      if (month) {
        const [year, m] = month.split("-").map(Number);
        where.date = {
          gte: new Date(Date.UTC(year, m - 1, 1)),
          lt: new Date(Date.UTC(year, m, 1)),
        };
      }

      const [byCategory, totals, monthly] = await Promise.all([
        // Sum by category — respeita filtro de mês
        prisma.transaction.groupBy({
          by: ["categoryId", "type"],
          where,
          _sum: { amount: true },
        }),
        // Total income / expense — respeita filtro de mês
        prisma.transaction.groupBy({
          by: ["type"],
          where,
          _sum: { amount: true },
        }),
        // Evolução mensal — sempre últimos 6 meses, filtrado por userId
        prisma.transaction
          .groupBy({
            by: ["type"],
            where: {
              userId,
              date: {
                gte: new Date(new Date().setMonth(new Date().getMonth() - 5)),
              },
            },
            _sum: { amount: true },
          })
          .then(async () => {
            // Busca agrupada por mês usando Prisma
            const results = await prisma.$queryRaw<
              { month: string; type: string; total: number }[]
            >`
          SELECT
            TO_CHAR(date, 'YYYY-MM') as month,
            type,
            SUM(amount)::float as total
          FROM "Transaction"
          WHERE "userId" = ${userId}
            AND date >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
          GROUP BY month, type
          ORDER BY month ASC
        `;

            return results;
          }),
      ]);

      return { byCategory, totals, monthly };
    },
  );
}
