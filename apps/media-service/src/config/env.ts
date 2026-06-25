import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  SERVICE_NAME: z.string().default("media-service"),
  SERVICE_VERSION: z.string().default("0.0.0"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4009),
  DATABASE_URL: z
    .string()
    .default("postgres://postgres:postgres@localhost:5432/media_service"),
  INTERNAL_SERVICE_SECRET: z.string().default("dev-internal-service-secret"),
  RABBITMQ_URL: z.string().default("amqp://guest:guest@localhost:5672"),
  MEDIA_EVENTS_EXCHANGE: z.string().default("media.events"),
  MEDIA_OUTBOX_POLL_INTERVAL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(1000),
  MEDIA_OUTBOX_BATCH_SIZE: z.coerce.number().int().positive().default(25),
  MEDIA_OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10),
  S3_ENDPOINT: z.string().default("http://localhost:9000"),
  S3_ACCESS_KEY: z.string().default("minio"),
  S3_SECRET_KEY: z.string().default("minio123"),
  S3_BUCKET: z.string().default("x-clone-dev"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
