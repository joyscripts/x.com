import { z } from "zod";
import { mediaTypeSchema, mediaVariantSchema } from "./media";

export const postContentSchema = z.string().trim().max(280);

export const postMediaSchema = z.object({
  id: z.string().uuid(),
  mediaId: z.string().uuid(),
  url: z.string().min(1),
  mediaType: mediaTypeSchema,
  mimeType: z.string().min(1),
  position: z.number().int().min(0).max(3),
  variants: z.array(mediaVariantSchema).default([]),
});

export type PostMedia = z.infer<typeof postMediaSchema>;

export const postSchema = z.object({
  id: z.string().uuid(),
  authorId: z.string().uuid(),
  content: postContentSchema,
  replyToPostId: z.string().uuid().nullable(),
  repostOfPostId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  media: z.array(postMediaSchema),
});

export type Post = z.infer<typeof postSchema>;

export const createPostRequestSchema = z
  .object({
    content: postContentSchema,
    mediaIds: z.array(z.string().uuid()).max(4).optional(),
    replyToPostId: z.string().uuid().nullable().optional(),
    repostOfPostId: z.string().uuid().nullable().optional(),
  })
  .refine(
    (input) => input.content.length > 0 || (input.mediaIds?.length ?? 0) > 0,
    {
      message: "Post must include text or media",
      path: ["content"],
    },
  );

export type CreatePostRequest = z.infer<typeof createPostRequestSchema>;

export const createPostResponseSchema = z.object({
  post: postSchema,
});

export type CreatePostResponse = z.infer<typeof createPostResponseSchema>;

export const getPostResponseSchema = z.object({
  post: postSchema,
});

export type GetPostResponse = z.infer<typeof getPostResponseSchema>;

export const listPostsRequestSchema = z.object({
  authorId: z.string().uuid().optional(),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type ListPostsRequest = z.infer<typeof listPostsRequestSchema>;

export const listPostsResponseSchema = z.object({
  posts: z.array(postSchema),
  nextCursor: z.string().nullable(),
});

export type ListPostsResponse = z.infer<typeof listPostsResponseSchema>;

export const deletePostResponseSchema = z.object({
  post: postSchema,
});

export type DeletePostResponse = z.infer<typeof deletePostResponseSchema>;
