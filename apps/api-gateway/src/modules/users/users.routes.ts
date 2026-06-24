import type { FastifyInstance } from "fastify";
import type { AccessTokenService } from "@/modules/auth/access-token.service";
import { UsersController } from "@/modules/users/users.controller";
import type { UsersGatewayServicePort } from "@/modules/users/users.service";

export async function registerUserRoutes(
  app: FastifyInstance,
  accessTokenService: AccessTokenService,
  usersService: UsersGatewayServicePort,
) {
  const controller = new UsersController(accessTokenService, usersService);

  app.get("/me", controller.getMe);
  app.patch("/me/profile", controller.updateMeProfile);
}
