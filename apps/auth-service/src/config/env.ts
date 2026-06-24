import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SERVICE_NAME: z.string().default("auth-service"),
  SERVICE_VERSION: z.string().default("0.0.0"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4001),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/auth_service"),
  INTERNAL_SERVICE_SECRET: z.string().default("dev-internal-service-secret"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  RABBITMQ_URL: z.string().default("amqp://guest:guest@localhost:5672"),
  NOTIFICATION_EVENTS_EXCHANGE: z.string().default("notification.events"),
  AUTH_JWT_SECRET: z.string().default("dev-auth-jwt-secret-change-me"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 30),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(600),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
