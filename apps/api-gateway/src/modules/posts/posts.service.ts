import type {
  CreatePostRequest,
  CreatePostResponse,
  DeletePostResponse,
  GetPostResponse,
  ListPostsRequest,
  ListPostsResponse,
} from "@repo/contracts";
import {
  DownstreamServiceError,
  InternalHttpClient,
} from "@/lib/internal-http-client";
import {
  createCreatePostResponseSchema,
  createDeletePostResponseSchema,
  createGetPostResponseSchema,
  createListPostsResponseSchema,
} from "@/modules/posts/schemas/posts.schema";

export interface PostsGatewayServicePort {
  create(
    authorId: string,
    input: CreatePostRequest & {
      media?: Array<{
        mediaId: string;
        url: string;
        mediaType: string;
        mimeType: string;
      }>;
    },
  ): Promise<CreatePostResponse>;
  getById(id: string): Promise<GetPostResponse>;
  list(input: ListPostsRequest): Promise<ListPostsResponse>;
  delete(id: string, actorId: string): Promise<DeletePostResponse>;
}

export class DownstreamPostError extends DownstreamServiceError {
  constructor(error: DownstreamServiceError);
  constructor(message: string, statusCode: number, payload: unknown);
  constructor(
    errorOrMessage: DownstreamServiceError | string,
    statusCode?: number,
    payload?: unknown,
  ) {
    if (errorOrMessage instanceof DownstreamServiceError) {
      super(
        errorOrMessage.serviceName,
        errorOrMessage.statusCode,
        errorOrMessage.payload,
      );
    } else {
      super("Post service", statusCode ?? 500, payload);
      this.message = errorOrMessage;
    }
    this.name = "DownstreamPostError";
  }
}

export class HttpPostsGatewayService implements PostsGatewayServicePort {
  private readonly client: InternalHttpClient;

  constructor(
    postServiceUrl: string,
    internalServiceSecret: string,
  ) {
    this.client = new InternalHttpClient(
      "Post service",
      postServiceUrl,
      internalServiceSecret,
    );
  }

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
    const payload = await this.request("/posts", {
      method: "POST",
      body: {
        ...input,
        mediaIds: undefined,
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
    const url = new URL(this.client.resolveUrl("/posts"));

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

  private async request(
    pathOrUrl: string | URL,
    options: {
      method?: string;
      body?: unknown;
    } = {},
  ) {
    try {
      return await this.client.requestJson(pathOrUrl, options);
    } catch (error) {
      if (error instanceof DownstreamServiceError) {
        throw new DownstreamPostError(error);
      }
      throw error;
    }
  }
}
