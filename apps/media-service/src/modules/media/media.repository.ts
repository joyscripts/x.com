import { and, asc, eq, inArray, lt, or, sql } from "drizzle-orm";
import type { MediaUploadedEvent } from "@repo/contracts";
import { db } from "@/db/client";
import {
  mediaEventOutbox,
  mediaAssets,
  mediaVariants,
  type MediaAssetRow,
  type MediaEventOutboxRow,
  type MediaVariantRow,
  type NewMediaAssetRow,
  type NewMediaVariantRow,
} from "@/db/schema";

export type UpdateMediaProcessingInput = {
  status: string;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  failureReason?: string | null;
};

export interface MediaRepository {
  create(input: NewMediaAssetRow): Promise<MediaAssetRow>;
  createUploadedAsset(input: {
    asset: NewMediaAssetRow;
    originalVariant: NewMediaVariantRow;
    event: MediaUploadedEvent;
  }): Promise<MediaAssetRow>;
  findById(id: string): Promise<MediaAssetRow | undefined>;
  findByIds(ids: string[]): Promise<MediaAssetRow[]>;
  updateProcessing(
    id: string,
    input: UpdateMediaProcessingInput,
  ): Promise<MediaAssetRow | undefined>;
  createVariants(input: NewMediaVariantRow[]): Promise<MediaVariantRow[]>;
  findVariantsByMediaId(mediaId: string): Promise<MediaVariantRow[]>;
  findVariantByType(
    mediaId: string,
    variantType: string,
  ): Promise<MediaVariantRow | undefined>;
  listPendingOutbox(input: {
    limit: number;
    maxAttempts: number;
  }): Promise<MediaEventOutboxRow[]>;
  markOutboxPublished(id: string): Promise<void>;
  markOutboxFailed(id: string, error: string): Promise<void>;
}

export class DrizzleMediaRepository implements MediaRepository {
  async create(input: NewMediaAssetRow) {
    const [asset] = await db.insert(mediaAssets).values(input).returning();

    return asset;
  }

  async createUploadedAsset(input: {
    asset: NewMediaAssetRow;
    originalVariant: NewMediaVariantRow;
    event: MediaUploadedEvent;
  }) {
    return db.transaction(async (tx) => {
      const [asset] = await tx
        .insert(mediaAssets)
        .values(input.asset)
        .returning();

      await tx
        .insert(mediaVariants)
        .values(input.originalVariant)
        .onConflictDoNothing({
          target: [mediaVariants.mediaId, mediaVariants.variantType],
        });

      await tx.insert(mediaEventOutbox).values({
        eventType: input.event.type,
        payload: input.event,
      });

      return asset;
    });
  }

  async findById(id: string) {
    const [asset] = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .limit(1);

    return asset;
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }

    return db.select().from(mediaAssets).where(inArray(mediaAssets.id, ids));
  }

  async updateProcessing(id: string, input: UpdateMediaProcessingInput) {
    const [asset] = await db
      .update(mediaAssets)
      .set({
        status: input.status,
        width: input.width,
        height: input.height,
        durationMs: input.durationMs,
        failureReason: input.failureReason,
        updatedAt: sql`now()`,
      })
      .where(eq(mediaAssets.id, id))
      .returning();

    return asset;
  }

  async createVariants(input: NewMediaVariantRow[]) {
    if (input.length === 0) {
      return [];
    }

    const mediaId = input[0]?.mediaId;

    await db
      .insert(mediaVariants)
      .values(input)
      .onConflictDoNothing({
        target: [mediaVariants.mediaId, mediaVariants.variantType],
      });

    if (!mediaId) {
      return [];
    }

    return this.findVariantsByMediaId(mediaId);
  }

  async findVariantsByMediaId(mediaId: string) {
    return db
      .select()
      .from(mediaVariants)
      .where(eq(mediaVariants.mediaId, mediaId));
  }

  async findVariantByType(mediaId: string, variantType: string) {
    const [variant] = await db
      .select()
      .from(mediaVariants)
      .where(
        sql`${mediaVariants.mediaId} = ${mediaId} and ${mediaVariants.variantType} = ${variantType}`,
      )
      .limit(1);

    return variant;
  }

  async listPendingOutbox(input: { limit: number; maxAttempts: number }) {
    return db
      .select()
      .from(mediaEventOutbox)
      .where(
        and(
          or(
            eq(mediaEventOutbox.status, "pending"),
            eq(mediaEventOutbox.status, "failed"),
          ),
          lt(mediaEventOutbox.attempts, input.maxAttempts),
        ),
      )
      .orderBy(asc(mediaEventOutbox.createdAt))
      .limit(input.limit);
  }

  async markOutboxPublished(id: string) {
    await db
      .update(mediaEventOutbox)
      .set({
        status: "published",
        publishedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(eq(mediaEventOutbox.id, id));
  }

  async markOutboxFailed(id: string, error: string) {
    await db
      .update(mediaEventOutbox)
      .set({
        status: "failed",
        attempts: sql`${mediaEventOutbox.attempts} + 1`,
        lastError: error,
        updatedAt: sql`now()`,
      })
      .where(eq(mediaEventOutbox.id, id));
  }
}
