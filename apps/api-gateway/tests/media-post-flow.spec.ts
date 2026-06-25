import { createHmac } from "node:crypto";
import { Readable } from "node:stream";
import type {
  CreatePostRequest,
  CreatePostResponse,
  DeletePostResponse,
  GetPostResponse,
  ListPostsRequest,
  ListPostsResponse,
  MediaAsset,
  Post,
} from "@repo/contracts";
import { createApp } from "@/app";
import { AccessTokenService } from "@/modules/auth/access-token.service";
import type {
  GatewayMediaFile,
  MediaGatewayServicePort,
  UploadMediaInput,
} from "@/modules/media/media.service";
import type { PostsGatewayServicePort } from "@/modules/posts/posts.service";

const userId = "9a828a4f-7c8a-4b2d-9f8e-3f5a6e8d9c10";
const postId = "6d6d6b15-10d7-4946-905b-e5e1ab655eb8";
const mediaId = "704b31be-dfc2-4766-917a-9716a6a23127";
const jwtSecret = "test-jwt-secret";

describe("media post flow", () => {
  it("uploads media, creates a post with it, and fetches media on the post", async () => {
    const mediaService = new FlowMediaService();
    const postsService = new FlowPostsService();
    const app = createApp({
      accessTokenService: new AccessTokenService(jwtSecret),
      mediaService,
      postsService,
    });
    const authorization = `Bearer ${createAccessToken()}`;
    const uploadBody = createMultipartBody({
      fieldName: "file",
      filename: "photo.png",
      contentType: "image/png",
      content: Buffer.from("file"),
    });

    const uploadResponse = await app.inject({
      method: "POST",
      url: "/media/uploads",
      headers: {
        authorization,
        "content-type": uploadBody.contentType,
      },
      payload: uploadBody.body,
    });

    expect(uploadResponse.statusCode).toBe(201);
    expect(uploadResponse.json()).toMatchObject({
      media: {
        id: mediaId,
        ownerId: userId,
        variants: [
          {
            variantType: "image_thumbnail",
          },
        ],
      },
    });

    const createPostResponse = await app.inject({
      method: "POST",
      url: "/posts",
      headers: {
        authorization,
      },
      payload: {
        content: "A post with uploaded media.",
        mediaIds: [mediaId],
      },
    });

    expect(createPostResponse.statusCode).toBe(201);
    expect(createPostResponse.json()).toMatchObject({
      post: {
        media: [
          {
            mediaId,
            mediaType: "image",
            variants: [
              {
                variantType: "image_thumbnail",
              },
            ],
          },
        ],
      },
    });

    const getPostResponse = await app.inject({
      method: "GET",
      url: `/posts/${postId}`,
      headers: {
        authorization,
      },
    });

    expect(getPostResponse.statusCode).toBe(200);
    expect(getPostResponse.json()).toMatchObject({
      post: {
        id: postId,
        media: [
          {
            mediaId,
            url: `/media/${mediaId}/file`,
            variants: [
              {
                variantType: "image_thumbnail",
                url: `/media/${mediaId}/variants/image_thumbnail/file`,
              },
            ],
          },
        ],
      },
    });
  });
});

class FlowMediaService implements MediaGatewayServicePort {
  private readonly media = new Map<string, MediaAsset>();

  async upload(input: UploadMediaInput) {
    const media = createMediaAsset({
      ownerId: input.ownerId,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    });
    this.media.set(media.id, media);

    return { media };
  }

  async listByIds(ids: string[]) {
    return {
      media: ids
        .map((id) => this.media.get(id))
        .filter((media): media is MediaAsset => Boolean(media)),
    };
  }

  async getFile(): Promise<GatewayMediaFile> {
    return {
      body: Readable.from(Buffer.from("file")),
      contentLength: "4",
      contentType: "image/png",
    };
  }

  async getVariantFile(): Promise<GatewayMediaFile> {
    return {
      body: Readable.from(Buffer.from("variant")),
      contentLength: "7",
      contentType: "image/jpeg",
    };
  }
}

class FlowPostsService implements PostsGatewayServicePort {
  private post: Post | undefined;

  async create(
    authorId: string,
    input: CreatePostRequest & {
      media?: Array<{
        mediaId: string;
        url: string;
        mediaType: string;
        mimeType: string;
      }>;
    },
  ): Promise<CreatePostResponse> {
    this.post = createPost({
      authorId,
      content: input.content,
      media: (input.media ?? []).map((media, position) => ({
        id: `00000000-0000-4000-8000-00000000000${position}`,
        mediaId: media.mediaId,
        url: media.url,
        mediaType: media.mediaType as "image" | "video",
        mimeType: media.mimeType,
        position,
        variants: [],
      })),
    });

    return { post: this.post };
  }

  async getById(id: string): Promise<GetPostResponse> {
    return {
      post: this.post ?? createPost({ id }),
    };
  }

  async list(input: ListPostsRequest): Promise<ListPostsResponse> {
    return {
      posts: [this.post ?? createPost({ authorId: input.authorId ?? userId })],
      nextCursor: null,
    };
  }

  async delete(id: string): Promise<DeletePostResponse> {
    return {
      post: {
        ...(this.post ?? createPost({ id })),
        deletedAt: "2026-01-01T00:01:00.000Z",
      },
    };
  }
}

function createMediaAsset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: mediaId,
    ownerId: userId,
    mediaType: "image",
    mimeType: "image/png",
    sizeBytes: 4,
    width: null,
    height: null,
    durationMs: null,
    storageKey: `${userId}/${mediaId}.png`,
    url: `/media/${mediaId}/file`,
    status: "processed",
    failureReason: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    variants: [
      {
        id: "804b31be-dfc2-4766-917a-9716a6a23127",
        mediaId,
        variantType: "image_thumbnail",
        mimeType: "image/jpeg",
        sizeBytes: 2,
        width: 320,
        height: 213,
        durationMs: null,
        storageKey: `${userId}/${mediaId}/thumbnail.jpg`,
        url: `/media/${mediaId}/variants/image_thumbnail/file`,
        createdAt: "2026-01-01T00:00:01.000Z",
      },
    ],
    ...overrides,
  };
}

function createPost(overrides: Partial<Post> = {}): Post {
  return {
    id: postId,
    authorId: userId,
    content: "A post with uploaded media.",
    replyToPostId: null,
    repostOfPostId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    media: [],
    ...overrides,
  };
}

function createMultipartBody(input: {
  fieldName: string;
  filename: string;
  contentType: string;
  content: Buffer;
}) {
  const boundary = "----x-clone-test-boundary";
  const head = Buffer.from(
    [
      `--${boundary}`,
      `Content-Disposition: form-data; name="${input.fieldName}"; filename="${input.filename}"`,
      `Content-Type: ${input.contentType}`,
      "",
      "",
    ].join("\r\n"),
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);

  return {
    body: Buffer.concat([head, input.content, tail]),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

function createAccessToken() {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    phone_number: "+15551234567",
    iat: issuedAt,
    exp: issuedAt + 900,
  };
  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(
    JSON.stringify(payload),
  )}`;
  const signature = createHmac("sha256", jwtSecret)
    .update(unsignedToken)
    .digest("base64url");

  return `${unsignedToken}.${signature}`;
}

function base64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}
