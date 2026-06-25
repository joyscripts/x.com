import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").notNull(),
    mediaType: text("media_type").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationMs: integer("duration_ms"),
    storageKey: text("storage_key").notNull().unique(),
    url: text("url").notNull(),
    status: text("status").default("uploaded").notNull(),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("media_assets_owner_created_at_idx").on(
      table.ownerId,
      table.createdAt,
    ),
    check(
      "media_assets_media_type_check",
      sql`${table.mediaType} in ('image', 'video')`,
    ),
    check(
      "media_assets_status_check",
      sql`${table.status} in ('uploaded', 'processing', 'processed', 'failed')`,
    ),
  ],
);

export const mediaVariants = pgTable(
  "media_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => mediaAssets.id),
    variantType: text("variant_type").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationMs: integer("duration_ms"),
    storageKey: text("storage_key").notNull().unique(),
    url: text("url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("media_variants_media_id_idx").on(table.mediaId),
    index("media_variants_media_variant_type_idx").on(
      table.mediaId,
      table.variantType,
    ),
    uniqueIndex("media_variants_media_variant_type_unique").on(
      table.mediaId,
      table.variantType,
    ),
    check(
      "media_variants_variant_type_check",
      sql`${table.variantType} in ('original', 'image_large', 'image_thumbnail', 'video_poster', 'video_mp4')`,
    ),
  ],
);

export const mediaEventOutbox = pgTable(
  "media_event_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    status: text("status").default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    lastError: text("last_error"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("media_event_outbox_status_created_at_idx").on(
      table.status,
      table.createdAt,
    ),
    check(
      "media_event_outbox_status_check",
      sql`${table.status} in ('pending', 'published', 'failed')`,
    ),
  ],
);

export type MediaAssetRow = typeof mediaAssets.$inferSelect;
export type NewMediaAssetRow = typeof mediaAssets.$inferInsert;
export type MediaVariantRow = typeof mediaVariants.$inferSelect;
export type NewMediaVariantRow = typeof mediaVariants.$inferInsert;
export type MediaEventOutboxRow = typeof mediaEventOutbox.$inferSelect;
