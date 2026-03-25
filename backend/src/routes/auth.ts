// src/routes/auth.ts
import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma";
import { generateAccessToken, generateRefreshToken, TOKEN_EXPIRY } from "../lib/tokens";
import { authRateLimitConfig } from "../lib/rateLimit";



const registerSchema = z.object({
  name: z.string().min(2).describe("Nome completo"),
  email: z.string().email().describe("E-mail"),
  password: z.string().min(6).describe("Senha — mínimo 6 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email().describe("E-mail"),
  password: z.string().describe("Senha"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1).describe("Refresh token"),
});

const security = [{ bearerAuth: [] }];

// Duração do refresh token em milissegundos (30 dias)
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function authRoutes(app: FastifyInstance) {

  // POST /auth/register
  // Rate limit: 10 req / 15min por IP (evita criação em massa de contas)
  app.post(
    "/auth/register",
    {
      config: authRateLimitConfig,
      schema: {
        tags: ["Auth"],
        summary: "Criar nova conta",
        body: registerSchema,
      },
    },
    async (req, reply) => {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success)
        return reply.status(400).send({ error: parsed.error.flatten() });

      const { name, email, password } = parsed.data;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing)
        return reply.status(409).send({ error: "E-mail já cadastrado." });

      const passwordHash = await bcrypt.hash(password, 12); // 12 rounds em produção
      const user = await prisma.user.create({
        data: { name, email, passwordHash },
      });

      await seedDefaultCategories(user.id);

      const accessToken = generateAccessToken(app, { sub: user.id, email: user.email });
      const refreshTokenValue = generateRefreshToken(app, { sub: user.id });

      // Persiste o refresh token para permitir revogação
      await prisma.refreshToken.create({
        data: {
          id: randomUUID(),
          token: refreshTokenValue,
          userId: user.id,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      });

      return reply.status(201).send({
        accessToken,
        refreshToken: refreshTokenValue,
        expiresIn: TOKEN_EXPIRY.access,
        user: { id: user.id, name: user.name, email: user.email },
      });
    },
  );

  // POST /auth/login
  // Rate limit: 10 req / 15min por IP (protege contra brute force)
  app.post(
    "/auth/login",
    {
      config: authRateLimitConfig,
      schema: {
        tags: ["Auth"],
        summary: "Fazer login e obter tokens",
        body: loginSchema,
      },
    },
    async (req, reply) => {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success)
        return reply.status(400).send({ error: parsed.error.flatten() });

      const { email, password } = parsed.data;
      const user = await prisma.user.findUnique({ where: { email } });

      // Resposta idêntica para email não encontrado e senha errada
      // — evita user enumeration attack
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return reply.status(401).send({ error: "Credenciais inválidas." });
      }

      const accessToken = generateAccessToken(app, { sub: user.id, email: user.email });
      const refreshTokenValue = generateRefreshToken(app, { sub: user.id });

      await prisma.refreshToken.create({
        data: {
          id: randomUUID(),
          token: refreshTokenValue,
          userId: user.id,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      });

      return {
        accessToken,
        refreshToken: refreshTokenValue,
        expiresIn: TOKEN_EXPIRY.access,
        user: { id: user.id, name: user.name, email: user.email },
      };
    },
  );

  // POST /auth/refresh
  // Troca um refresh token válido por um novo par de tokens (rotação)
  app.post(
    "/auth/refresh",
    {
      schema: {
        tags: ["Auth"],
        summary: "Renovar access token via refresh token",
        body: refreshSchema,
      },
    },
    async (req, reply) => {
      const { refreshToken } = req.body as { refreshToken: string };

      // Verifica assinatura e expiração do token usando o namespace "refresh"
      let payload: { sub: string };
      try {
        payload = await req.refreshVerify() as { sub: string };
      } catch {
        return reply.status(401).send({
          error: "Refresh token inválido ou expirado.",
          code: "INVALID_REFRESH_TOKEN",
        });
      }

      // Busca no banco — token deve existir e não ter sido usado/revogado
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
        // Se o token foi usado (usedAt preenchido), suspeita de roubo:
        // revoga TODOS os tokens do usuário como medida de segurança
        if (storedToken?.usedAt) {
          await prisma.refreshToken.updateMany({
            where: { userId: storedToken.userId },
            data: { revokedAt: new Date() },
          });
          req.log.warn({ userId: storedToken.userId }, "Possível roubo de refresh token — todos os tokens revogados");
        }

        return reply.status(401).send({
          error: "Refresh token inválido, expirado ou já utilizado.",
          code: "REFRESH_TOKEN_REUSE",
        });
      }

      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        return reply.status(401).send({ error: "Usuário não encontrado." });
      }

      // Rotação: marca o token atual como usado e emite um novo par
      const newAccessToken = generateAccessToken(app, { sub: user.id, email: user.email });
      const newRefreshToken = generateRefreshToken(app, { sub: user.id });

      await prisma.$transaction([
        // Marca o token atual como usado (não revogado — apenas registra o uso)
        prisma.refreshToken.update({
          where: { token: refreshToken },
          data: { usedAt: new Date() },
        }),
        // Cria o novo refresh token
        prisma.refreshToken.create({
          data: {
            id: randomUUID(),
            token: newRefreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
          },
        }),
      ]);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: TOKEN_EXPIRY.access,
      };
    },
  );

  // POST /auth/logout
  // Revoga o refresh token — access token expira naturalmente em 15min
  app.post(
    "/auth/logout",
    {
      schema: {
        tags: ["Auth"],
        summary: "Encerrar sessão e revogar refresh token",
        body: refreshSchema,
      },
    },
    async (req, reply) => {
      const { refreshToken } = req.body as { refreshToken: string };

      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
      });

      return reply.status(204).send();
    },
  );

  // GET /auth/me
  app.get(
    "/auth/me",
    {
      schema: { tags: ["Auth"], summary: "Dados do usuário autenticado", security },
      onRequest: [
        async (req, reply) => {
          try {
            await req.jwtVerify();
          } catch {
            reply.status(401).send({ error: "Não autorizado." });
          }
        },
      ],
    },
    async (req) => {
      const { sub } = req.user as { sub: string };
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: sub },
        select: { id: true, name: true, email: true, createdAt: true },
      });
      return user;
    },
  );
}

