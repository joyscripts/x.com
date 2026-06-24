import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SERVICE_NAME: z.string().default("user-service"),
  SERVICE_VERSION: z.string().default("0.0.0"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4002),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/user_service"),
  INTERNAL_SERVICE_SECRET: z.string().default("dev-internal-service-secret"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
