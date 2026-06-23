import type { FastifyInstance } from "fastify";
import type { DeviceInstallationServicePort } from "@/modules/device-installations/device-installations.service";
import { DeviceInstallationsController } from "@/modules/device-installations/device-installations.controller";

export async function registerDeviceInstallationRoutes(
  app: FastifyInstance,
  service: DeviceInstallationServicePort,
) {
  const controller = new DeviceInstallationsController(service);

  app.post("/device-installations", controller.registerInstallation);
}
