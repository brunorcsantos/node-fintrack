// src/routes/notifications.ts
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

// ── Helper para criar notificações — usado por outras rotas ──────────────────
export async function createNotification(data: {
  userId: string;
  type:
    | "invoice_due"
    | "budget_alert"
    | "recurring_pending"
    | "promotion"
    | "custom";
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  scheduledAt?: Date;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data ? (data.data as any) : undefined,
      scheduledAt: data.scheduledAt,
    },
  });
}

const security = [{ bearerAuth: [] }];

export async function notificationRoutes(app: FastifyInstance) {
  // GET /notifications — lista notificações do usuário (mais recentes primeiro)
  app.get(
    "/notifications",
    {
      schema: {
        tags: ["Notifications"],
        summary: "Listar notificações",
        security,
        querystring: z.object({
          unreadOnly: z.coerce
            .boolean()
            .default(false)
            .describe("Apenas não lidas"),
          limit: z.coerce.number().default(20).describe("Limite de resultados"),
        }),
      },
      onRequest: [authenticate],
    },
    async (req) => {
      const { sub: userId } = req.user as { sub: string };
      const { unreadOnly, limit } = req.query as {
        unreadOnly: boolean;
        limit: number;
      };

      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          ...(unreadOnly ? { read: false } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      const unreadCount = await prisma.notification.count({
        where: { userId, read: false },
      });

      return { notifications, unreadCount };
    },
  );

  // PUT /notifications/:id/read — marca uma notificação como lida
  app.put(
    "/notifications/:id/read",
    {
      schema: {
        tags: ["Notifications"],
        summary: "Marcar notificação como lida",
        security,
        params: z.object({ id: z.string().uuid() }),
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const { id } = req.params as { id: string };

      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });
      if (!notification)
        return reply.status(404).send({ error: "Notificação não encontrada." });

      return prisma.notification.update({
        where: { id },
        data: { read: true },
      });
    },
  );

  // PUT /notifications/read-all — marca todas como lidas
  app.put(
    "/notifications/read-all",
    {
      schema: {
        tags: ["Notifications"],
        summary: "Marcar todas como lidas",
        security,
      },
      onRequest: [authenticate],
    },
    async (req) => {
      const { sub: userId } = req.user as { sub: string };

      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });

      return { message: "Todas as notificações foram marcadas como lidas." };
    },
  );

  // DELETE /notifications/:id — remove uma notificação
  app.delete(
    "/notifications/:id",
    {
      schema: {
        tags: ["Notifications"],
        summary: "Remover notificação",
        security,
        params: z.object({ id: z.string().uuid() }),
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const { id } = req.params as { id: string };

      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });
      if (!notification)
        return reply.status(404).send({ error: "Notificação não encontrada." });

      await prisma.notification.delete({ where: { id } });
      return reply.status(204).send();
    },
  );

  // DELETE /notifications — remove todas as notificações lidas
  app.delete(
    "/notifications",
    {
      schema: {
        tags: ["Notifications"],
        summary: "Remover todas as notificações lidas",
        security,
      },
      onRequest: [authenticate],
    },
    async (req) => {
      const { sub: userId } = req.user as { sub: string };

      await prisma.notification.deleteMany({ where: { userId, read: true } });
      return { message: "Notificações lidas removidas." };
    },
  );
}
