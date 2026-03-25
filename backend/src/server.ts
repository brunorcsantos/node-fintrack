// src/server.ts
// IMPORTANTE: env deve ser o primeiro import — valida variáveis antes de tudo
import { env } from "./lib/env";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { registerRateLimit } from "./lib/rateLimit";
import { registerErrorHandler } from "./middleware/errorHandler";
import { authRoutes } from "./routes/auth";
import { transactionRoutes } from "./routes/transactions";
import { categoryRoutes } from "./routes/categories";
import { budgetRoutes } from "./routes/budgets";
import { profileRoutes } from "./routes/profile";
import { recurringRoutes } from "./routes/recurring";
import { notificationRoutes } from "./routes/notifications";
import { creditCardRoutes } from "./routes/creditCards";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
} from "fastify-type-provider-zod";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

async function main() {
  const app = Fastify({
    logger: {
      // Logs estruturados em produção (JSON), legíveis em desenvolvimento
      transport: env.NODE_ENV === "development"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
      level: env.NODE_ENV === "production" ? "warn" : "info",
    },
  });

  // Zod type provider
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Rate limiting — registrado antes das rotas
  await registerRateLimit(app);

  // Error handler global — registrado antes das rotas
  registerErrorHandler(app);

  // Serializer global — converte Date e Decimal do Prisma para tipos primitivos
  app.addHook("preSerialization", async (_req, _reply, payload: unknown) => {
    const normalize = (obj: unknown): unknown => {
      if (obj === null || obj === undefined) return obj;
      if (obj instanceof Date) return obj.toISOString();
      if (typeof obj === "object" && typeof (obj as Record<string, unknown>).toNumber === "function")
        return (obj as { toNumber(): number }).toNumber();
      if (Array.isArray(obj)) return obj.map(normalize);
      if (typeof obj === "object") {
        return Object.fromEntries(
          Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, normalize(v)]),
        );
      }
      return obj;
    };
    return normalize(payload);
  });

  // Swagger
  await app.register(swagger, {
    transform: jsonSchemaTransform,
    openapi: {
      openapi: "3.0.0",
      info: { title: "FinTrack API", description: "API REST para finanças pessoais", version: "1.0.0" },
      servers: [{ url: `http://localhost:${env.PORT}`, description: "Desenvolvimento" }],
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
      },
      tags: [
        { name: "Auth", description: "Autenticação e registro" },
        { name: "Transactions", description: "Transações" },
        { name: "Categories", description: "Categorias e subcategorias" },
        { name: "Budgets", description: "Orçamentos" },
        { name: "Recurring", description: "Recorrentes" },
        { name: "Profile", description: "Perfil" },
        { name: "Notifications", description: "Notificações" },
        { name: "CreditCards", description: "Cartões e faturas" },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "list", deepLinking: true, persistAuthorization: true },
  });

  // Plugins
  await app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Access token — verificado pelo middleware `authenticate` em cada rota protegida
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    namespace: "access",
    jwtVerify: "accessVerify",
    jwtSign: "accessSign",
  });

  // Refresh token — secret separado, usado apenas em /auth/refresh
  // Se JWT_REFRESH_SECRET não estiver definido, usa JWT_SECRET com sufixo
  // (menos seguro, mas funcional para desenvolvimento)
  await app.register(jwt, {
    secret: env.JWT_REFRESH_SECRET ?? env.JWT_SECRET + "_refresh",
    namespace: "refresh",
    jwtVerify: "refreshVerify",
    jwtSign: "refreshSign",
  });

  // Rotas
  await app.register(authRoutes);
  await app.register(transactionRoutes);
  await app.register(categoryRoutes);
  await app.register(budgetRoutes);
  await app.register(profileRoutes);
  await app.register(recurringRoutes);
  await app.register(notificationRoutes);
  await app.register(creditCardRoutes);

  // Health check
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  }));

  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    app.log.info(`FinTrack API rodando em http://localhost:${env.PORT}`);
    app.log.info(`Documentação em http://localhost:${env.PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();