// ─── Seed de categorias padrão ────────────────────────────────────────────────
async function seedDefaultCategories(userId: string) {
  const defaults = [
    {
      slug: "moradia", name: "Moradia", icon: "🏠", color: "#E8845A",
      subs: [
        { slug: "aluguel", name: "Aluguel", icon: "🔑" },
        { slug: "energia", name: "Energia", icon: "⚡" },
        { slug: "agua", name: "Água", icon: "💧" },
        { slug: "internet", name: "Internet/TV", icon: "📡" },
        { slug: "condominio", name: "Condomínio", icon: "🏢" },
      ],
    },
    {
      slug: "alimentacao", name: "Alimentação", icon: "🍽️", color: "#5AB88A",
      subs: [
        { slug: "supermercado", name: "Supermercado", icon: "🛒" },
        { slug: "restaurante", name: "Restaurante", icon: "🍜" },
        { slug: "delivery", name: "Delivery", icon: "🛵" },
        { slug: "padaria", name: "Padaria/Café", icon: "☕" },
      ],
    },
    {
      slug: "transporte", name: "Transporte", icon: "🚗", color: "#5A8FE8",
      subs: [
        { slug: "combustivel", name: "Combustível", icon: "⛽" },
        { slug: "uber", name: "Uber/99", icon: "🚕" },
        { slug: "manutencao", name: "Manutenção", icon: "🔧" },
        { slug: "transporte_pub", name: "Transporte Público", icon: "🚌" },
      ],
    },
    {
      slug: "saude", name: "Saúde", icon: "❤️", color: "#E85A7A",
      subs: [
        { slug: "plano_saude", name: "Plano de Saúde", icon: "🏥" },
        { slug: "medicamentos", name: "Medicamentos", icon: "💊" },
        { slug: "consultas", name: "Consultas", icon: "👨‍⚕️" },
        { slug: "academia", name: "Academia", icon: "💪" },
      ],
    },
    {
      slug: "lazer", name: "Lazer", icon: "🎭", color: "#A85AE8",
      subs: [
        { slug: "streaming", name: "Streaming", icon: "📺" },
        { slug: "cinema", name: "Cinema/Shows", icon: "🎬" },
        { slug: "viagem", name: "Viagens", icon: "✈️" },
        { slug: "hobbies", name: "Hobbies", icon: "🎮" },
      ],
    },
    {
      slug: "cartao", name: "Cartão de Crédito", icon: "💳", color: "#E8C45A",
      subs: [
        { slug: "fatura", name: "Fatura Mensal", icon: "📄" },
        { slug: "parcelas", name: "Parcelas", icon: "🔄" },
      ],
    },
    {
      slug: "receita", name: "Receita", icon: "💰", color: "#4CAF50",
      subs: [
        { slug: "salario", name: "Salário", icon: "💼" },
        { slug: "freelance", name: "Freelance", icon: "💻" },
        { slug: "investimentos", name: "Investimentos", icon: "📈" },
      ],
    },
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