// src/routes/recurring.ts
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const recurringSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive().optional(),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
  frequency: z.enum(["monthly", "yearly"]),
  dayOfMonth: z.number().min(1).max(31),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

const confirmSchema = z.object({
  amount: z
    .number()
    .positive()
    .optional()
    .describe("Valor — sobrescreve o valor padrão"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe("Data do lançamento YYYY-MM-DD"),
});

const security = [{ bearerAuth: [] }];

export async function recurringRoutes(app: FastifyInstance) {
  // GET /recurring — lista todos os recorrentes do usuário
  app.get(
    "/recurring",
    {
      schema: {
        tags: ["Recurring"],
        summary: "Listar recorrentes ativos",
        security,
      },
      onRequest: [authenticate],
    },
    async (req) => {
      const { sub: userId } = req.user as { sub: string };
      return prisma.recurringTransaction.findMany({
        where: { userId, active: true },
        include: { category: true, subcategory: true },
        orderBy: { dayOfMonth: "asc" },
      });
    },
  );

  // GET /recurring/pending — lançamentos pendentes de confirmação
  app.get(
    "/recurring/pending",
    {
      schema: {
        tags: ["Recurring"],
        summary: "Listar pendentes de confirmação",
        security,
      },
      onRequest: [authenticate],
    },
    async (req) => {
      const { sub: userId } = req.user as { sub: string };
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const recurring = await prisma.recurringTransaction.findMany({
        where: { userId, active: true },
        include: { category: true, subcategory: true },
      });

      const pending = recurring.filter((r) => {
        // Verifica se já foi criado este mês/ano
        if (r.lastCreatedAt) {
          const last = new Date(r.lastCreatedAt);
          if (r.frequency === "monthly") {
            if (
              last.getMonth() === currentMonth &&
              last.getFullYear() === currentYear
            )
              return false;
          }
          if (r.frequency === "yearly") {
            if (last.getFullYear() === currentYear) return false;
          }
        }

        // Verifica se já passou da data de início
        const start = new Date(r.startDate);
        if (start > today) return false;

        // Verifica se não passou da data de fim
        if (r.endDate && new Date(r.endDate) < today) return false;

        // Verifica se já chegou o dia do mês
        if (r.frequency === "monthly" && today.getDate() >= r.dayOfMonth)
          return true;
        if (r.frequency === "yearly") {
          const startDate = new Date(r.startDate);
          if (
            today.getMonth() === startDate.getMonth() &&
            today.getDate() >= r.dayOfMonth
          )
            return true;
        }

        return false;
      });

      return pending;
    },
  );

  // POST /recurring — criar recorrente
  app.post(
    "/recurring",
    {
      schema: {
        tags: ["Recurring"],
        summary: "Criar recorrente",
        security,
        body: recurringSchema,
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const parsed = recurringSchema.safeParse(req.body);
      if (!parsed.success)
        return reply.status(400).send({ error: parsed.error.flatten() });

      const r = await prisma.recurringTransaction.create({
        data: {
          ...parsed.data,
          amount: parsed.data.amount ?? null,
          startDate: new Date(parsed.data.startDate + "T12:00:00.000Z"),
          endDate: parsed.data.endDate
            ? new Date(parsed.data.endDate + "T12:00:00.000Z")
            : null,
          userId,
        },
        include: { category: true, subcategory: true },
      });

      return reply.status(201).send(r);
    },
  );

  // PUT /recurring/:id — atualizar recorrente
  app.put(
    "/recurring/:id",
    {
      schema: {
        tags: ["Recurring"],
        summary: "Atualizar recorrente",
        security,
        body: recurringSchema.partial(),
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const { id } = req.params as { id: string };
      const parsed = recurringSchema.partial().safeParse(req.body);
      if (!parsed.success)
        return reply.status(400).send({ error: parsed.error.flatten() });

      const r = await prisma.recurringTransaction.findFirst({
        where: { id, userId },
      });
      if (!r)
        return reply.status(404).send({ error: "Recorrente não encontrado." });

      const updated = await prisma.recurringTransaction.update({
        where: { id },
        data: {
          ...parsed.data,
          startDate: parsed.data.startDate
            ? new Date(parsed.data.startDate + "T12:00:00.000Z")
            : undefined,
          endDate: parsed.data.endDate
            ? new Date(parsed.data.endDate + "T12:00:00.000Z")
            : undefined,
        },
        include: { category: true, subcategory: true },
      });

      return updated;
    },
  );

  // DELETE /recurring/:id — desativar recorrente
  app.delete(
    "/recurring/:id",
    {
      schema: {
        tags: ["Recurring"],
        summary: "Desativar recorrente",
        security,
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const { id } = req.params as { id: string };

      const r = await prisma.recurringTransaction.findFirst({
        where: { id, userId },
      });
      if (!r)
        return reply.status(404).send({ error: "Recorrente não encontrado." });

      await prisma.recurringTransaction.update({
        where: { id },
        data: { active: false },
      });
      return reply.status(204).send();
    },
  );

  // POST /recurring/:id/confirm — confirmar e criar o lançamento
  app.post(
    "/recurring/:id/confirm",
    {
      schema: {
        tags: ["Recurring"],
        summary: "Confirmar e criar lançamento",
        security,
        body: confirmSchema,
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const { id } = req.params as { id: string };
      const { amount, date } = req.body as z.infer<typeof confirmSchema>;

      const r = await prisma.recurringTransaction.findFirst({
        where: { id, userId },
      });
      if (!r)
        return reply.status(404).send({ error: "Recorrente não encontrado." });

      const txDate = date ? new Date(date + "T12:00:00.000Z") : new Date();

      const tx = await prisma.transaction.create({
        data: {
          description: r.description,
          amount: amount ?? Number(r.amount) ?? 0,
          type: r.type,
          date: txDate,
          categoryId: r.categoryId,
          subcategoryId: r.subcategoryId ?? undefined,
          userId,
        },
        include: { category: true, subcategory: true },
      });

      // Atualiza lastCreatedAt
      await prisma.recurringTransaction.update({
        where: { id },
        data: { lastCreatedAt: new Date() },
      });

      return reply.status(201).send(tx);
    },
  );
}
