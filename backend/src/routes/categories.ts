// src/routes/categories.ts
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const categorySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  icon: z.string(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

const subcategorySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  icon: z.string(),
});

const security = [{ bearerAuth: [] }];

export async function categoryRoutes(app: FastifyInstance) {
  // GET /categories — list with subcategories
  app.get(
    "/categories",
    {
      schema: {
        tags: ["Categories"],
        summary: "Listar categorias com subcategorias",
        security,
      },
      onRequest: [authenticate],
    },
    async (req) => {
      const { sub: userId } = req.user as { sub: string };
      return prisma.category.findMany({
        where: { userId },
        include: { subcategories: true },
        orderBy: { name: "asc" },
      });
    },
  );

  // POST /categories
  app.post(
    "/categories",
    {
      schema: {
        tags: ["Categories"],
        summary: "Criar categoria",
        security,
        body: categorySchema,
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const parsed = categorySchema.safeParse(req.body);
      if (!parsed.success)
        return reply.status(400).send({ error: parsed.error.flatten() });

      const cat = await prisma.category.create({
        data: { ...parsed.data, userId },
        include: { subcategories: true },
      });
      return reply.status(201).send(cat);
    },
  );

  // PUT /categories/:id
  app.put(
    "/categories/:id",
    {
      schema: {
        tags: ["Categories"],
        summary: "Atualizar categoria",
        security,
        body: categorySchema.partial(),
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const { id } = req.params as { id: string };
      const parsed = categorySchema.partial().safeParse(req.body);
      if (!parsed.success)
        return reply.status(400).send({ error: parsed.error.flatten() });

      const cat = await prisma.category.findFirst({ where: { id, userId } });
      if (!cat)
        return reply.status(404).send({ error: "Categoria não encontrada." });

      return prisma.category.update({
        where: { id },
        data: parsed.data,
        include: { subcategories: true },
      });
    },
  );

  // DELETE /categories/:id
  app.delete(
    "/categories/:id",
    {
      schema: { tags: ["Categories"], summary: "Remover categoria", security },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const { id } = req.params as { id: string };
      const cat = await prisma.category.findFirst({ where: { id, userId } });
      if (!cat)
        return reply.status(404).send({ error: "Categoria não encontrada." });

      const inUse = await prisma.transaction.count({
        where: { categoryId: id },
      });
      if (inUse > 0)
        return reply.status(409).send({
          error: `Esta categoria possui ${inUse} lançamento(s) vinculado(s) e não pode ser removida.`,
        });

      await prisma.category.delete({ where: { id } });
      return reply.status(204).send();
    },
  );

  // POST /categories/:id/subcategories
  app.post(
    "/categories/:id/subcategories",
    {
      schema: {
        tags: ["Categories"],
        summary: "Criar subcategoria",
        security,
        body: subcategorySchema,
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const { id: categoryId } = req.params as { id: string };
      const parsed = subcategorySchema.safeParse(req.body);
      if (!parsed.success)
        return reply.status(400).send({ error: parsed.error.flatten() });

      const cat = await prisma.category.findFirst({
        where: { id: categoryId, userId },
      });
      if (!cat)
        return reply.status(404).send({ error: "Categoria não encontrada." });

      const sub = await prisma.subcategory.create({
        data: { ...parsed.data, categoryId },
      });
      return reply.status(201).send(sub);
    },
  );

  // DELETE /categories/:id/subcategories/:subId
  app.delete(
    "/categories/:id/subcategories/:subId",
    {
      schema: {
        tags: ["Categories"],
        summary: "Remover subcategoria",
        security,
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const { id: categoryId, subId } = req.params as {
        id: string;
        subId: string;
      };

      const cat = await prisma.category.findFirst({
        where: { id: categoryId, userId },
      });
      if (!cat)
        return reply.status(404).send({ error: "Categoria não encontrada." });

      const inUse = await prisma.transaction.count({
        where: { subcategoryId: subId },
      });
      if (inUse > 0)
        return reply.status(409).send({
          error: `Esta subcategoria possui ${inUse} lançamento(s) vinculado(s) e não pode ser removida.`,
        });

      await prisma.subcategory.delete({ where: { id: subId } });
      return reply.status(204).send();
    },
  );

  // PUT /categories/:id/subcategories/:subId
  app.put(
    "/categories/:id/subcategories/:subId",
    {
      schema: {
        tags: ["Categories"],
        summary: "Atualizar subcategoria",
        security,
        body: subcategorySchema.partial(),
      },
      onRequest: [authenticate],
    },
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string };
      const { id: categoryId, subId } = req.params as {
        id: string;
        subId: string;
      };
      const parsed = subcategorySchema.partial().safeParse(req.body);
      if (!parsed.success)
        return reply.status(400).send({ error: parsed.error.flatten() });

      const cat = await prisma.category.findFirst({
        where: { id: categoryId, userId },
      });
      if (!cat)
        return reply.status(404).send({ error: "Categoria não encontrada." });

      const updated = await prisma.subcategory.update({
        where: { id: subId },
        data: parsed.data,
      });
      return updated;
    },
  );
}
