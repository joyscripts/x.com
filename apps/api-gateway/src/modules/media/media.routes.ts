import type { FastifyInstance } from "fastify";
import type { AccessTokenService } from "@/modules/auth/access-token.service";
import { MediaController } from "@/modules/media/media.controller";
import type { MediaGatewayServicePort } from "@/modules/media/media.service";

export async function registerMediaRoutes(
  app: FastifyInstance,
  accessTokenService: AccessTokenService,
  mediaService: MediaGatewayServicePort,
) {
  const controller = new MediaController(accessTokenService, mediaService);

  app.post("/media/uploads", controller.upload);
  app.get("/media", controller.list);
  app.get("/media/:id/file", controller.getFile);
  app.get("/media/:id/variants/:variantType/file", controller.getVariantFile);
}
