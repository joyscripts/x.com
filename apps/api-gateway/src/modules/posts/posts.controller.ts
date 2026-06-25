import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import type {
  CreatePostResponse,
  DeletePostResponse,
  GetPostResponse,
  ListPostsResponse,
  MediaAsset,
  Post,
} from "@repo/contracts";
import {
  AccessTokenError,
  type AccessTokenService,
} from "@/modules/auth/access-token.service";
import {
  createCreatePostRequestSchema,
  getPostParamsSchema,
  listPostsQuerySchema,
} from "@/modules/posts/schemas/posts.schema";
import {
  DownstreamPostError,
  type PostsGatewayServicePort,
} from "@/modules/posts/posts.service";
import type { MediaGatewayServicePort } from "@/modules/media/media.service";

const maxPostMediaCount = 4;

export class PostsController {
  constructor(
    private readonly accessTokenService: AccessTokenService,
    private readonly postsService: PostsGatewayServicePort,
    private readonly mediaService: MediaGatewayServicePort,
  ) {}

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tokenPayload = this.verifyRequest(request);
      const payload = createCreatePostRequestSchema.parse(request.body);
      const media = await this.validatePostMedia(
        tokenPayload.sub,
        payload.mediaIds ?? [],
      );
      const response = await this.postsService.create(tokenPayload.sub, {
        ...payload,
        media,
      });

      return reply.status(201).send(await this.enrichCreateResponse(response));
    } catch (error) {
      return this.handleError(error, request, reply, {
        zodMessage: "Invalid post payload",
      });
    }
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      this.verifyRequest(request);
      const params = getPostParamsSchema.parse(request.params);
      const response = await this.postsService.getById(params.id);

      return reply.status(200).send(await this.enrichGetResponse(response));
    } catch (error) {
      return this.handleError(error, request, reply, {
        zodMessage: "Invalid post params",
      });
    }
  };

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      this.verifyRequest(request);
      const query = listPostsQuerySchema.parse(request.query);
      const response = await this.postsService.list(query);

      return reply.status(200).send(await this.enrichListResponse(response));
    } catch (error) {
      return this.handleError(error, request, reply, {
        zodMessage: "Invalid posts query",
      });
    }
  };

  delete = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tokenPayload = this.verifyRequest(request);
      const params = getPostParamsSchema.parse(request.params);
      const response = await this.postsService.delete(
        params.id,
        tokenPayload.sub,
      );

      return reply.status(200).send(await this.enrichDeleteResponse(response));
    } catch (error) {
      return this.handleError(error, request, reply, {
        zodMessage: "Invalid post params",
      });
    }
  };

  private verifyRequest(request: FastifyRequest) {
    const accessToken = parseBearerToken(request);

    return this.accessTokenService.verify(accessToken);
  }

  private async validatePostMedia(ownerId: string, mediaIds: string[]) {
    if (mediaIds.length > maxPostMediaCount) {
      throw new DownstreamPostError("Too many media items", 400, {
        message: "Posts can include up to 4 media items",
        code: "POST_MEDIA_LIMIT",
      });
    }

    if (new Set(mediaIds).size !== mediaIds.length) {
      throw new DownstreamPostError("Duplicate media items", 400, {
        message: "Post media cannot contain duplicates",
        code: "POST_MEDIA_DUPLICATE",
      });
    }

    if (mediaIds.length === 0) {
      return [];
    }

    const response = await this.mediaService.listByIds(mediaIds);
    const mediaById = new Map(response.media.map((media) => [media.id, media]));
    const media = mediaIds.map((mediaId) => mediaById.get(mediaId));

    if (media.some((item) => !item)) {
      throw new DownstreamPostError("Media not found", 400, {
        message: "One or more media items could not be found",
        code: "POST_MEDIA_NOT_FOUND",
      });
    }

    const assets = media as MediaAsset[];

    for (const asset of assets) {
      if (asset.ownerId !== ownerId) {
        throw new DownstreamPostError("Media owner mismatch", 403, {
          message: "You can only attach your own media",
          code: "POST_MEDIA_FORBIDDEN",
        });
      }

      if (asset.status !== "uploaded" && asset.status !== "processed") {
        throw new DownstreamPostError("Media is not ready", 400, {
          message: "Media is not ready to attach",
          code: "POST_MEDIA_NOT_READY",
        });
      }
    }

    const mediaTypes = new Set(assets.map((asset) => asset.mediaType));

    if (mediaTypes.has("video") && assets.length > 1) {
      throw new DownstreamPostError("Video posts can include one video", 400, {
        message: "Video posts can include one video",
        code: "POST_VIDEO_MEDIA_LIMIT",
      });
    }

    if (mediaTypes.size > 1) {
      throw new DownstreamPostError("Cannot mix images and videos", 400, {
        message: "Cannot mix images and videos in one post",
        code: "POST_MEDIA_MIXED_TYPES",
      });
    }

    return assets.map((asset) => ({
      mediaId: asset.id,
      url: asset.url,
      mediaType: asset.mediaType,
      mimeType: asset.mimeType,
    }));
  }

  private async enrichCreateResponse(
    response: CreatePostResponse,
  ): Promise<CreatePostResponse> {
    return {
      ...response,
      post: await this.enrichPostMedia(response.post),
    };
  }

  private async enrichGetResponse(
    response: GetPostResponse,
  ): Promise<GetPostResponse> {
    return {
      ...response,
      post: await this.enrichPostMedia(response.post),
    };
  }

  private async enrichListResponse(
    response: ListPostsResponse,
  ): Promise<ListPostsResponse> {
    return {
      ...response,
      posts: await Promise.all(
        response.posts.map((post) => this.enrichPostMedia(post)),
      ),
    };
  }

  private async enrichDeleteResponse(
    response: DeletePostResponse,
  ): Promise<DeletePostResponse> {
    return {
      ...response,
      post: await this.enrichPostMedia(response.post),
    };
  }

  private async enrichPostMedia(post: Post): Promise<Post> {
    const mediaIds = post.media.map((media) => media.mediaId);

    if (mediaIds.length === 0) {
      return {
        ...post,
        media: post.media.map((media) => ({ ...media, variants: [] })),
      };
    }

    const response = await this.mediaService.listByIds(mediaIds);
    const mediaById = new Map(response.media.map((media) => [media.id, media]));

    return {
      ...post,
      media: post.media.map((media) => ({
        ...media,
        variants: mediaById.get(media.mediaId)?.variants ?? [],
      })),
    };
  }

  private handleError(
    error: unknown,
    request: FastifyRequest,
    reply: FastifyReply,
    options: { zodMessage: string },
  ) {
    if (error instanceof AccessTokenError) {
      return reply.status(401).send({
        message: error.message,
      });
    }

    if (error instanceof DownstreamPostError) {
      const statusCode =
        error.statusCode >= 400 && error.statusCode < 500
          ? error.statusCode
          : 502;

      return reply.status(statusCode).send(
        error.payload ?? {
          message: "Post service request failed",
        },
      );
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: options.zodMessage,
        issues: error.flatten(),
      });
    }

    request.log.error(error, "Failed to process post request");
    return reply.status(502).send({
      message: "Failed to process post request",
    });
  }
}

function parseBearerToken(request: FastifyRequest) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new AccessTokenError("Missing bearer token");
  }

  return authorization.slice("Bearer ".length).trim();
}
