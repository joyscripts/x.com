import type { FastifyInstance } from "fastify";
import { env } from "@/config/env";
import type { DeviceInstallationServicePort } from "@/modules/device-installations/device-installations.service";
import { DeviceInstallationsController } from "@/modules/device-installations/device-installations.controller";

export async function registerDeviceInstallationRoutes(
  app: FastifyInstance,
  service: DeviceInstallationServicePort,
) {
  const controller = new DeviceInstallationsController(service);

  app.post("/device-installations", {
    preHandler: async (request, reply) => {
      const internalServiceSecret = request.headers["x-internal-service-secret"];

      if (internalServiceSecret !== env.INTERNAL_SERVICE_SECRET) {
        return reply.status(401).send({
          message: "Unauthorized",
        });
      }
    },
    handler: controller.registerInstallation,
  });
}
