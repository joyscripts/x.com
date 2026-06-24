import type { FastifyInstance } from "fastify";
import type { AccessTokenService } from "@/modules/auth/access-token.service";
import { PostsController } from "@/modules/posts/posts.controller";
import type { PostsGatewayServicePort } from "@/modules/posts/posts.service";

export async function registerPostRoutes(
  app: FastifyInstance,
  accessTokenService: AccessTokenService,
  postsService: PostsGatewayServicePort,
) {
  const controller = new PostsController(accessTokenService, postsService);

  app.post("/posts", controller.create);
  app.get("/posts", controller.list);
  app.get("/posts/:id", controller.getById);
  app.delete("/posts/:id", controller.delete);
}
