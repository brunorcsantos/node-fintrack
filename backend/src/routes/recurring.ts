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
  mode: z
    .enum(["indefinite", "installments"])
    .default("indefinite")
    .describe("Modo: indeterminado ou parcelas"),
  installments: z
    .number()
    .min(2)
    .optional()
    .describe("Número de parcelas (apenas para modo parcelas)"),
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

   // GET /recurring
  app.get("/recurring", {
    schema: { tags: ["Recurring"], summary: "Listar recorrentes ativos", security },
    onRequest: [authenticate],
  }, async (req) => {
    const { sub: userId } = req.user as { sub: string };
    return prisma.recurringTransaction.findMany({
      where: { userId, active: true },
      include: { category: true, subcategory: true },
      orderBy: { dayOfMonth: "asc" },
    });
  });

  // GET /recurring/pending — apenas indeterminados com valor variável
  app.get("/recurring/pending", {
    schema: { tags: ["Recurring"], summary: "Listar pendentes de confirmação (indeterminados)", security },
    onRequest: [authenticate],
  }, async (req) => {
    const { sub: userId } = req.user as { sub: string };
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
 
    const recurring = await prisma.recurringTransaction.findMany({
      where: { userId, active: true, mode: "indefinite" },
      include: { category: true, subcategory: true },
    });
 
    return recurring.filter((r) => {
      if (r.lastCreatedAt) {
        const last = new Date(r.lastCreatedAt);
        if (r.frequency === "monthly" && last.getMonth() === currentMonth && last.getFullYear() === currentYear) return false;
        if (r.frequency === "yearly" && last.getFullYear() === currentYear) return false;
      }
      const start = new Date(r.startDate);
      if (start > today) return false;
      if (r.endDate && new Date(r.endDate) < today) return false;
      if (r.frequency === "monthly" && today.getDate() >= r.dayOfMonth) return true;
      if (r.frequency === "yearly") {
        const startDate = new Date(r.startDate);
        if (today.getMonth() === startDate.getMonth() && today.getDate() >= r.dayOfMonth) return true;
      }
      return false;
    });
  });

  // POST /recurring
  app.post("/recurring", {
    schema: { tags: ["Recurring"], summary: "Criar recorrente", security, body: recurringSchema },
    onRequest: [authenticate],
  }, async (req, reply) => {
    const { sub: userId } = req.user as { sub: string };
    const parsed = recurringSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
 
    const data = parsed.data;
 
    // Validações por modo
    if (data.mode === "installments") {
      if (!data.amount) return reply.status(400).send({ error: "Valor é obrigatório para parcelas." });
      if (!data.installments) return reply.status(400).send({ error: "Número de parcelas é obrigatório." });
    }
 
    // Cria o recorrente
    const r = await prisma.recurringTransaction.create({
      data: {
        description: data.description,
        amount: data.amount ?? null,
        type: data.type,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        frequency: data.frequency,
        dayOfMonth: data.dayOfMonth,
        startDate: new Date(data.startDate + "T12:00:00.000Z"),
        endDate: data.endDate ? new Date(data.endDate + "T12:00:00.000Z") : null,
        mode: data.mode,
        installments: data.installments ?? null,
        userId,
      },
      include: { category: true, subcategory: true },
    });
 
    // Modo parcelas: cria todas as transações de uma vez
    if (data.mode === "installments" && data.installments && data.amount) {
      const transactions = [];
      const start = new Date(data.startDate + "T12:00:00.000Z");
 
      for (let i = 0; i < data.installments; i++) {
        const txDate = new Date(start);
        if (data.frequency === "monthly") {
          txDate.setUTCMonth(txDate.getUTCMonth() + i);
        } else {
          txDate.setUTCFullYear(txDate.getUTCFullYear() + i);
        }
 
        transactions.push({
          description: `${data.description} (${i + 1}/${data.installments})`,
          amount: data.amount,
          type: data.type,
          date: txDate,
          categoryId: data.categoryId,
          subcategoryId: data.subcategoryId ?? null,
          userId,
        });
      }
 
      await prisma.transaction.createMany({ data: transactions });
 
      // Marca como inativo pois todas as parcelas já foram criadas
      await prisma.recurringTransaction.update({
        where: { id: r.id },
        data: { active: false, lastCreatedAt: new Date() },
      });
    }
 
    return reply.status(201).send(r);
  });

  // PUT /recurring/:id
  app.put("/recurring/:id", {
    schema: { tags: ["Recurring"], summary: "Atualizar recorrente", security, body: recurringSchema.partial() },
    onRequest: [authenticate],
  }, async (req, reply) => {
    const { sub: userId } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const parsed = recurringSchema.partial().safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
 
    const r = await prisma.recurringTransaction.findFirst({ where: { id, userId } });
    if (!r) return reply.status(404).send({ error: "Recorrente não encontrado." });
 
    return prisma.recurringTransaction.update({
      where: { id },
      data: {
        ...parsed.data,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate + "T12:00:00.000Z") : undefined,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate + "T12:00:00.000Z") : undefined,
      },
      include: { category: true, subcategory: true },
    });
  });

  // DELETE /recurring/:id
  app.delete("/recurring/:id", {
    schema: { tags: ["Recurring"], summary: "Desativar recorrente", security },
    onRequest: [authenticate],
  }, async (req, reply) => {
    const { sub: userId } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const r = await prisma.recurringTransaction.findFirst({ where: { id, userId } });
    if (!r) return reply.status(404).send({ error: "Recorrente não encontrado." });
    await prisma.recurringTransaction.update({ where: { id }, data: { active: false } });
    return reply.status(204).send();
  });

  // POST /recurring/:id/confirm — apenas para modo indeterminado
  app.post("/recurring/:id/confirm", {
    schema: { tags: ["Recurring"], summary: "Confirmar lançamento (modo indeterminado)", security, body: confirmSchema },
    onRequest: [authenticate],
  }, async (req, reply) => {
    const { sub: userId } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const { amount, date } = req.body as z.infer<typeof confirmSchema>;
 
    const r = await prisma.recurringTransaction.findFirst({ where: { id, userId } });
    if (!r) return reply.status(404).send({ error: "Recorrente não encontrado." });
    if (r.mode !== "indefinite") return reply.status(400).send({ error: "Confirmação disponível apenas para recorrentes indeterminados." });
 
    const tx = await prisma.transaction.create({
      data: {
        description: r.description,
        amount: amount ?? Number(r.amount) ?? 0,
        type: r.type,
        date: date ? new Date(date + "T12:00:00.000Z") : new Date(),
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
