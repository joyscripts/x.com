import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SERVICE_NAME: z.string().default("api-gateway"),
  SERVICE_VERSION: z.string().default("0.0.0"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/api_gateway"),
  AUTH_JWT_SECRET: z.string().default("dev-auth-jwt-secret-change-me"),
  AUTH_SERVICE_URL: z.string().default("http://localhost:4001"),
  USER_SERVICE_URL: z.string().default("http://localhost:4002"),
  POST_SERVICE_URL: z.string().default("http://localhost:4004"),
  NOTIFICATION_SERVICE_URL: z.string().default("http://localhost:4006"),
  INTERNAL_SERVICE_SECRET: z.string().default("dev-internal-service-secret"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
