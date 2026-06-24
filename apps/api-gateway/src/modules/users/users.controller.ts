import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import {
  AccessTokenError,
  type AccessTokenService,
} from "@/modules/auth/access-token.service";
import { createUpdateUserProfileRequestSchema } from "@/modules/users/schemas/users.schema";
import {
  DownstreamUserError,
  type UsersGatewayServicePort,
} from "@/modules/users/users.service";

export class UsersController {
  constructor(
    private readonly accessTokenService: AccessTokenService,
    private readonly usersService: UsersGatewayServicePort,
  ) {}

  getMe = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tokenPayload = this.verifyRequest(request);
      const response = await this.usersService.getById(tokenPayload.sub);

      return reply.status(200).send(response);
    } catch (error) {
      return this.handleError(error, request, reply, {
        zodMessage: "User service response was invalid",
        zodStatusCode: 502,
      });
    }
  };

  updateMeProfile = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tokenPayload = this.verifyRequest(request);
      const payload = createUpdateUserProfileRequestSchema.parse(request.body);
      const response = await this.usersService.updateProfile(
        tokenPayload.sub,
        payload,
      );

      return reply.status(200).send(response);
    } catch (error) {
      return this.handleError(error, request, reply, {
        zodMessage: "Invalid user profile payload",
        zodStatusCode: 400,
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
    options: {
      zodMessage: string;
      zodStatusCode: number;
    },
  ) {
    if (error instanceof AccessTokenError) {
      return reply.status(401).send({
        message: error.message,
      });
    }

    if (error instanceof DownstreamUserError) {
      const statusCode =
        error.statusCode >= 400 && error.statusCode < 500
          ? error.statusCode
          : 502;

      return reply.status(statusCode).send(
        error.payload ?? {
          message: "User service request failed",
        },
      );
    }

    if (error instanceof ZodError) {
      return reply.status(options.zodStatusCode).send({
        message: options.zodMessage,
        issues: error.flatten(),
      });
    }

    request.log.error(error, "Failed to process user request");
    return reply.status(502).send({
      message: "Failed to process user request",
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
