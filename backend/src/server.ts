// src/server.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { authRoutes } from "./routes/auth";
import { transactionRoutes } from "./routes/transactions";
import { categoryRoutes } from "./routes/categories";
import { budgetRoutes } from "./routes/budgets";
import { profileRoutes } from "./routes/profile";
import { recurringRoutes } from "./routes/recurring";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
} from "fastify-type-provider-zod";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

async function main() {
  const app = Fastify({ logger: true });


  // ── Zod type provider ─────────────────────────────────────────────────────
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // ── Serializer global — converte Date e Decimal para tipos primitivos ───────
  app.addHook("preSerialization", async (_req, _reply, payload: any) => {
    const normalize = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (obj instanceof Date) return obj.toISOString();
      // Decimal do Prisma tem método toNumber()
      if (typeof obj === "object" && typeof obj.toNumber === "function")
        return obj.toNumber();
      if (Array.isArray(obj)) return obj.map(normalize);
      if (typeof obj === "object") {
        return Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, normalize(v)]),
        );
      }
      return obj;
    };
    return normalize(payload);
  });

  // ── Swagger ────────────────────────────────────────────────────────────────
  await app.register(swagger, {
    transform: jsonSchemaTransform,
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "FinTrack API",
        description: "API REST para gerenciamento de finanças pessoais",
        version: "1.0.0",
      },
      servers: [
        { url: "http://localhost:3333", description: "Desenvolvimento" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Token JWT obtido via /auth/login",
          },
        },
      },
      tags: [
        { name: "Auth", description: "Autenticação e registro" },
        { name: "Transactions", description: "Gerenciamento de transações" },
        { name: "Categories", description: "Categorias e subcategorias" },
        { name: "Budgets", description: "Orçamentos mensais" },
        { name: "Recurring", description: "Lançamentos recorrentes" },
        { name: "Profile", description: "Perfil do usuário" },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      persistAuthorization: true,
    },
  });

  // ── Plugins ────────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: (origin, cb) => {
      const allowed = [
        process.env.FRONTEND_URL || "http://localhost:5173",
        "http://localhost:5173",
        "http://localhost:3333",
      ];
      // Permite requisições sem origin (ex: Swagger UI, Postman, mobile)
      if (!origin || allowed.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflight: true,
    strictPreflight: false,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "change-this-secret-in-production",
  });

  // ── Routes ─────────────────────────────────────────────────────────────────
  await app.register(authRoutes);
  await app.register(transactionRoutes);
  await app.register(categoryRoutes);
  await app.register(budgetRoutes);
  await app.register(profileRoutes);
  await app.register(recurringRoutes);

  // ── Health check ───────────────────────────────────────────────────────────
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  // ── Start ──────────────────────────────────────────────────────────────────
  const PORT = Number(process.env.PORT) || 3333;
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 FinTrack API rodando em http://localhost:${PORT}`);
    console.log(`📚 Documentação em http://localhost:${PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
