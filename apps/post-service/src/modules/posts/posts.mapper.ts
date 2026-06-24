import type { Post } from "@repo/contracts";
import type { PostRow } from "@/db/schema";

export function toPostDto(post: PostRow): Post {
  return {
    id: post.id,
    authorId: post.authorId,
    content: post.content,
    replyToPostId: post.replyToPostId,
    repostOfPostId: post.repostOfPostId,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    deletedAt: post.deletedAt?.toISOString() ?? null,
  };
}
