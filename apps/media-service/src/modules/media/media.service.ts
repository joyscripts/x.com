import { randomUUID } from "node:crypto";
import type {
  CompleteMediaProcessingRequest,
  CompleteMediaProcessingResponse,
  ListMediaResponse,
  MediaAsset,
  MediaType,
  MediaUploadedEvent,
  MediaVariantType,
  UploadMediaResponse,
} from "@repo/contracts";
import { MediaError } from "@/modules/media/media.errors";
import {
  toMediaAssetDto,
  toMediaVariantDto,
} from "@/modules/media/media.mapper";
import type { MediaRepository } from "@/modules/media/media.repository";
import type { MediaFile, MediaStorage } from "@/modules/media/media.storage";

export type UploadMediaInput = {
  ownerId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  contentBase64: string;
};

export interface MediaServicePort {
  upload(input: UploadMediaInput): Promise<UploadMediaResponse>;
  listByIds(ids: string[]): Promise<ListMediaResponse>;
  getFile(id: string): Promise<MediaFile & { asset: MediaAsset }>;
  getVariantFile(
    id: string,
    variantType: MediaVariantType,
  ): Promise<MediaFile & { mimeType: string }>;
  completeProcessing(
    id: string,
    input: CompleteMediaProcessingRequest,
  ): Promise<CompleteMediaProcessingResponse>;
}

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const videoMimeTypes = new Set(["video/mp4", "video/quicktime"]);
const maxImageBytes = 10 * 1024 * 1024;
const maxVideoBytes = 100 * 1024 * 1024;

export class MediaService implements MediaServicePort {
  constructor(
    private readonly repository: MediaRepository,
    private readonly storage: MediaStorage,
  ) {}

  async upload(input: UploadMediaInput): Promise<UploadMediaResponse> {
    const mediaType = getMediaType(input.mimeType);
    const maxBytes = mediaType === "image" ? maxImageBytes : maxVideoBytes;

    if (input.sizeBytes > maxBytes) {
      throw new MediaError("Media file is too large", 413, "MEDIA_TOO_LARGE");
    }

    const body = Buffer.from(input.contentBase64, "base64");

    if (body.byteLength !== input.sizeBytes) {
      throw new MediaError(
        "Media size does not match payload",
        400,
        "MEDIA_SIZE_MISMATCH",
      );
    }

    const id = randomUUID();
    const extension = getExtension(input.filename, input.mimeType);
    const storageKey = `${input.ownerId}/${id}.${extension}`;

    await this.storage.putObject({
      storageKey,
      body,
      mimeType: input.mimeType,
    });

    const event: MediaUploadedEvent = {
      eventId: randomUUID(),
      type: "media.uploaded",
      mediaId: id,
      ownerId: input.ownerId,
      mediaType,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storageKey,
      occurredAt: new Date().toISOString(),
    };
    const originalVariant = {
      mediaId: id,
      variantType: "original" as const,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      width: null,
      height: null,
      durationMs: null,
      storageKey,
      url: `/media/${id}/file`,
    };
    const media = await this.repository.createUploadedAsset({
      asset: {
        id,
        ownerId: input.ownerId,
        mediaType,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storageKey,
        url: `/media/${id}/file`,
        status: "uploaded",
      },
      originalVariant,
      event,
    });
    const variants = await this.repository.findVariantsByMediaId(media.id);

    return {
      media: toMediaAssetDto(media, variants),
    };
  }

  async listByIds(ids: string[]): Promise<ListMediaResponse> {
    const assets = await this.repository.findByIds([...new Set(ids)]);
    const assetById = new Map(assets.map((asset) => [asset.id, asset]));
    const variantsByMediaId = await this.findVariantsByMediaIds(
      assets.map((asset) => asset.id),
    );

    return {
      media: ids
        .map((id) => assetById.get(id))
        .filter((asset): asset is NonNullable<typeof asset> => Boolean(asset))
        .map((asset) =>
          toMediaAssetDto(asset, variantsByMediaId.get(asset.id)),
        ),
    };
  }

