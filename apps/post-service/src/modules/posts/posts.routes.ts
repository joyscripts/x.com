import type { FastifyInstance } from "fastify";
import { PostsController } from "@/modules/posts/posts.controller";
import type { PostsServicePort } from "@/modules/posts/posts.service";

export async function registerPostRoutes(
  app: FastifyInstance,
  service: PostsServicePort,
) {
  const controller = new PostsController(service);

  app.post("/posts", controller.create);
  app.get("/posts", controller.list);
  app.get("/posts/:id", controller.getById);
  app.delete("/posts/:id", controller.delete);
}
