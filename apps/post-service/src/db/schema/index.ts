import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

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

export const postMedia = pgTable(
  "post_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id").notNull(),
    mediaId: uuid("media_id").notNull(),
    url: text("url").notNull(),
    mediaType: text("media_type").notNull(),
    mimeType: text("mime_type").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("post_media_post_id_position_idx").on(table.postId, table.position),
    index("post_media_media_id_idx").on(table.mediaId),
    uniqueIndex("post_media_post_id_position_unique").on(
      table.postId,
      table.position,
    ),
    check(
      "post_media_media_type_check",
      sql`${table.mediaType} in ('image', 'video')`,
    ),
    check("post_media_position_check", sql`${table.position} between 0 and 3`),
  ],
);

export type PostRow = typeof posts.$inferSelect;
export type NewPostRow = typeof posts.$inferInsert;
export type PostMediaRow = typeof postMedia.$inferSelect;
export type NewPostMediaRow = typeof postMedia.$inferInsert;
