// src/routes/auth.ts
import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post("/auth/register", async (req, reply) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return reply.status(409).send({ error: "E-mail já cadastrado." });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, passwordHash } });

    // Seed default categories for new user
    await seedDefaultCategories(user.id);

    const token = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: "7d" });
    return reply.status(201).send({ token, user: { id: user.id, name: user.name, email: user.email } });
  });

  // POST /auth/login
  app.post("/auth/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply.status(401).send({ error: "Credenciais inválidas." });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return reply.status(401).send({ error: "Credenciais inválidas." });

    const token = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: "7d" });
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  });

  // GET /auth/me
  app.get("/auth/me", { onRequest: [async (req, reply) => { try { await req.jwtVerify(); } catch { reply.status(401).send({ error: "Não autorizado." }); } }] }, async (req) => {
    const { sub } = req.user as { sub: string };
    const user = await prisma.user.findUniqueOrThrow({ where: { id: sub }, select: { id: true, name: true, email: true, createdAt: true } });
    return user;
  });
}

async function seedDefaultCategories(userId: string) {
  const defaults = [
    { slug: "moradia", name: "Moradia", icon: "🏠", color: "#E8845A", subs: [
      { slug: "aluguel", name: "Aluguel", icon: "🔑" },
      { slug: "energia", name: "Energia", icon: "⚡" },
      { slug: "agua", name: "Água", icon: "💧" },
      { slug: "internet", name: "Internet/TV", icon: "📡" },
      { slug: "condominio", name: "Condomínio", icon: "🏢" },
    ]},
    { slug: "alimentacao", name: "Alimentação", icon: "🍽️", color: "#5AB88A", subs: [
      { slug: "supermercado", name: "Supermercado", icon: "🛒" },
      { slug: "restaurante", name: "Restaurante", icon: "🍜" },
      { slug: "delivery", name: "Delivery", icon: "🛵" },
      { slug: "padaria", name: "Padaria/Café", icon: "☕" },
    ]},
    { slug: "transporte", name: "Transporte", icon: "🚗", color: "#5A8FE8", subs: [
      { slug: "combustivel", name: "Combustível", icon: "⛽" },
      { slug: "uber", name: "Uber/99", icon: "🚕" },
      { slug: "manutencao", name: "Manutenção", icon: "🔧" },
      { slug: "transporte_pub", name: "Transporte Público", icon: "🚌" },
    ]},
    { slug: "saude", name: "Saúde", icon: "❤️", color: "#E85A7A", subs: [
      { slug: "plano_saude", name: "Plano de Saúde", icon: "🏥" },
      { slug: "medicamentos", name: "Medicamentos", icon: "💊" },
      { slug: "consultas", name: "Consultas", icon: "👨‍⚕️" },
      { slug: "academia", name: "Academia", icon: "💪" },
    ]},
    { slug: "lazer", name: "Lazer", icon: "🎭", color: "#A85AE8", subs: [
      { slug: "streaming", name: "Streaming", icon: "📺" },
      { slug: "cinema", name: "Cinema/Shows", icon: "🎬" },
      { slug: "viagem", name: "Viagens", icon: "✈️" },
      { slug: "hobbies", name: "Hobbies", icon: "🎮" },
    ]},
    { slug: "cartao", name: "Cartão de Crédito", icon: "💳", color: "#E8C45A", subs: [
      { slug: "fatura", name: "Fatura Mensal", icon: "📄" },
      { slug: "parcelas", name: "Parcelas", icon: "🔄" },
    ]},
    { slug: "receita", name: "Receita", icon: "💰", color: "#4CAF50", subs: [
      { slug: "salario", name: "Salário", icon: "💼" },
      { slug: "freelance", name: "Freelance", icon: "💻" },
      { slug: "investimentos", name: "Investimentos", icon: "📈" },
    ]},
  ];

  for (const cat of defaults) {
    const created = await prisma.category.create({
      data: { slug: cat.slug, name: cat.name, icon: cat.icon, color: cat.color, userId },
    });
    for (const sub of cat.subs) {
      await prisma.subcategory.create({
        data: { slug: sub.slug, name: sub.name, icon: sub.icon, categoryId: created.id },
      });
    }
  }
}