  async getFile(id: string): Promise<MediaFile & { asset: MediaAsset }> {
    const asset = await this.repository.findById(id);

    if (!asset) {
      throw new MediaError("Media not found", 404, "MEDIA_NOT_FOUND");
    }

    const file = await this.storage.getObject(asset.storageKey);

    if (!file) {
      throw new MediaError("Media file not found", 404, "MEDIA_FILE_NOT_FOUND");
    }

    return {
      ...file,
      asset: toMediaAssetDto(
        asset,
        await this.repository.findVariantsByMediaId(asset.id),
      ),
    };
  }

  async getVariantFile(
    id: string,
    variantType: MediaVariantType,
  ): Promise<MediaFile & { mimeType: string }> {
    const variant = await this.repository.findVariantByType(id, variantType);

    if (!variant) {
      throw new MediaError(
        "Media variant not found",
        404,
        "MEDIA_VARIANT_NOT_FOUND",
      );
    }

    const file = await this.storage.getObject(variant.storageKey);

    if (!file) {
      throw new MediaError(
        "Media variant file not found",
        404,
        "MEDIA_VARIANT_FILE_NOT_FOUND",
      );
    }

    return {
      ...file,
      mimeType: variant.mimeType,
    };
  }

  async completeProcessing(
    id: string,
    input: CompleteMediaProcessingRequest,
  ): Promise<CompleteMediaProcessingResponse> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new MediaError("Media not found", 404, "MEDIA_NOT_FOUND");
    }

    if (input.status === "failed" && !input.failureReason) {
      throw new MediaError(
        "Failure reason is required when media processing fails",
        400,
        "MEDIA_FAILURE_REASON_REQUIRED",
      );
    }

    if (input.variants.length > 0) {
      await this.repository.createVariants(
        input.variants.map((variant) => ({
          mediaId: id,
          variantType: variant.variantType,
          mimeType: variant.mimeType,
          sizeBytes: variant.sizeBytes,
          width: variant.width ?? null,
          height: variant.height ?? null,
          durationMs: variant.durationMs ?? null,
          storageKey: variant.storageKey,
          url: variant.url,
        })),
      );
    }

    const media = await this.repository.updateProcessing(id, {
      status: input.status,
      width: input.width ?? existing.width,
      height: input.height ?? existing.height,
      durationMs: input.durationMs ?? existing.durationMs,
      failureReason:
        input.status === "failed" ? (input.failureReason ?? null) : null,
    });

    if (!media) {
      throw new MediaError("Media not found", 404, "MEDIA_NOT_FOUND");
    }

    const variants = await this.repository.findVariantsByMediaId(id);

    return {
      media: toMediaAssetDto(media, variants),
      variants: variants.map(toMediaVariantDto),
    };
  }

  private async findVariantsByMediaIds(ids: string[]) {
    const variantsByMediaId = new Map<
      string,
      Awaited<ReturnType<MediaRepository["findVariantsByMediaId"]>>
    >();

    await Promise.all(
      ids.map(async (id) => {
        variantsByMediaId.set(
          id,
          await this.repository.findVariantsByMediaId(id),
        );
      }),
    );

    return variantsByMediaId;
  }
}

function getMediaType(mimeType: string): MediaType {
  if (imageMimeTypes.has(mimeType)) {
    return "image";
  }

  if (videoMimeTypes.has(mimeType)) {
    return "video";
  }

  throw new MediaError("Unsupported media type", 415, "MEDIA_TYPE_UNSUPPORTED");
}

function getExtension(filename: string, mimeType: string) {
  const extension = filename.split(".").pop()?.toLowerCase();

  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return extension;
  }

  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "video/quicktime") {
    return "mov";
  }

  return mimeType.split("/")[1] ?? "bin";
}
