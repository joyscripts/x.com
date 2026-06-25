import type {
  MediaAsset,
  MediaStatus,
  MediaType,
  MediaVariant,
  MediaVariantType,
} from "@repo/contracts";
import type { MediaAssetRow, MediaVariantRow } from "@/db/schema";

export function toMediaAssetDto(
  asset: MediaAssetRow,
  variants: MediaVariantRow[] = [],
): MediaAsset {
  return {
    id: asset.id,
    ownerId: asset.ownerId,
    mediaType: asset.mediaType as MediaType,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    width: asset.width,
    height: asset.height,
    durationMs: asset.durationMs,
    storageKey: asset.storageKey,
    url: asset.url,
    status: asset.status as MediaStatus,
    failureReason: asset.failureReason,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
    variants: variants.map(toMediaVariantDto),
  };
}

export function toMediaVariantDto(variant: MediaVariantRow): MediaVariant {
  return {
    id: variant.id,
    mediaId: variant.mediaId,
    variantType: variant.variantType as MediaVariantType,
    mimeType: variant.mimeType,
    sizeBytes: variant.sizeBytes,
    width: variant.width,
    height: variant.height,
    durationMs: variant.durationMs,
    storageKey: variant.storageKey,
    url: variant.url,
    createdAt: variant.createdAt.toISOString(),
  };
}
