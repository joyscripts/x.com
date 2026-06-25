import { Readable } from "node:stream";
import type {
  CompleteMediaProcessingRequest,
  CompleteMediaProcessingResponse,
  ListMediaResponse,
  MediaAsset,
  MediaVariant,
  UploadMediaResponse,
} from "@repo/contracts";
import { createApp } from "@/app";
import { MediaError } from "@/modules/media/media.errors";
import type {
  MediaServicePort,
  UploadMediaInput,
} from "@/modules/media/media.service";
import type { MediaFile } from "@/modules/media/media.storage";

const ownerId = "9a828a4f-7c8a-4b2d-9f8e-3f5a6e8d9c10";
const mediaId = "6d6d6b15-10d7-4946-905b-e5e1ab655eb8";
const secretHeaders = {
  "x-internal-service-secret": "dev-internal-service-secret",
};

class FakeMediaService implements MediaServicePort {
  public readonly uploaded: UploadMediaInput[] = [];
  public readonly media = new Map<string, MediaAsset>();

  async upload(input: UploadMediaInput): Promise<UploadMediaResponse> {
    if (input.mimeType === "image/gif") {
      throw new MediaError(
        "Unsupported media type",
        415,
        "MEDIA_TYPE_UNSUPPORTED",
      );
    }

    this.uploaded.push(input);

    const media = createMedia({
      ownerId: input.ownerId,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      mediaType: input.mimeType.startsWith("video/") ? "video" : "image",
    });
    this.media.set(media.id, media);

    return { media };
  }

  async listByIds(ids: string[]): Promise<ListMediaResponse> {
    return {
      media: ids
        .map((id) => this.media.get(id))
        .filter((media): media is MediaAsset => Boolean(media)),
    };
  }

  async getFile(id: string): Promise<MediaFile & { asset: MediaAsset }> {
    const asset = this.media.get(id);

    if (!asset) {
      throw new MediaError("Media not found", 404, "MEDIA_NOT_FOUND");
    }

    return {
      asset,
      body: Readable.from(Buffer.from("file")),
      contentLength: 4,
      contentType: asset.mimeType,
    };
  }

  async getVariantFile(): Promise<MediaFile & { mimeType: string }> {
    return {
      body: Readable.from(Buffer.from("variant")),
      contentLength: 7,
      contentType: "image/jpeg",
      mimeType: "image/jpeg",
    };
  }

  async completeProcessing(
    id: string,
    input: CompleteMediaProcessingRequest,
  ): Promise<CompleteMediaProcessingResponse> {
    const asset = this.media.get(id);

    if (!asset) {
      throw new MediaError("Media not found", 404, "MEDIA_NOT_FOUND");
    }

    const media: MediaAsset = {
      ...asset,
      status: input.status,
      width: input.width ?? asset.width,
      height: input.height ?? asset.height,
      durationMs: input.durationMs ?? asset.durationMs,
      failureReason: input.failureReason ?? null,
      updatedAt: "2026-01-01T00:00:01.000Z",
    };
    this.media.set(id, media);

    const variants: MediaVariant[] = input.variants.map((variant, index) => ({
      id: `7d6d6b15-10d7-4946-905b-e5e1ab655eb${index}`,
      mediaId: id,
      variantType: variant.variantType,
      mimeType: variant.mimeType,
      sizeBytes: variant.sizeBytes,
      width: variant.width ?? null,
      height: variant.height ?? null,
      durationMs: variant.durationMs ?? null,
      storageKey: variant.storageKey,
      url: variant.url,
      createdAt: "2026-01-01T00:00:01.000Z",
    }));

    return { media, variants };
  }
}

describe("media routes", () => {
  it("requires the internal service secret", async () => {
    const app = createApp({
      mediaService: new FakeMediaService(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/media/uploads",
      payload: createUploadPayload(),
    });

    expect(response.statusCode).toBe(401);
  });

  it("uploads media metadata", async () => {
    const mediaService = new FakeMediaService();
    const app = createApp({ mediaService });

    const response = await app.inject({
      method: "POST",
      url: "/media/uploads",
      headers: secretHeaders,
      payload: createUploadPayload(),
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      media: {
        ownerId,
        mediaType: "image",
        mimeType: "image/png",
      },
    });
    expect(mediaService.uploaded).toHaveLength(1);
  });

  it("rejects unsupported media types", async () => {
    const app = createApp({
      mediaService: new FakeMediaService(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/media/uploads",
      headers: secretHeaders,
      payload: createUploadPayload({
        filename: "clip.gif",
        mimeType: "image/gif",
      }),
    });

    expect(response.statusCode).toBe(415);
  });

  it("lists media by ids", async () => {
    const mediaService = new FakeMediaService();
    const media = createMedia();
    mediaService.media.set(media.id, media);
    const app = createApp({ mediaService });

    const response = await app.inject({
      method: "GET",
      url: `/media?ids=${media.id}`,
      headers: secretHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      media: [
        {
          id: media.id,
          ownerId,
        },
      ],
    });
  });

  it("records completed media processing", async () => {
    const mediaService = new FakeMediaService();
    const media = createMedia();
    mediaService.media.set(media.id, media);
    const app = createApp({ mediaService });

    const response = await app.inject({
      method: "PATCH",
      url: `/media/${media.id}/processing`,
      headers: secretHeaders,
      payload: {
        status: "processed",
        width: 1200,
        height: 800,
        variants: [
          {
            variantType: "image_thumbnail",
            mimeType: "image/jpeg",
            sizeBytes: 1024,
            width: 320,
            height: 213,
            storageKey: `${ownerId}/${mediaId}/thumbnail.jpg`,
            url: `/media/${mediaId}/variants/thumbnail.jpg`,
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      media: {
        id: media.id,
        status: "processed",
        width: 1200,
        height: 800,
      },
      variants: [
        {
          mediaId: media.id,
          variantType: "image_thumbnail",
        },
      ],
    });
  });

  it("streams processed media variants", async () => {
    const app = createApp({
      mediaService: new FakeMediaService(),
    });

    const response = await app.inject({
      method: "GET",
      url: `/media/${mediaId}/variants/image_thumbnail/file`,
      headers: secretHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("image/jpeg");
    expect(response.body).toBe("variant");
  });
});

function createUploadPayload(overrides: Partial<UploadMediaInput> = {}) {
  const content = Buffer.from("file").toString("base64");

  return {
    ownerId,
    filename: "image.png",
    mimeType: "image/png",
    sizeBytes: 4,
    contentBase64: content,
    ...overrides,
  };
}

function createMedia(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: mediaId,
    ownerId,
    mediaType: "image",
    mimeType: "image/png",
    sizeBytes: 4,
    width: null,
    height: null,
    durationMs: null,
    storageKey: `${ownerId}/${mediaId}.png`,
    url: `/media/${mediaId}/file`,
    status: "uploaded",
    failureReason: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    variants: [],
    ...overrides,
  };
}
