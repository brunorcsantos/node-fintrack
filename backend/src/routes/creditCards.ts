// src/routes/creditCards.ts
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { createNotification } from "./notifications";

const cardSchema = z.object({
  name: z.string().min(1).describe("Nome do cartão — ex: Nubank"),
  icon: z.string().default("💳").describe("Emoji do cartão"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#5A8FE8").describe("Cor em hex"),
  closingDay: z.number().min(1).max(31).describe("Dia de fechamento da fatura"),
  dueDay: z.number().min(1).max(31).describe("Dia de vencimento da fatura"),
  limit: z.number().min(0).optional().describe("Limite do cartão"),
  notifyDaysBefore: z.number().min(0).max(30).default(3).describe("Dias antes do vencimento para notificar"),
});

const txSchema = z.object({
  description: z.string().min(1).describe("Descrição da compra"),
  amount: z.number().positive().describe("Valor da compra"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Data da compra YYYY-MM-DD"),
  categoryId: z.string().uuid().describe("ID da categoria"),
  subcategoryId: z.string().uuid().optional().describe("ID da subcategoria"),
  notes: z.string().optional().describe("Observações"),
});

const security = [{ bearerAuth: [] }];

// ── Helper: calcula o mês da fatura com base na data da compra ────────────────
function getInvoiceMonth(purchaseDate: Date, closingDay: number): string {
  const day = purchaseDate.getUTCDate();
  const month = purchaseDate.getUTCMonth(); // 0-11
  const year = purchaseDate.getUTCFullYear();

  // Se a compra foi APÓS o fechamento → fatura do próximo mês
  if (day > closingDay) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    return `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}`;
  }

  // Se a compra foi ANTES ou NO dia do fechamento → fatura do mês atual
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

// ── Helper: calcula a data de vencimento da fatura ────────────────────────────
function getInvoiceDueDate(invoiceMonth: string, dueDay: number): Date {
  const [year, month] = invoiceMonth.split("-").map(Number);
  // Vencimento é no próprio mês da fatura
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(dueDay, lastDay);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export async function creditCardRoutes(app: FastifyInstance) {

  // ── GET /credit-cards ────────────────────────────────────────────────────
  app.get("/credit-cards", {
    schema: { tags: ["CreditCards"], summary: "Listar cartões ativos", security },
    onRequest: [authenticate],
  }, async (req) => {
    const { sub: userId } = req.user as { sub: string };
    return prisma.creditCard.findMany({
      where: { userId, active: true },
      orderBy: { name: "asc" },
    });
  });

  // ── POST /credit-cards ───────────────────────────────────────────────────
  app.post("/credit-cards", {
    schema: { tags: ["CreditCards"], summary: "Criar cartão", security, body: cardSchema },
    onRequest: [authenticate],
  }, async (req, reply) => {
    console.log("body recebido:", req.body);
    const { sub: userId } = req.user as { sub: string };
    const parsed = cardSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const card = await prisma.creditCard.create({
      data: { ...parsed.data, userId },
    });
    return reply.status(201).send(card);
  });

  // ── PUT /credit-cards/:id ────────────────────────────────────────────────
  app.put("/credit-cards/:id", {
    schema: { tags: ["CreditCards"], summary: "Atualizar cartão", security, body: cardSchema.partial() },
    onRequest: [authenticate],
  }, async (req, reply) => {
    const { sub: userId } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const parsed = cardSchema.partial().safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const card = await prisma.creditCard.findFirst({ where: { id, userId } });
    if (!card) return reply.status(404).send({ error: "Cartão não encontrado." });

    return prisma.creditCard.update({ where: { id }, data: parsed.data });
  });

  // ── DELETE /credit-cards/:id ─────────────────────────────────────────────
  app.delete("/credit-cards/:id", {
    schema: { tags: ["CreditCards"], summary: "Desativar cartão", security },
    onRequest: [authenticate],
  }, async (req, reply) => {
    const { sub: userId } = req.user as { sub: string };
    const { id } = req.params as { id: string };

    const card = await prisma.creditCard.findFirst({ where: { id, userId } });
    if (!card) return reply.status(404).send({ error: "Cartão não encontrado." });

    await prisma.creditCard.update({ where: { id }, data: { active: false } });
    return reply.status(204).send();
  });

  // ── GET /credit-cards/:id/transactions ───────────────────────────────────
  app.get("/credit-cards/:id/transactions", {
    schema: {
      tags: ["CreditCards"], summary: "Listar compras do cartão", security,
      querystring: z.object({
        month: z.string().regex(/^\d{4}-\d{2}$/).optional().describe("Mês da fatura YYYY-MM"),
      }),
    },
    onRequest: [authenticate],
  }, async (req, reply) => {
    const { sub: userId } = req.user as { sub: string };
    const { id: cardId } = req.params as { id: string };
    const { month } = req.query as { month?: string };

    const card = await prisma.creditCard.findFirst({ where: { id: cardId, userId } });
    if (!card) return reply.status(404).send({ error: "Cartão não encontrado." });

    return prisma.creditCardTransaction.findMany({
      where: { cardId, userId, ...(month ? { invoiceMonth: month } : {}) },
      include: { category: true, subcategory: true },
      orderBy: { date: "desc" },
    });
  });

  // ── POST /credit-cards/:id/transactions ──────────────────────────────────
  app.post("/credit-cards/:id/transactions", {
    schema: { tags: ["CreditCards"], summary: "Registrar compra no cartão", security, body: txSchema },
    onRequest: [authenticate],
  }, async (req, reply) => {
    const { sub: userId } = req.user as { sub: string };
    const { id: cardId } = req.params as { id: string };
    const parsed = txSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const card = await prisma.creditCard.findFirst({ where: { id: cardId, userId } });
    if (!card) return reply.status(404).send({ error: "Cartão não encontrado." });

    const purchaseDate = new Date(parsed.data.date + "T12:00:00.000Z");
    const invoiceMonth = getInvoiceMonth(purchaseDate, card.closingDay);
    const dueDate = getInvoiceDueDate(invoiceMonth, card.dueDay);

    // Cria a compra
    const tx = await prisma.creditCardTransaction.create({
      data: {
        ...parsed.data,
        date: purchaseDate,
        invoiceMonth,
        cardId,
        userId,
      },
      include: { category: true, subcategory: true },
    });

    // Upsert da fatura — recalcula o total
    const invoiceTotal = await prisma.creditCardTransaction.aggregate({
      where: { cardId, invoiceMonth },
      _sum: { amount: true },
    });

    await prisma.creditCardInvoice.upsert({
      where: { cardId_month: { cardId, month: invoiceMonth } },
      update: { totalAmount: invoiceTotal._sum.amount ?? 0, dueDate },
      create: {
        cardId, userId, month: invoiceMonth,
        dueDate, totalAmount: invoiceTotal._sum.amount ?? 0,
      },
    });

    // Cria notificação se fatura do próximo mês foi criada/atualizada
    const today = new Date();
    const [invYear, invMonth] = invoiceMonth.split("-").map(Number);
    const invoiceDate = new Date(Date.UTC(invYear, invMonth - 1, 1));
    const currentDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

    if (invoiceDate > currentDate) {
      await createNotification({
        userId,
        type: "invoice_due",
        title: `Compra lançada na fatura de ${new Date(invoiceDate).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
        message: `${parsed.data.description} — R$ ${parsed.data.amount.toFixed(2)} foi lançado na fatura do ${card.name}`,
        data: { cardId, invoiceMonth, amount: parsed.data.amount },
      });
    }

    return reply.status(201).send(tx);
  });

  // ── DELETE /credit-cards/:id/transactions/:txId ──────────────────────────
  app.delete("/credit-cards/:id/transactions/:txId", {
    schema: { tags: ["CreditCards"], summary: "Remover compra do cartão", security },
    onRequest: [authenticate],
  }, async (req, reply) => {
    const { sub: userId } = req.user as { sub: string };
    const { id: cardId, txId } = req.params as { id: string; txId: string };

    const tx = await prisma.creditCardTransaction.findFirst({ where: { id: txId, cardId, userId } });
    if (!tx) return reply.status(404).send({ error: "Compra não encontrada." });

    await prisma.creditCardTransaction.delete({ where: { id: txId } });

    // Recalcula o total da fatura
    const invoiceTotal = await prisma.creditCardTransaction.aggregate({
      where: { cardId, invoiceMonth: tx.invoiceMonth },
      _sum: { amount: true },
    });

    const total = Number(invoiceTotal._sum.amount ?? 0);
    if (total > 0) {
      await prisma.creditCardInvoice.update({
        where: { cardId_month: { cardId, month: tx.invoiceMonth } },
        data: { totalAmount: total },
      });
    } else {
      // Remove a fatura se não há mais compras
      await prisma.creditCardInvoice.deleteMany({
        where: { cardId, month: tx.invoiceMonth },
      });
    }

    return reply.status(204).send();
  });

  // ── GET /credit-cards/invoices ───────────────────────────────────────────
  app.get("/credit-cards/invoices", {
    schema: {
      tags: ["CreditCards"], summary: "Listar faturas", security,
      querystring: z.object({
        month: z.string().regex(/^\d{4}-\d{2}$/).optional().describe("Mês YYYY-MM"),
        unpaidOnly: z.coerce.boolean().default(false).describe("Apenas não pagas"),
      }),
    },
    onRequest: [authenticate],
  }, async (req) => {
    const { sub: userId } = req.user as { sub: string };
    const { month, unpaidOnly } = req.query as { month?: string; unpaidOnly: boolean };

    return prisma.creditCardInvoice.findMany({
      where: {
        userId,
        ...(month ? { month } : {}),
        ...(unpaidOnly ? { paid: false } : {}),
      },
      include: { card: true },
      orderBy: { dueDate: "asc" },
    });
  });

  // ── POST /credit-cards/invoices/:invoiceId/pay ───────────────────────────
  app.post("/credit-cards/invoices/:invoiceId/pay", {
    schema: {
      tags: ["CreditCards"], summary: "Pagar fatura", security,
      body: z.object({
        categoryId: z.string().uuid().describe("Categoria do lançamento"),
        subcategoryId: z.string().uuid().optional().describe("Subcategoria"),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Data do pagamento"),
      }),
    },
    onRequest: [authenticate],
  }, async (req, reply) => {
    const { sub: userId } = req.user as { sub: string };
    const { invoiceId } = req.params as { invoiceId: string };
    const { categoryId, subcategoryId, date } = req.body as {
      categoryId: string; subcategoryId?: string; date?: string;
    };

    const invoice = await prisma.creditCardInvoice.findFirst({
      where: { id: invoiceId, userId },
      include: { card: true },
    });
    if (!invoice) return reply.status(404).send({ error: "Fatura não encontrada." });
    if (invoice.paid) return reply.status(400).send({ error: "Fatura já paga." });

    const paymentDate = date
      ? new Date(date + "T12:00:00.000Z")
      : new Date();

    // Cria o lançamento de pagamento da fatura
    const tx = await prisma.transaction.create({
      data: {
        description: `Fatura ${invoice.card.name} — ${invoice.month}`,
        amount: invoice.totalAmount,
        type: "expense",
        date: paymentDate,
        categoryId,
        subcategoryId,
        userId,
        notes: `Pagamento da fatura do cartão ${invoice.card.name}`,
      },
      include: { category: true, subcategory: true },
    });

    // Marca fatura como paga
    await prisma.creditCardInvoice.update({
      where: { id: invoiceId },
      data: { paid: true, paidAt: paymentDate, transactionId: tx.id },
    });

    return reply.status(201).send(tx);
  });
}
