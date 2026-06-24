import { and, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { posts, type PostRow } from "@/db/schema";

export interface PostsRepository {
  create(input: {
    authorId: string;
    content: string;
    replyToPostId: string | null;
    repostOfPostId: string | null;
  }): Promise<PostRow>;
  findById(id: string): Promise<PostRow | undefined>;
  list(input: {
    authorId?: string;
    cursor?: Date;
    limit: number;
  }): Promise<PostRow[]>;
  softDelete(id: string): Promise<PostRow | undefined>;
}

export class DrizzlePostsRepository implements PostsRepository {
  async create(input: {
    authorId: string;
    content: string;
    replyToPostId: string | null;
    repostOfPostId: string | null;
  }) {
    const [post] = await db.insert(posts).values(input).returning();

    return post;
  }

  async findById(id: string) {
    const [post] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
      .limit(1);

    return post;
  }

  async list(input: { authorId?: string; cursor?: Date; limit: number }) {
    const filters = [isNull(posts.deletedAt)];

    if (input.authorId) {
      filters.push(eq(posts.authorId, input.authorId));
    }

    if (input.cursor) {
      filters.push(lt(posts.createdAt, input.cursor));
    }

    return db
      .select()
      .from(posts)
      .where(and(...filters))
      .orderBy(desc(posts.createdAt))
      .limit(input.limit + 1);
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

    return post;
  }
}
