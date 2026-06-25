import type { FastifyInstance } from "fastify";
import { MediaController } from "@/modules/media/media.controller";
import type { MediaServicePort } from "@/modules/media/media.service";

export async function registerMediaRoutes(
  app: FastifyInstance,
  service: MediaServicePort,
) {
  const controller = new MediaController(service);

  app.post("/media/uploads", controller.upload);
  app.get("/media", controller.list);
  app.patch("/media/:id/processing", controller.completeProcessing);
  app.get("/media/:id/file", controller.getFile);
  app.get("/media/:id/variants/:variantType/file", controller.getVariantFile);
}
