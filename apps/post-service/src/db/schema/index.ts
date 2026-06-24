import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id").notNull(),
    content: text("content").notNull(),
    replyToPostId: uuid("reply_to_post_id"),
    repostOfPostId: uuid("repost_of_post_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("posts_author_created_at_idx").on(table.authorId, table.createdAt),
    index("posts_created_at_idx").on(table.createdAt),
    index("posts_reply_to_post_id_idx").on(table.replyToPostId),
    index("posts_repost_of_post_id_idx").on(table.repostOfPostId),
  ],
);

export type PostRow = typeof posts.$inferSelect;
export type NewPostRow = typeof posts.$inferInsert;
