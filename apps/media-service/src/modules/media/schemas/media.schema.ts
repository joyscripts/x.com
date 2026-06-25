import {
  completeMediaProcessingRequestSchema,
  completeMediaProcessingResponseSchema,
  listMediaResponseSchema,
  mediaAssetSchema,
  mediaVariantTypeSchema,
  uploadMediaResponseSchema,
} from "@repo/contracts";
import { z } from "zod";

export const uploadMediaRequestSchema = z.object({
  ownerId: z.string().uuid(),
  filename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
  sizeBytes: z.number().int().positive(),
  contentBase64: z.string().min(1),
});

export const listMediaQuerySchema = z.object({
  ids: z.string().min(1),
});

export const getMediaParamsSchema = z.object({
  id: z.string().uuid(),
});

export const getMediaVariantParamsSchema = z.object({
  id: z.string().uuid(),
  variantType: mediaVariantTypeSchema,
});

export const createMediaAssetSchema = mediaAssetSchema;
export const createUploadMediaResponseSchema = uploadMediaResponseSchema;
export const createListMediaResponseSchema = listMediaResponseSchema;
export const createCompleteMediaProcessingRequestSchema =
  completeMediaProcessingRequestSchema;
export const createCompleteMediaProcessingResponseSchema =
  completeMediaProcessingResponseSchema;
