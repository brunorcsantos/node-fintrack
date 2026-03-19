// src/server.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { authRoutes } from "./routes/auth";
import { transactionRoutes } from "./routes/transactions";
import { categoryRoutes } from "./routes/categories";
import { budgetRoutes } from "./routes/budgets";

async function main() {
  const app = Fastify({ logger: true });

  // ── Serializer global — converte Date e Decimal para tipos primitivos ───────
  app.addHook("preSerialization", async (_req, _reply, payload: any) => {
    const normalize = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (obj instanceof Date) return obj.toISOString();
      // Decimal do Prisma tem método toNumber()
      if (typeof obj === "object" && typeof obj.toNumber === "function") return obj.toNumber();
      if (Array.isArray(obj)) return obj.map(normalize);
      if (typeof obj === "object") {
        return Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, normalize(v)])
        );
      }
      return obj;
    };
    return normalize(payload);
  });

  // ── Plugins ────────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "change-this-secret-in-production",
  });

  // ── Routes ─────────────────────────────────────────────────────────────────
  await app.register(authRoutes);
  await app.register(transactionRoutes);
  await app.register(categoryRoutes);
  await app.register(budgetRoutes);

  // ── Health check ───────────────────────────────────────────────────────────
  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  // ── Start ──────────────────────────────────────────────────────────────────
  const PORT = Number(process.env.PORT) || 3333;

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 FinTrack API rodando em http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();