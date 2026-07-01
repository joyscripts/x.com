import { z } from "zod";

export const serviceMetadataSchema = z.object({
  service: z.string(),
  version: z.string(),
  environment: z.enum(["development", "test", "production"]),
});

export type ServiceMetadata = z.infer<typeof serviceMetadataSchema>;

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  metadata: serviceMetadataSchema,
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
