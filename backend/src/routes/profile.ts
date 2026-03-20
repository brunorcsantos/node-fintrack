// src/routes/profile.ts
import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const security = [{ bearerAuth: [] }];

export async function profileRoutes(app: FastifyInstance) {
  // PUT /profile — atualiza nome e email
  app.put(
    "/profile",
    {
      schema: {
        tags: ["Profile"],
        summary: "Atualizar nome e e-mail",
        security,
        body: updateProfileSchema,
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success)
        return reply.status(400).send({ error: parsed.error.flatten() });

      const { name, email } = parsed.data;

      if (email) {
        const existing = await prisma.user.findFirst({
          where: { email, NOT: { id: userId } },
        });
        if (existing)
          return reply.status(409).send({ error: "E-mail já está em uso." });
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { ...(name && { name }), ...(email && { email }) },
        select: { id: true, name: true, email: true },
      });

      return user;
    },
  );

  // PUT /profile/password — altera senha
  app.put(
    "/profile/password",
    {
      schema: {
        tags: ["Profile"],
        summary: "Alterar senha",
        security,
        body: updatePasswordSchema,
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const parsed = updatePasswordSchema.safeParse(req.body);
      if (!parsed.success)
        return reply.status(400).send({ error: parsed.error.flatten() });

      const { currentPassword, newPassword } = parsed.data;

      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid)
        return reply.status(401).send({ error: "Senha atual incorreta." });

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      return { message: "Senha alterada com sucesso." };
    },
  );
}
