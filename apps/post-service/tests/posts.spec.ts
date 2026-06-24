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
import { PostsError } from "@/modules/posts/posts.errors";
import type { PostsServicePort } from "@/modules/posts/posts.service";

const authorId = "9a828a4f-7c8a-4b2d-9f8e-3f5a6e8d9c10";
const postId = "6d6d6b15-10d7-4946-905b-e5e1ab655eb8";
const secretHeaders = {
  "x-internal-service-secret": "dev-internal-service-secret",
};

class FakePostsService implements PostsServicePort {
  public readonly posts = new Map<string, Post>();

  async create(
    author: string,
    input: CreatePostRequest,
  ): Promise<CreatePostResponse> {
    const post = createPost({
      authorId: author,
      content: input.content,
      replyToPostId: input.replyToPostId ?? null,
      repostOfPostId: input.repostOfPostId ?? null,
    });

    this.posts.set(post.id, post);

    return { post };
  }

  async getById(id: string): Promise<GetPostResponse | undefined> {
    const post = this.posts.get(id);

    return post ? { post } : undefined;
  }

  async list(input: ListPostsRequest): Promise<ListPostsResponse> {
    return {
      posts: Array.from(this.posts.values()).filter(
        (post) => !input.authorId || post.authorId === input.authorId,
      ),
      nextCursor: null,
    };
  }

  async delete(id: string, actorId: string): Promise<DeletePostResponse> {
    const post = this.posts.get(id);

    if (!post) {
      throw new PostsError("Post not found", 404, "POST_NOT_FOUND");
    }

    if (post.authorId !== actorId) {
      throw new PostsError(
        "Only the author can delete this post",
        403,
        "POST_FORBIDDEN",
      );
    }

    const deletedPost = {
      ...post,
      deletedAt: "2026-01-01T00:01:00.000Z",
    };
    this.posts.set(id, deletedPost);

    return { post: deletedPost };
  }
}

describe("post routes", () => {
  it("requires the internal service secret", async () => {
    const app = createApp({
      postsService: new FakePostsService(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/posts",
      payload: {
        authorId,
        content: "hello",
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it("creates and fetches a post", async () => {
    const postsService = new FakePostsService();
    const app = createApp({ postsService });

    const createResponse = await app.inject({
      method: "POST",
      url: "/posts",
      headers: secretHeaders,
      payload: {
        authorId,
        content: "Building the timeline.",
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toMatchObject({
      post: {
        authorId,
        content: "Building the timeline.",
      },
    });

    const createdPostId = createResponse.json<{ post: Post }>().post.id;
    const getResponse = await app.inject({
      method: "GET",
      url: `/posts/${createdPostId}`,
      headers: secretHeaders,
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toMatchObject({
      post: {
        id: createdPostId,
      },
    });
  });

  it("lists posts by author", async () => {
    const postsService = new FakePostsService();
    postsService.posts.set(postId, createPost());
    const app = createApp({ postsService });

    const response = await app.inject({
      method: "GET",
      url: `/posts?authorId=${authorId}`,
      headers: secretHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      posts: [
        {
          id: postId,
          authorId,
        },
      ],
      nextCursor: null,
    });
  });

  it("soft deletes a post owned by the actor", async () => {
    const postsService = new FakePostsService();
    postsService.posts.set(postId, createPost());
    const app = createApp({ postsService });

    const response = await app.inject({
      method: "DELETE",
      url: `/posts/${postId}`,
      headers: secretHeaders,
      payload: {
        actorId: authorId,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      post: {
        id: postId,
        deletedAt: "2026-01-01T00:01:00.000Z",
      },
    });
  });
});

function createPost(overrides: Partial<Post> = {}): Post {
  return {
    id: postId,
    authorId,
    content: "hello",
    replyToPostId: null,
    repostOfPostId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}
