import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import {
  AccessTokenError,
  type AccessTokenService,
} from "@/modules/auth/access-token.service";
import {
  DownstreamMediaError,
  type MediaGatewayServicePort,
} from "@/modules/media/media.service";
import {
  getMediaParamsSchema,
  getMediaVariantParamsSchema,
  listMediaQuerySchema,
} from "@/modules/media/schemas/media.schema";

export class MediaController {
  constructor(
    private readonly accessTokenService: AccessTokenService,
    private readonly mediaService: MediaGatewayServicePort,
  ) {}

  upload = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tokenPayload = this.verifyRequest(request);
      const file = await request.file();

      if (!file) {
        return reply.status(400).send({
          message: "Media file is required",
        });
      }

      const buffer = await file.toBuffer();
      const response = await this.mediaService.upload({
        ownerId: tokenPayload.sub,
        filename: file.filename,
        mimeType: file.mimetype,
        sizeBytes: buffer.byteLength,
        buffer,
      });

      return reply.status(201).send(response);
    } catch (error) {
      return this.handleError(error, request, reply, "Invalid media upload");
    }
  };

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      this.verifyRequest(request);
      const query = listMediaQuerySchema.parse(request.query);
      const response = await this.mediaService.listByIds(
        query.ids.split(",").filter(Boolean),
      );

      return reply.status(200).send(response);
    } catch (error) {
      return this.handleError(error, request, reply, "Invalid media query");
    }
  };

  getFile = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = getMediaParamsSchema.parse(request.params);
      const file = await this.mediaService.getFile(params.id);

      if (file.contentType) {
        reply.header("content-type", file.contentType);
      }

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
      const file = await this.mediaService.getVariantFile(
        params.id,
        params.variantType,
      );

      if (file.contentType) {
        reply.header("content-type", file.contentType);
      }

      if (file.contentLength) {
        reply.header("content-length", file.contentLength);
      }

      return reply.status(200).send(file.body);
    } catch (error) {
      return this.handleError(error, request, reply, "Invalid media variant params");
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
    zodMessage: string,
  ) {
    if (error instanceof AccessTokenError) {
      return reply.status(401).send({
        message: error.message,
      });
    }

    if (error instanceof DownstreamMediaError) {
      const statusCode =
        error.statusCode >= 400 && error.statusCode < 500
          ? error.statusCode
          : 502;

      return reply.status(statusCode).send(
        error.payload ?? {
          message: "Media service request failed",
        },
      );
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: zodMessage,
        issues: error.flatten(),
      });
    }

    request.log.error(error, "Failed to process media request");
    return reply.status(502).send({
      message: "Failed to process media request",
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
