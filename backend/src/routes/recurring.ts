// src/routes/recurring.ts
import { FastifyInstance } from "fastify";
import { optional, z } from "zod";
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
  creditCardId: z.string().uuid().optional().nullable(),
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
        include: { category: true, subcategory: true, creditCard: true },
        orderBy: { dayOfMonth: "asc" },
      });
    },
  );

  // GET /recurring/pending — apenas indeterminados com valor variável
  app.get(
    "/recurring/pending",
    {
      schema: {
        tags: ["Recurring"],
        summary: "Listar pendentes de confirmação (indeterminados)",
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
        where: { userId, active: true, mode: "indefinite" },
        include: { category: true, subcategory: true },
      });

      return recurring.filter((r) => {
        if (r.lastCreatedAt) {
          const last = new Date(r.lastCreatedAt);
          if (
            r.frequency === "monthly" &&
            last.getMonth() === currentMonth &&
            last.getFullYear() === currentYear
          )
            return false;
          if (r.frequency === "yearly" && last.getFullYear() === currentYear)
            return false;
        }
        const start = new Date(r.startDate);
        if (start > today) return false;
        if (r.endDate && new Date(r.endDate) < today) return false;
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
    },
  );

  // POST /recurring
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

      const data = parsed.data;

      if (data.mode === "installments") {
        if (!data.amount)
          return reply
            .status(400)
            .send({ error: "Valor é obrigatório para parcelas." });
        if (!data.installments)
          return reply
            .status(400)
            .send({ error: "Número de parcelas é obrigatório." });
      }

      // ── Valida se o cartão pertence ao usuário ─────────────────────────────
      if (data.creditCardId) {
        const card = await prisma.creditCard.findFirst({
          where: { id: data.creditCardId, userId },
        });
        if (!card)
          return reply.status(404).send({ error: "Cartão não encontrado." });
      }

      const r = await prisma.recurringTransaction.create({
        data: {
          description: data.description,
          amount: data.amount ?? null,
          type: data.type,
          categoryId: data.categoryId,
          subcategoryId: data.subcategoryId ?? null,
          frequency: data.frequency,
          dayOfMonth: data.dayOfMonth,
          startDate: new Date(data.startDate + "T12:00:00.000Z"),
          endDate: data.endDate
            ? new Date(data.endDate + "T12:00:00.000Z")
            : null,
          mode: data.mode,
          installments: data.installments ?? null,
          creditCardId: data.creditCardId ?? null, // ← NOVO
          userId,
        },
        include: { category: true, subcategory: true, creditCard: true }, // ← creditCard adicionado
      });

      // ── Modo parcelas: cria todas as transações de uma vez ─────────────────
      if (data.mode === "installments" && data.installments && data.amount) {
        const start = new Date(data.startDate + "T12:00:00.000Z");

        // ── COM cartão: cria CreditCardTransactions ────────────────────────
        if (data.creditCardId) {
          const card = await prisma.creditCard.findUniqueOrThrow({
            where: { id: data.creditCardId },
          });

          for (let i = 0; i < data.installments; i++) {
            const txDate = new Date(start);
            if (data.frequency === "monthly") {
              txDate.setUTCMonth(txDate.getUTCMonth() + i);
            } else {
              txDate.setUTCFullYear(txDate.getUTCFullYear() + i);
            }

            // Calcula o mês da fatura (respeita o dia de fechamento)
            const purchaseDay = txDate.getUTCDate();
            const month = txDate.getUTCMonth();
            const year = txDate.getUTCFullYear();
            let invoiceMonth: string;
            if (purchaseDay > card.closingDay) {
              const nextMonth = month === 11 ? 0 : month + 1;
              const nextYear = month === 11 ? year + 1 : year;
              invoiceMonth = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}`;
            } else {
              invoiceMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
            }

            const dueDay = card.dueDay;
            const [invYear, invMonth] = invoiceMonth.split("-").map(Number);
            const lastDay = new Date(
              Date.UTC(invYear, invMonth, 0),
            ).getUTCDate();
            const dueDayAdj = Math.min(dueDay, lastDay);
            const dueDate = new Date(
              Date.UTC(invYear, invMonth - 1, dueDayAdj, 12, 0, 0),
            );

            await prisma.creditCardTransaction.create({
              data: {
                description: `${data.description} (${i + 1}/${data.installments})`,
                amount: data.amount,
                date: txDate,
                invoiceMonth,
                cardId: data.creditCardId,
                userId,
                categoryId: data.categoryId,
                subcategoryId: data.subcategoryId ?? null,
              },
            });

            // Upsert da fatura
            const invoiceTotal = await prisma.creditCardTransaction.aggregate({
              where: { cardId: data.creditCardId, invoiceMonth },
              _sum: { amount: true },
            });
            await prisma.creditCardInvoice.upsert({
              where: {
                cardId_month: {
                  cardId: data.creditCardId,
                  month: invoiceMonth,
                },
              },
              update: { totalAmount: invoiceTotal._sum.amount ?? 0, dueDate },
              create: {
                cardId: data.creditCardId,
                userId,
                month: invoiceMonth,
                dueDate,
                totalAmount: invoiceTotal._sum.amount ?? 0,
              },
            });
          }
        } else {
          // ── SEM cartão: cria Transactions normais ──────────────────────────
          const transactions = [];
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
        }

        await prisma.recurringTransaction.update({
          where: { id: r.id },
          data: { active: false, lastCreatedAt: new Date() },
        });
      }

      return reply.status(201).send(r);
    },
  );

  // PUT /recurring/:id
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

      return prisma.recurringTransaction.update({
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
        include: { category: true, subcategory: true, creditCard: true },
      });
    },
  );

  // DELETE /recurring/:id
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

  // POST /recurring/process-card
  app.post(
    "/recurring/process-card",
    {
      schema: {
        tags: ["Recurring"],
        summary: "Processa recorrentes indefinite vinculados a cartão",
        security,
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const today = new Date();
      const currentMonth = today.getUTCMonth();
      const currentYear = today.getUTCFullYear();
      const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

      const recurringList = await prisma.recurringTransaction.findMany({
        where: {
          userId,
          active: true,
          mode: "indefinite",
          creditCardId: { not: null },
        },
        include: { creditCard: true },
      });

      const processed: string[] = [];

      for (const r of recurringList) {
        if (!r.creditCard || !r.creditCardId) continue;

        // Verifica se o dia de lançamento já chegou no mês atual
        if (today.getUTCDate() < r.dayOfMonth) continue;

        // Verifica se a startDate já passou
        if (new Date(r.startDate) > today) continue;

        // Verifica se endDate não passou
        if (r.endDate && new Date(r.endDate) < today) continue;

        // Verifica se já foi lançado este mês
        const lastCreated = r.lastCreatedAt ? new Date(r.lastCreatedAt) : null;
        if (
          lastCreated &&
          lastCreated.getUTCMonth() === currentMonth &&
          lastCreated.getUTCFullYear() === currentYear
        )
          continue;

        // Calcula a data de lançamento: usa o dayOfMonth no mês atual
        const lastDayOfMonth = new Date(
          Date.UTC(currentYear, currentMonth + 1, 0),
        ).getUTCDate();
        const launchDay = Math.min(r.dayOfMonth, lastDayOfMonth);
        const purchaseDate = new Date(
          Date.UTC(currentYear, currentMonth, launchDay, 12, 0, 0),
        );

        // Calcula o mês da fatura respeitando o closingDay
        const card = r.creditCard;
        let invoiceMonth: string;
        if (launchDay > card.closingDay) {
          const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
          const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
          invoiceMonth = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}`;
        } else {
          invoiceMonth = currentMonthStr;
        }

        // Calcula a data de vencimento da fatura
        const [invYear, invMonth] = invoiceMonth.split("-").map(Number);
        const lastDayInv = new Date(
          Date.UTC(invYear, invMonth, 0),
        ).getUTCDate();
        const dueDayAdj = Math.min(card.dueDay, lastDayInv);
        const dueDate = new Date(
          Date.UTC(invYear, invMonth - 1, dueDayAdj, 12, 0, 0),
        );

        // Cria a CreditCardTransaction
        await prisma.creditCardTransaction.create({
          data: {
            description: r.description,
            amount: r.amount ?? 0,
            date: purchaseDate,
            invoiceMonth,
            cardId: r.creditCardId,
            userId,
            categoryId: r.categoryId,
            subcategoryId: r.subcategoryId ?? null,
          },
        });

        // Upsert da fatura
        const invoiceTotal = await prisma.creditCardTransaction.aggregate({
          where: { cardId: r.creditCardId, invoiceMonth },
          _sum: { amount: true },
        });

        await prisma.creditCardInvoice.upsert({
          where: {
            cardId_month: { cardId: r.creditCardId, month: invoiceMonth },
          },
          update: { totalAmount: invoiceTotal._sum.amount ?? 0, dueDate },
          create: {
            cardId: r.creditCardId,
            userId,
            month: invoiceMonth,
            dueDate,
            totalAmount: invoiceTotal._sum.amount ?? 0,
          },
        });

        // Atualiza lastCreatedAt
        await prisma.recurringTransaction.update({
          where: { id: r.id },
          data: { lastCreatedAt: today },
        });

        processed.push(r.id);
      }

      return reply.send({ processed: processed.length, ids: processed });
    },
  );

  // POST /recurring/:id/confirm — apenas para modo indeterminado
  app.post(
    "/recurring/:id/confirm",
    {
      schema: {
        tags: ["Recurring"],
        summary: "Confirmar lançamento (modo indeterminado)",
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
      if (r.mode !== "indefinite")
        return reply.status(400).send({
          error:
            "Confirmação disponível apenas para recorrentes indeterminados.",
        });

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
