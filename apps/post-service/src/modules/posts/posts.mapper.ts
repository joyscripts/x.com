import type { MediaType, Post } from "@repo/contracts";
import type { PostMediaRow, PostRow } from "@/db/schema";

export type PostWithMedia = {
  post: PostRow;
  media: PostMediaRow[];
};

export function toPostDto(input: PostWithMedia): Post {
  return {
    id: input.post.id,
    authorId: input.post.authorId,
    content: input.post.content,
    replyToPostId: input.post.replyToPostId,
    repostOfPostId: input.post.repostOfPostId,
    createdAt: input.post.createdAt.toISOString(),
    updatedAt: input.post.updatedAt.toISOString(),
    deletedAt: input.post.deletedAt?.toISOString() ?? null,
    media: input.media
      .sort((left, right) => left.position - right.position)
      .map((media) => ({
        id: media.id,
        mediaId: media.mediaId,
        url: media.url,
        mediaType: media.mediaType as MediaType,
        mimeType: media.mimeType,
        position: media.position,
        variants: [],
      })),
  };
}
