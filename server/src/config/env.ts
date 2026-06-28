import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Centralized, zod-validated environment configuration.
 *
 * Fail-fast philosophy: if a required variable is missing or malformed the
 * process refuses to start with a readable error, instead of crashing later in
 * an obscure place. Secrets that are only needed from a later phase (database,
 * Gemini) are optional here and validated at their point of use.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  // Optional until Phase 3 (DB) / Phase 6 (AI) — validated where consumed.
  MONGODB_URI: z.string().trim().default(''),
  GEMINI_API_KEY: z.string().trim().default(''),
  GEMINI_MODEL: z.string().trim().default(''),
  GEMINI_FALLBACK_MODELS: z.string().trim().default(''),

  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN_REMEMBER: z.string().default('30d'),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  console.error(`\n❌ Invalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isDevelopment: raw.NODE_ENV === 'development',
  isTest: raw.NODE_ENV === 'test',
  corsOrigins: raw.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
} as const;

export type Env = typeof env;
