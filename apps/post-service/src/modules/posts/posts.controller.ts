import type { FastifyReply, FastifyRequest } from "fastify";
import { z, ZodError } from "zod";
import { PostsError } from "@/modules/posts/posts.errors";
import type { PostsServicePort } from "@/modules/posts/posts.service";
import {
  createCreatePostRequestSchema,
  createCreatePostResponseSchema,
  createDeletePostResponseSchema,
  createGetPostResponseSchema,
  createListPostsResponseSchema,
  getPostParamsSchema,
  listPostsQuerySchema,
} from "@/modules/posts/schemas/posts.schema";

export class PostsController {
  constructor(private readonly service: PostsServicePort) {}

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = createCreatePostRequestSchema.parse(request.body);
      const response = createCreatePostResponseSchema.parse(
        await this.service.create(payload.authorId, payload),
      );

      return reply.status(201).send(response);
    } catch (error) {
      return this.handleError(error, request, reply, {
        zodMessage: "Invalid post payload",
      });
    }
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = getPostParamsSchema.parse(request.params);
      const response = await this.service.getById(params.id);

      if (!response) {
        return reply.status(404).send({
          message: "Post not found",
        });
      }

      return reply.status(200).send(createGetPostResponseSchema.parse(response));
    } catch (error) {
      return this.handleError(error, request, reply, {
        zodMessage: "Invalid post params",
      });
    }
  };

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listPostsQuerySchema.parse(request.query);
      const response = createListPostsResponseSchema.parse(
        await this.service.list(query),
      );

      return reply.status(200).send(response);
    } catch (error) {
      return this.handleError(error, request, reply, {
        zodMessage: "Invalid posts query",
      });
    }
  };

  delete = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = getPostParamsSchema.parse(request.params);
      const payload = zodDeletePostRequestSchema.parse(request.body);
      const response = createDeletePostResponseSchema.parse(
        await this.service.delete(params.id, payload.actorId),
      );

      return reply.status(200).send(response);
    } catch (error) {
      return this.handleError(error, request, reply, {
        zodMessage: "Invalid delete post payload",
      });
    }
  };

  private handleError(
    error: unknown,
    request: FastifyRequest,
    reply: FastifyReply,
    options: { zodMessage: string },
  ) {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: options.zodMessage,
        issues: error.flatten(),
      });
    }

    if (error instanceof PostsError) {
      return reply.status(error.statusCode).send({
        message: error.message,
        code: error.code,
      });
    }

    request.log.error(error, "Failed to process post request");
    return reply.status(500).send({
      message: "Failed to process post request",
    });
  }
}

const zodDeletePostRequestSchema = z.object({
  actorId: z.string().uuid(),
});
