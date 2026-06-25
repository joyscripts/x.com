import {
  listMediaResponseSchema,
  mediaVariantTypeSchema,
  uploadMediaResponseSchema,
} from "@repo/contracts";
import { z } from "zod";

export const createUploadMediaResponseSchema = uploadMediaResponseSchema;
export const createListMediaResponseSchema = listMediaResponseSchema;

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
