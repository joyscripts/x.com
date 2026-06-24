import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
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

export class PostsController {
  constructor(
    private readonly accessTokenService: AccessTokenService,
    private readonly postsService: PostsGatewayServicePort,
  ) {}

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tokenPayload = this.verifyRequest(request);
      const payload = createCreatePostRequestSchema.parse(request.body);
      const response = await this.postsService.create(tokenPayload.sub, payload);

      return reply.status(201).send(response);
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

      return reply.status(200).send(response);
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

      return reply.status(200).send(response);
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

      return reply.status(200).send(response);
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
