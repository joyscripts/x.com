import type { FastifyInstance } from "fastify";
import { HealthController } from "@/modules/health/health.controller";
import { HealthService } from "@/modules/health/health.service";

export async function registerHealthRoutes(app: FastifyInstance) {
  const healthController = new HealthController(new HealthService());

  app.get("/health", healthController.getHealth);
}
