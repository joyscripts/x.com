import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { env } from "@/config/env";

export type MediaFile = {
  body: Readable;
  contentLength?: number;
  contentType?: string;
};

export interface MediaStorage {
  putObject(input: {
    storageKey: string;
    body: Buffer;
    mimeType: string;
  }): Promise<void>;
  getObject(storageKey: string): Promise<MediaFile | undefined>;
}

export class S3MediaStorage implements MediaStorage {
  private readonly client = new S3Client({
    region: "us-east-1",
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_KEY,
    },
  });

  async putObject(input: {
    storageKey: string;
    body: Buffer;
    mimeType: string;
  }) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: input.storageKey,
        Body: input.body,
        ContentType: input.mimeType,
      }),
    );
  }

  async getObject(storageKey: string) {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: storageKey,
      }),
    );

    if (!response.Body) {
      return undefined;
    }

    return {
      body: response.Body as Readable,
      contentLength: response.ContentLength,
      contentType: response.ContentType,
    };
  }
}
