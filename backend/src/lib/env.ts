// src/lib/env.ts
import "dotenv/config";
import { z } from "zod";

/**
 * Valida todas as variáveis de ambiente no startup do servidor.
 *
 * Sem isso, o servidor sobe com JWT_SECRET undefined e assina tokens
 * com a string "undefined" — todos os tokens se tornam equivalentes.
 * Também evita descobrir em produção que DATABASE_URL está errada
 * só quando a primeira query falha.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL é obrigatória")
    .startsWith("postgresql://", "DATABASE_URL deve começar com postgresql://"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET deve ter no mínimo 32 caracteres para ser segura"),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET deve ter no mínimo 32 caracteres")
    .optional(),

  FRONTEND_URL: z
    .string()
    .url("FRONTEND_URL deve ser uma URL válida")
    .default("http://localhost:5173"),

  PORT: z.coerce.number().int().positive().default(3333),

  // Rate limiting (valores padrão conservadores para produção)
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000), // 15 min
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    // Usa process.stderr diretamente — o logger Fastify ainda não existe
    process.stderr.write(
      `\n[FATAL] Variáveis de ambiente inválidas:\n${issues}\n\n` +
        `Corrija o arquivo .env antes de iniciar o servidor.\n\n`,
    );
    process.exit(1);
  }

  return result.data;
}

// Exporta o env validado — importar este módulo antes de qualquer outro
// garante que o servidor não sobe com configuração inválida
export const env = validateEnv();