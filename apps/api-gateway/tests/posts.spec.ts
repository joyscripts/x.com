import { createHmac } from "node:crypto";
import type {
  CreatePostRequest,
  CreatePostResponse,
  DeletePostResponse,
  GetPostResponse,
  ListPostsRequest,
  ListPostsResponse,
  Post,
} from "@repo/contracts";
import { createApp } from "@/app";
import { AccessTokenService } from "@/modules/auth/access-token.service";
import type { PostsGatewayServicePort } from "@/modules/posts/posts.service";

const userId = "9a828a4f-7c8a-4b2d-9f8e-3f5a6e8d9c10";
const postId = "6d6d6b15-10d7-4946-905b-e5e1ab655eb8";
const jwtSecret = "test-jwt-secret";

class FakePostsGatewayService implements PostsGatewayServicePort {
  public readonly createdPosts: Array<{
    authorId: string;
    input: CreatePostRequest;
  }> = [];
  public readonly deletedPosts: Array<{ id: string; actorId: string }> = [];

  async create(
    authorId: string,
    input: CreatePostRequest,
  ): Promise<CreatePostResponse> {
    this.createdPosts.push({ authorId, input });

    return {
      post: createPost({
        authorId,
        content: input.content,
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
        },
      },
    ]);
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
});

function createTestApp(postsService: PostsGatewayServicePort) {
  return createApp({
    accessTokenService: new AccessTokenService(jwtSecret),
    postsService,
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
