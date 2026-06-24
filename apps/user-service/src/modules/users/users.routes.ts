import type { FastifyInstance } from "fastify";
import { UsersController } from "@/modules/users/users.controller";
import type { UsersServicePort } from "@/modules/users/users.service";

export async function registerUserRoutes(
  app: FastifyInstance,
  service: UsersServicePort,
) {
  const controller = new UsersController(service);

  app.post("/users/bootstrap", controller.bootstrap);
  app.get("/users/:id", controller.getById);
  app.patch("/users/:id/profile", controller.updateProfile);
}
