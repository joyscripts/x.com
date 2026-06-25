import { and, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  postMedia,
  posts,
  type NewPostMediaRow,
  type PostMediaRow,
} from "@/db/schema";
import type { PostWithMedia } from "@/modules/posts/posts.mapper";

export interface PostsRepository {
  create(input: {
    authorId: string;
    content: string;
    replyToPostId: string | null;
    repostOfPostId: string | null;
    media: Array<{
      mediaId: string;
      url: string;
      mediaType: string;
      mimeType: string;
    }>;
  }): Promise<PostWithMedia>;
  findById(id: string): Promise<PostWithMedia | undefined>;
  list(input: {
    authorId?: string;
    cursor?: Date;
    limit: number;
  }): Promise<PostWithMedia[]>;
  softDelete(id: string): Promise<PostWithMedia | undefined>;
}

export class DrizzlePostsRepository implements PostsRepository {
  async create(input: {
    authorId: string;
    content: string;
    replyToPostId: string | null;
    repostOfPostId: string | null;
    media: Array<{
      mediaId: string;
      url: string;
      mediaType: string;
      mimeType: string;
    }>;
  }) {
    return db.transaction(async (tx) => {
      const [post] = await tx
        .insert(posts)
        .values({
          authorId: input.authorId,
          content: input.content,
          replyToPostId: input.replyToPostId,
          repostOfPostId: input.repostOfPostId,
        })
        .returning();

      let media: PostMediaRow[] = [];

      if (input.media.length > 0) {
        const mediaRows: NewPostMediaRow[] = input.media.map((media, position) => ({
          postId: post.id,
          mediaId: media.mediaId,
          url: media.url,
          mediaType: media.mediaType,
          mimeType: media.mimeType,
          position,
        }));

        media = await tx.insert(postMedia).values(mediaRows).returning();
      }

      return {
        post,
        media,
      };
    });
  }

  async findById(id: string) {
    const [post] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
      .limit(1);

    if (!post) {
      return undefined;
    }

    return {
      post,
      media: await this.findMediaByPostIds([post.id]),
    };
  }

  async list(input: { authorId?: string; cursor?: Date; limit: number }) {
    const filters = [isNull(posts.deletedAt)];

    if (input.authorId) {
      filters.push(eq(posts.authorId, input.authorId));
    }

    if (input.cursor) {
      filters.push(lt(posts.createdAt, input.cursor));
    }

    const foundPosts = await db
      .select()
      .from(posts)
      .where(and(...filters))
      .orderBy(desc(posts.createdAt))
      .limit(input.limit + 1);

    const media = await this.findMediaByPostIds(
      foundPosts.map((post) => post.id),
    );
    const mediaByPostId = groupMediaByPostId(media);

    return foundPosts.map((post) => ({
      post,
      media: mediaByPostId.get(post.id) ?? [],
    }));
  }

  async softDelete(id: string) {
    const [post] = await db
      .update(posts)
      .set({
        deletedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
      .returning();

    if (!post) {
      return undefined;
    }

    return {
      post,
      media: await this.findMediaByPostIds([post.id]),
    };
  }

  private async findMediaByPostIds(postIds: string[]) {
    if (postIds.length === 0) {
      return [];
    }

    return db
      .select()
      .from(postMedia)
      .where(inArray(postMedia.postId, postIds))
      .orderBy(postMedia.position);
  }
}

function groupMediaByPostId(mediaRows: PostMediaRow[]) {
  const groupedMedia = new Map<string, PostMediaRow[]>();

  for (const media of mediaRows) {
    const existingMedia = groupedMedia.get(media.postId) ?? [];

    existingMedia.push(media);
    groupedMedia.set(media.postId, existingMedia);
  }

  return groupedMedia;
}
