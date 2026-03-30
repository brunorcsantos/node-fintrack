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

      const where: Record<string, unknown> = { userId };

      if (query.month) {
        const [year, month] = query.month.split("-").map(Number);
        where.date = {
          gte: new Date(Date.UTC(year, month - 1, 1)),
          lt: new Date(Date.UTC(year, month, 1)),
        };
      }
      if (query.categoryId) where.categoryId = query.categoryId;
      if (query.type) where.type = query.type;

      // CORREÇÃO: busca também nas `notes`, não só na `description`.
      // CORREÇÃO: removidos os console.log que vazavam dados de query em produção.
      if (query.search) {
        where.OR = [
          { description: { contains: query.search, mode: "insensitive" } },
          { notes: { contains: query.search, mode: "insensitive" } },
        ];
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

  // GET /transactions/export
  app.get(
    "/transactions/export",
    {
      schema: {
        tags: ["Transactions"],
        summary: "Exportar transações em CSV",
        security,
        querystring: z.object({
          month: z
            .string()
            .regex(/^\d{4}-\d{2}$/)
            .optional(),
          categoryId: z.string().uuid().optional(),
          type: z.enum(["income", "expense"]).optional(),
          search: z.string().optional(),
        }),
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const { month, categoryId, type, search } = req.query as {
        month?: string;
        categoryId?: string;
        type?: "income" | "expense";
        search?: string;
      };

      const where: Record<string, unknown> = { userId };

      if (month) {
        const [year, m] = month.split("-").map(Number);
        where.date = {
          gte: new Date(Date.UTC(year, m - 1, 1)),
          lt: new Date(Date.UTC(year, m, 1)),
        };
      }
      if (categoryId) where.categoryId = categoryId;
      if (type) where.type = type;
      if (search) {
        where.OR = [
          { description: { contains: search, mode: "insensitive" } },
          { notes: { contains: search, mode: "insensitive" } },
        ];
      }

      const transactions = await prisma.transaction.findMany({
        where,
        include: { category: true, subcategory: true },
        orderBy: { date: "desc" },
      });

      // ── Monta CSV ─────────────────────────────────────────────────────────
      const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;

      const header = [
        "Data",
        "Descrição",
        "Tipo",
        "Categoria",
        "Subcategoria",
        "Valor (R$)",
        "Observações",
      ];

      const rows = transactions.map((tx) => [
        new Date(tx.date).toLocaleDateString("pt-BR"),
        escape(tx.description),
        tx.type === "income" ? "Receita" : "Despesa",
        escape(tx.category?.name ?? ""),
        escape(tx.subcategory?.name ?? ""),
        Number(tx.amount).toFixed(2).replace(".", ","),
        escape(tx.notes ?? ""),
      ]);

      const csv = [header.join(";"), ...rows.map((r) => r.join(";"))].join(
        "\r\n",
      );

      const filename = `fintrack-${month ?? "todas"}.csv`;

      reply
        .header("Content-Type", "text/csv; charset=utf-8")
        .header("Content-Disposition", `attachment; filename="${filename}"`)
        .send("\uFEFF" + csv); // BOM para Excel abrir com acentos corretamente
    },
  );

  // GET /transactions/summary
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

      const where: Record<string, unknown> = { userId };
      if (month) {
        const [year, m] = month.split("-").map(Number);
        where.date = {
          gte: new Date(Date.UTC(year, m - 1, 1)),
          lt: new Date(Date.UTC(year, m, 1)),
        };
      }

      const [byCategory, totals, monthly] = await Promise.all([
        prisma.transaction.groupBy({
          by: ["categoryId", "type"],
          where,
          _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
          by: ["type"],
          where,
          _sum: { amount: true },
        }),
        prisma.$queryRaw<{ month: string; type: string; total: number }[]>`
          SELECT
            TO_CHAR(date, 'YYYY-MM') as month,
            type,
            SUM(amount)::float as total
          FROM "Transaction"
          WHERE "userId" = ${userId}
            AND date >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
          GROUP BY month, type
          ORDER BY month ASC
        `,
      ]);

      return { byCategory, totals, monthly };
    },
  );
}
