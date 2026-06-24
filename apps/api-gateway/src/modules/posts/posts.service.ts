import type {
  CreatePostRequest,
  CreatePostResponse,
  DeletePostResponse,
  GetPostResponse,
  ListPostsRequest,
  ListPostsResponse,
} from "@repo/contracts";
import {
  createCreatePostResponseSchema,
  createDeletePostResponseSchema,
  createGetPostResponseSchema,
  createListPostsResponseSchema,
} from "@/modules/posts/schemas/posts.schema";

export interface PostsGatewayServicePort {
  create(authorId: string, input: CreatePostRequest): Promise<CreatePostResponse>;
  getById(id: string): Promise<GetPostResponse>;
  list(input: ListPostsRequest): Promise<ListPostsResponse>;
  delete(id: string, actorId: string): Promise<DeletePostResponse>;
}

export class DownstreamPostError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = "DownstreamPostError";
  }
}

export class HttpPostsGatewayService implements PostsGatewayServicePort {
  constructor(
    private readonly postServiceUrl: string,
    private readonly internalServiceSecret: string,
  ) {}

  async create(
    authorId: string,
    input: CreatePostRequest,
  ): Promise<CreatePostResponse> {
    const payload = await this.request("/posts", {
      method: "POST",
      body: {
        ...input,
        authorId,
      },
    });

    return createCreatePostResponseSchema.parse(payload);
  }

  async getById(id: string): Promise<GetPostResponse> {
    const payload = await this.request(`/posts/${id}`);

    return createGetPostResponseSchema.parse(payload);
  }

  async list(input: ListPostsRequest): Promise<ListPostsResponse> {
    const url = new URL(`${this.baseUrl}/posts`);

    if (input.authorId) {
      url.searchParams.set("authorId", input.authorId);
    }

    if (input.cursor) {
      url.searchParams.set("cursor", input.cursor);
    }

    url.searchParams.set("limit", String(input.limit));

    const payload = await this.request(url);

    return createListPostsResponseSchema.parse(payload);
  }

  async delete(id: string, actorId: string): Promise<DeletePostResponse> {
    const payload = await this.request(`/posts/${id}`, {
      method: "DELETE",
      body: {
        actorId,
      },
    });

    return createDeletePostResponseSchema.parse(payload);
  }

  private get baseUrl() {
    return this.postServiceUrl.replace(/\/$/, "");
  }

  private async request(
    pathOrUrl: string | URL,
    options: {
      method?: string;
      body?: unknown;
    } = {},
  ) {
    const url =
      pathOrUrl instanceof URL
        ? pathOrUrl
        : `${this.baseUrl}${pathOrUrl}`;
    const response = await fetch(url, {
      method: options.method,
      headers: {
        "Content-Type": "application/json",
        "x-internal-service-secret": this.internalServiceSecret,
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new DownstreamPostError(
        `Post service request failed with HTTP ${response.status}`,
        response.status,
        payload,
      );
    }

    return payload;
  }
}
