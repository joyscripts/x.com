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

class FakePostsGatewayService implements PostsGatewayServicePort {
  public readonly createdPosts: Array<{
    authorId: string;
    input: CreatePostRequest & {
      media?: Array<{
        mediaId: string;
        url: string;
        mediaType: string;
        mimeType: string;
      }>;
    };
  }> = [];
  public readonly deletedPosts: Array<{ id: string; actorId: string }> = [];

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
    this.createdPosts.push({ authorId, input });

    return {
      post: createPost({
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
      }),
    };
  }

  async getById(id: string): Promise<GetPostResponse> {
    return {
      post: createPost({ id }),
    };
  }

  async list(input: ListPostsRequest): Promise<ListPostsResponse> {
    return {
      posts: [createPost({ authorId: input.authorId ?? userId })],
      nextCursor: null,
    };
  }

  async delete(id: string, actorId: string): Promise<DeletePostResponse> {
    this.deletedPosts.push({ id, actorId });

    return {
      post: createPost({
        id,
        deletedAt: "2026-01-01T00:01:00.000Z",
      }),
    };
  }
}

class FakeMediaGatewayService implements MediaGatewayServicePort {
  public readonly media = new Map<string, MediaAsset>([
    [mediaId, createMediaAsset()],
  ]);

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

describe("post gateway routes", () => {
  it("creates a post for the current user", async () => {
    const postsService = new FakePostsGatewayService();
    const app = createTestApp(postsService);

    const response = await app.inject({
      method: "POST",
      url: "/posts",
      headers: {
        authorization: `Bearer ${createAccessToken()}`,
      },
      payload: {
        content: "Hello timeline",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      post: {
        authorId: userId,
        content: "Hello timeline",
      },
    });
    expect(postsService.createdPosts).toEqual([
      {
        authorId: userId,
        input: {
          content: "Hello timeline",
          media: [],
        },
      },
    ]);
  });

  it("creates a post with validated media for the current user", async () => {
    const postsService = new FakePostsGatewayService();
    const mediaService = new FakeMediaGatewayService();
    const app = createTestApp(postsService, mediaService);

    const response = await app.inject({
      method: "POST",
      url: "/posts",
      headers: {
        authorization: `Bearer ${createAccessToken()}`,
      },
      payload: {
        content: "Hello media",
        mediaIds: [mediaId],
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      post: {
        media: [
          {
            mediaId,
            mediaType: "image",
          },
        ],
      },
    });
    expect(postsService.createdPosts[0]).toMatchObject({
      authorId: userId,
      input: {
        content: "Hello media",
        media: [
          {
            mediaId,
            mediaType: "image",
            mimeType: "image/png",
          },
        ],
      },
    });
  });

  it("lists posts for authenticated users", async () => {
    const postsService = new FakePostsGatewayService();
    const app = createTestApp(postsService);

    const response = await app.inject({
      method: "GET",
      url: `/posts?authorId=${userId}`,
      headers: {
        authorization: `Bearer ${createAccessToken()}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      posts: [
        {
          authorId: userId,
        },
      ],
      nextCursor: null,
    });
  });

  it("deletes a post as the current user", async () => {
    const postsService = new FakePostsGatewayService();
    const app = createTestApp(postsService);

    const response = await app.inject({
      method: "DELETE",
      url: `/posts/${postId}`,
      headers: {
        authorization: `Bearer ${createAccessToken()}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(postsService.deletedPosts).toEqual([
      {
        id: postId,
        actorId: userId,
      },
    ]);
  });

  it("rejects missing bearer tokens", async () => {
    const app = createTestApp(new FakePostsGatewayService());

    const response = await app.inject({
      method: "POST",
      url: "/posts",
      payload: {
        content: "No token",
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it("streams media variants through the gateway", async () => {
    const app = createTestApp(new FakePostsGatewayService());

    const response = await app.inject({
      method: "GET",
      url: `/media/${mediaId}/variants/image_thumbnail/file`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("image/jpeg");
    expect(response.body).toBe("variant");
  });
});

function createTestApp(
  postsService: PostsGatewayServicePort,
  mediaService: MediaGatewayServicePort = new FakeMediaGatewayService(),
) {
  return createApp({
    accessTokenService: new AccessTokenService(jwtSecret),
    postsService,
    mediaService,
  });
}

function createPost(overrides: Partial<Post> = {}): Post {
  return {
    id: postId,
    authorId: userId,
    content: "Hello timeline",
    replyToPostId: null,
    repostOfPostId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    media: [],
    ...overrides,
  };
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
    status: "uploaded",
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
