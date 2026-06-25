import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import type {
  ListMediaResponse,
  MediaVariantType,
  UploadMediaResponse,
} from "@repo/contracts";
import {
  DownstreamServiceError,
  InternalHttpClient,
} from "@/lib/internal-http-client";
import {
  createListMediaResponseSchema,
  createUploadMediaResponseSchema,
} from "@/modules/media/schemas/media.schema";

export type UploadMediaInput = {
  ownerId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
};

export type GatewayMediaFile = {
  body: Readable;
  contentLength?: string | null;
  contentType?: string | null;
};

export interface MediaGatewayServicePort {
  upload(input: UploadMediaInput): Promise<UploadMediaResponse>;
  listByIds(ids: string[]): Promise<ListMediaResponse>;
  getFile(id: string): Promise<GatewayMediaFile>;
  getVariantFile(
    id: string,
    variantType: MediaVariantType,
  ): Promise<GatewayMediaFile>;
}

export class DownstreamMediaError extends DownstreamServiceError {
  constructor(error: DownstreamServiceError) {
    super(error.serviceName, error.statusCode, error.payload);
    this.name = "DownstreamMediaError";
  }
}

export class HttpMediaGatewayService implements MediaGatewayServicePort {
  private readonly client: InternalHttpClient;

  constructor(mediaServiceUrl: string, internalServiceSecret: string) {
    this.client = new InternalHttpClient(
      "Media service",
      mediaServiceUrl,
      internalServiceSecret,
    );
  }

  async upload(input: UploadMediaInput): Promise<UploadMediaResponse> {
    const payload = await this.request("/media/uploads", {
      method: "POST",
      body: {
        ownerId: input.ownerId,
        filename: input.filename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        contentBase64: input.buffer.toString("base64"),
      },
    });

    return createUploadMediaResponseSchema.parse(payload);
  }

  async listByIds(ids: string[]): Promise<ListMediaResponse> {
    if (ids.length === 0) {
      return { media: [] };
    }

    const url = new URL(this.client.resolveUrl("/media"));
    url.searchParams.set("ids", ids.join(","));
    const payload = await this.request(url);

    return createListMediaResponseSchema.parse(payload);
  }

  async getFile(id: string): Promise<GatewayMediaFile> {
    return this.getMediaFile(`/media/${id}/file`);
  }

  async getVariantFile(
    id: string,
    variantType: MediaVariantType,
  ): Promise<GatewayMediaFile> {
    return this.getMediaFile(`/media/${id}/variants/${variantType}/file`);
  }

  private async getMediaFile(path: string): Promise<GatewayMediaFile> {
    const response = await this.requestStream(path);

    return {
      body: Readable.fromWeb(response.body as unknown as NodeReadableStream),
      contentLength: response.headers.get("content-length"),
      contentType: response.headers.get("content-type"),
    };
  }

  private async request(
    pathOrUrl: string | URL,
    options: { method?: string; body?: unknown } = {},
  ) {
    try {
      return await this.client.requestJson(pathOrUrl, options);
    } catch (error) {
      if (error instanceof DownstreamServiceError) {
        throw new DownstreamMediaError(error);
      }
      throw error;
    }
  }

  private async requestStream(path: string) {
    try {
      return await this.client.requestStream(path);
    } catch (error) {
      if (error instanceof DownstreamServiceError) {
        throw new DownstreamMediaError(error);
      }
      throw error;
    }
  }
}
