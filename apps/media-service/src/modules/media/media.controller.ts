import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { MediaError } from "@/modules/media/media.errors";
import type { MediaServicePort } from "@/modules/media/media.service";
import {
  createCompleteMediaProcessingRequestSchema,
  createCompleteMediaProcessingResponseSchema,
  createListMediaResponseSchema,
  createUploadMediaResponseSchema,
  getMediaParamsSchema,
  getMediaVariantParamsSchema,
  listMediaQuerySchema,
  uploadMediaRequestSchema,
} from "@/modules/media/schemas/media.schema";

export class MediaController {
  constructor(private readonly service: MediaServicePort) {}

  upload = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = uploadMediaRequestSchema.parse(request.body);
      const response = createUploadMediaResponseSchema.parse(
        await this.service.upload(payload),
      );

      return reply.status(201).send(response);
    } catch (error) {
      return this.handleError(error, request, reply, "Invalid media upload payload");
    }
  };

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listMediaQuerySchema.parse(request.query);
      const ids = query.ids.split(",").filter(Boolean);
      const response = createListMediaResponseSchema.parse(
        await this.service.listByIds(ids),
      );

      return reply.status(200).send(response);
    } catch (error) {
      return this.handleError(error, request, reply, "Invalid media query");
    }
  };

  completeProcessing = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = getMediaParamsSchema.parse(request.params);
      const payload = createCompleteMediaProcessingRequestSchema.parse(request.body);
      const response = createCompleteMediaProcessingResponseSchema.parse(
        await this.service.completeProcessing(params.id, payload),
      );

      return reply.status(200).send(response);
    } catch (error) {
      return this.handleError(
        error,
        request,
        reply,
        "Invalid media processing payload",
      );
    }
  };

  getFile = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = getMediaParamsSchema.parse(request.params);
      const file = await this.service.getFile(params.id);

      reply.header("content-type", file.contentType ?? file.asset.mimeType);

      if (file.contentLength) {
        reply.header("content-length", file.contentLength);
      }

      return reply.status(200).send(file.body);
    } catch (error) {
      return this.handleError(error, request, reply, "Invalid media params");
    }
  };

  getVariantFile = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = getMediaVariantParamsSchema.parse(request.params);
      const file = await this.service.getVariantFile(params.id, params.variantType);

      reply.header("content-type", file.contentType ?? file.mimeType);

      if (file.contentLength) {
        reply.header("content-length", file.contentLength);
      }

      return reply.status(200).send(file.body);
    } catch (error) {
      return this.handleError(error, request, reply, "Invalid media variant params");
    }
  };

  private handleError(
    error: unknown,
    request: FastifyRequest,
    reply: FastifyReply,
    zodMessage: string,
  ) {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: zodMessage,
        issues: error.flatten(),
      });
    }

    if (error instanceof MediaError) {
      return reply.status(error.statusCode).send({
        message: error.message,
        code: error.code,
      });
    }

    request.log.error(error, "Failed to process media request");
    return reply.status(500).send({
      message: "Failed to process media request",
    });
  }
}
