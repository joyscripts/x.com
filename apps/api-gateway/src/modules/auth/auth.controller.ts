import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import {
  type AuthGatewayServicePort,
  DownstreamAuthError,
} from "@/modules/auth/auth.service";
import {
  refreshTokenRequestSchema,
  requestOtpRequestSchema,
  verifyOtpRequestSchema,
} from "@/modules/auth/schemas/auth.schema";

export class AuthController {
  constructor(private readonly authService: AuthGatewayServicePort) {}

  requestOtp = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = requestOtpRequestSchema.parse(request.body);
      const response = await this.authService.requestOtp(payload);

      return reply.status(202).send(response);
    } catch (error) {
      return this.handleError(error, request, reply, "Invalid OTP request");
    }
  };

  verifyOtp = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = verifyOtpRequestSchema.parse(request.body);
      const response = await this.authService.verifyOtp(payload);

      return reply.status(200).send(response);
    } catch (error) {
      return this.handleError(error, request, reply, "Invalid OTP verification");
    }
  };

  refresh = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = refreshTokenRequestSchema.parse(request.body);
      const response = await this.authService.refresh(payload);

      return reply.status(200).send(response);
    } catch (error) {
      return this.handleError(error, request, reply, "Invalid token refresh");
    }
  };

  private handleError(
    error: unknown,
    request: FastifyRequest,
    reply: FastifyReply,
    validationMessage: string,
  ) {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: validationMessage,
        issues: error.flatten(),
      });
    }

    if (error instanceof DownstreamAuthError) {
      const statusCode =
        error.statusCode >= 400 && error.statusCode < 500
          ? error.statusCode
          : 502;

      return reply.status(statusCode).send(error.payload ?? {
        message: "Auth service request failed",
      });
    }

    request.log.error(error, "Gateway auth request failed");
    return reply.status(502).send({
      message: "Gateway auth request failed",
    });
  }
}
