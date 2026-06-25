import type { FastifyInstance } from "fastify";
import type { AccessTokenService } from "@/modules/auth/access-token.service";
import type { MediaGatewayServicePort } from "@/modules/media/media.service";
import { PostsController } from "@/modules/posts/posts.controller";
import type { PostsGatewayServicePort } from "@/modules/posts/posts.service";

export async function registerPostRoutes(
  app: FastifyInstance,
  accessTokenService: AccessTokenService,
  postsService: PostsGatewayServicePort,
  mediaService: MediaGatewayServicePort,
) {
  const controller = new PostsController(
    accessTokenService,
    postsService,
    mediaService,
  );

  app.post("/posts", controller.create);
  app.get("/posts", controller.list);
  app.get("/posts/:id", controller.getById);
  app.delete("/posts/:id", controller.delete);
}
