import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AuthError } from "@/modules/auth/auth.errors";
import type { AuthServicePort } from "@/modules/auth/auth.service";
import {
  refreshTokenRequestSchema,
  refreshTokenResponseSchema,
  logoutRequestSchema,
  logoutResponseSchema,
  requestOtpRequestSchema,
  requestOtpResponseSchema,
  verifyOtpRequestSchema,
  verifyOtpResponseSchema,
} from "@/modules/auth/schemas/auth.schema";

export class AuthController {
  constructor(private readonly authService: AuthServicePort) {}

  requestOtp = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = requestOtpRequestSchema.parse(request.body);
      const response = requestOtpResponseSchema.parse(
        await this.authService.requestOtp(payload, {
          ipAddress: getHeader(request, "x-client-ip") ?? request.ip,
          deviceId: getHeader(request, "x-device-id"),
        }),
      );

      return reply.status(202).send(response);
    } catch (error) {
      return this.handleError(error, request, reply, "Invalid OTP request");
    }
  };

  verifyOtp = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = verifyOtpRequestSchema.parse(request.body);
      const response = verifyOtpResponseSchema.parse(
        await this.authService.verifyOtp(payload),
      );

      return reply.status(200).send(response);
    } catch (error) {
      return this.handleError(
        error,
        request,
        reply,
        "Invalid OTP verification",
      );
    }
  };

  refresh = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = refreshTokenRequestSchema.parse(request.body);
      const response = refreshTokenResponseSchema.parse(
        await this.authService.refresh(payload.refreshToken),
      );

      return reply.status(200).send(response);
    } catch (error) {
      return this.handleError(error, request, reply, "Invalid token refresh");
    }
  };

  logout = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = logoutRequestSchema.parse(request.body);
      const response = logoutResponseSchema.parse(
        await this.authService.logout(payload.refreshToken),
      );

      return reply.status(200).send(response);
    } catch (error) {
      return this.handleError(error, request, reply, "Invalid logout request");
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

    if (error instanceof AuthError) {
      return reply.status(error.statusCode).send({
        message: error.message,
        code: error.code,
      });
    }

    request.log.error(error, "Auth request failed");
    return reply.status(500).send({
      message: "Auth request failed",
    });
  }
}

function getHeader(request: FastifyRequest, name: string) {
  const value = request.headers[name];

  return Array.isArray(value) ? value[0] : value;
}
