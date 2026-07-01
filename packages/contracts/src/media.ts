import { z } from "zod";

export const mediaTypeSchema = z.enum(["image", "video"]);
export type MediaType = z.infer<typeof mediaTypeSchema>;

export const mediaStatusSchema = z.enum([
  "uploaded",
  "processing",
  "processed",
  "failed",
]);
export type MediaStatus = z.infer<typeof mediaStatusSchema>;

export const mediaVariantTypeSchema = z.enum([
  "original",
  "image_large",
  "image_thumbnail",
  "video_poster",
  "video_mp4",
]);
export type MediaVariantType = z.infer<typeof mediaVariantTypeSchema>;

export const mediaVariantSchema = z.object({
  id: z.string().uuid(),
  mediaId: z.string().uuid(),
  variantType: mediaVariantTypeSchema,
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  durationMs: z.number().int().positive().nullable(),
  storageKey: z.string().min(1),
  url: z.string().min(1),
  createdAt: z.string(),
});

export type MediaVariant = z.infer<typeof mediaVariantSchema>;

export const mediaAssetSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  mediaType: mediaTypeSchema,
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  durationMs: z.number().int().positive().nullable(),
  storageKey: z.string().min(1),
  url: z.string().min(1),
  status: mediaStatusSchema,
  failureReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  variants: z.array(mediaVariantSchema).default([]),
});

export type MediaAsset = z.infer<typeof mediaAssetSchema>;

export const uploadMediaResponseSchema = z.object({
  media: mediaAssetSchema,
});

export type UploadMediaResponse = z.infer<typeof uploadMediaResponseSchema>;

export const listMediaResponseSchema = z.object({
  media: z.array(mediaAssetSchema),
});

export type ListMediaResponse = z.infer<typeof listMediaResponseSchema>;

export const mediaUploadedEventSchema = z.object({
  eventId: z.string().uuid(),
  type: z.literal("media.uploaded"),
  mediaId: z.string().uuid(),
  ownerId: z.string().uuid(),
  mediaType: mediaTypeSchema,
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  storageKey: z.string().min(1),
  occurredAt: z.string().datetime(),
});

export type MediaUploadedEvent = z.infer<typeof mediaUploadedEventSchema>;

export const completeMediaProcessingRequestSchema = z.object({
  status: z.enum(["processing", "processed", "failed"]),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  durationMs: z.number().int().positive().nullable().optional(),
  failureReason: z.string().nullable().optional(),
  variants: z
    .array(
      z.object({
        variantType: mediaVariantTypeSchema,
        mimeType: z.string().min(1),
        sizeBytes: z.number().int().positive(),
        width: z.number().int().positive().nullable().optional(),
        height: z.number().int().positive().nullable().optional(),
        durationMs: z.number().int().positive().nullable().optional(),
        storageKey: z.string().min(1),
        url: z.string().min(1),
      }),
    )
    .default([]),
});

export type CompleteMediaProcessingRequest = z.infer<
  typeof completeMediaProcessingRequestSchema
>;

export const completeMediaProcessingResponseSchema = z.object({
  media: mediaAssetSchema,
  variants: z.array(mediaVariantSchema),
});

export type CompleteMediaProcessingResponse = z.infer<
  typeof completeMediaProcessingResponseSchema
>;
