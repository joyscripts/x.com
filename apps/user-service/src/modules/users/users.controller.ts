import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { UsersError } from "@/modules/users/users.errors";
import type { UsersServicePort } from "@/modules/users/users.service";
import {
  createBootstrapUserRequestSchema,
  createBootstrapUserResponseSchema,
  createGetUserResponseSchema,
  createUpdateUserProfileRequestSchema,
  createUpdateUserProfileResponseSchema,
  getUserParamsSchema,
} from "@/modules/users/schemas/users.schema";

export class UsersController {
  constructor(private readonly service: UsersServicePort) {}

  bootstrap = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = createBootstrapUserRequestSchema.parse(request.body);
      const response = createBootstrapUserResponseSchema.parse(
        await this.service.bootstrap(payload),
      );

      return reply.status(200).send(response);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          message: "Invalid user bootstrap payload",
          issues: error.flatten(),
        });
      }

      request.log.error(error, "Failed to bootstrap user");
      return reply.status(500).send({
        message: "Failed to bootstrap user",
      });
    }
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = getUserParamsSchema.parse(request.params);
      const response = await this.service.getById(params.id);

      if (!response) {
        return reply.status(404).send({
          message: "User not found",
        });
      }

      return reply.status(200).send(
        createGetUserResponseSchema.parse(response),
      );
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          message: "Invalid user params",
          issues: error.flatten(),
        });
      }

      request.log.error(error, "Failed to fetch user");
      return reply.status(500).send({
        message: "Failed to fetch user",
      });
    }
  };

  updateProfile = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = getUserParamsSchema.parse(request.params);
      const payload = createUpdateUserProfileRequestSchema.parse(request.body);
      const response = createUpdateUserProfileResponseSchema.parse(
        await this.service.updateProfile(params.id, payload),
      );

      return reply.status(200).send(response);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          message: "Invalid user profile payload",
          issues: error.flatten(),
        });
      }

      if (error instanceof UsersError) {
        return reply.status(error.statusCode).send({
          message: error.message,
          code: error.code,
        });
      }

      request.log.error(error, "Failed to update user profile");
      return reply.status(500).send({
        message: "Failed to update user profile",
      });
    }
  };
}
