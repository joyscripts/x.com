import {
  createPostRequestSchema,
  createPostResponseSchema,
  deletePostResponseSchema,
  getPostResponseSchema,
  listPostsRequestSchema,
  listPostsResponseSchema,
} from "@repo/contracts";
import { z } from "zod";

export const createCreatePostRequestSchema = createPostRequestSchema;
export const createCreatePostResponseSchema = createPostResponseSchema;
export const createGetPostResponseSchema = getPostResponseSchema;
export const createListPostsResponseSchema = listPostsResponseSchema;
export const createDeletePostResponseSchema = deletePostResponseSchema;

export const getPostParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listPostsQuerySchema = listPostsRequestSchema;
