import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  SERVICE_NAME: z.string().default("notification-service"),
  SERVICE_VERSION: z.string().default("0.0.0"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4006),
  DATABASE_URL: z
    .string()
    .default(
      "postgres://postgres:postgres@localhost:5432/notification_service",
    ),
  INTERNAL_SERVICE_SECRET: z.string().default("dev-internal-service-secret"),
  RABBITMQ_URL: z.string().default("amqp://guest:guest@localhost:5672"),
  NOTIFICATION_EVENTS_EXCHANGE: z.string().default("notification.events"),
  NOTIFICATION_EVENTS_QUEUE: z.string().default("notification-service.push"),
  NOTIFICATION_EVENTS_BINDINGS: z
    .string()
    .default("rabbitmq.ping,notification.requested"),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
