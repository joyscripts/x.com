import {
  createPostRequestSchema,
  createPostResponseSchema,
  deletePostResponseSchema,
  getPostResponseSchema,
  listPostsRequestSchema,
  listPostsResponseSchema,
  mediaTypeSchema,
} from "@repo/contracts";
import { z } from "zod";

export const createCreatePostRequestSchema = createPostRequestSchema.extend({
  authorId: z.string().uuid(),
  media: z
    .array(
      z.object({
        mediaId: z.string().uuid(),
        url: z.string().min(1),
        mediaType: mediaTypeSchema,
        mimeType: z.string().min(1),
      }),
    )
    .max(4)
    .optional(),
});

export const createCreatePostResponseSchema = createPostResponseSchema;
export const createGetPostResponseSchema = getPostResponseSchema;
export const createListPostsResponseSchema = listPostsResponseSchema;
export const createDeletePostResponseSchema = deletePostResponseSchema;

export const getPostParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listPostsQuerySchema = listPostsRequestSchema;
