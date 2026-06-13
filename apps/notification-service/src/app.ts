import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "@/config/env";
import { DrizzleDeviceInstallationRepository } from "@/modules/device-installations/device-installations.repository";
import { registerDeviceInstallationRoutes } from "@/modules/device-installations/device-installations.routes";
import {
  DeviceInstallationService,
  type DeviceInstallationServicePort,
} from "@/modules/device-installations/device-installations.service";
import { registerHealthRoutes } from "@/modules/health/health.routes";

type CreateAppOptions = {
  deviceInstallationService?: DeviceInstallationServicePort;
};

export function createApp(options: CreateAppOptions = {}) {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === "development"
          ? {
              target: "pino-pretty",
              options: {
                colorize: true,
              },
            }
          : undefined,
    },
  });

  void app.register(cors, {
    origin: true,
  });

  const deviceInstallationService =
    options.deviceInstallationService ??
    new DeviceInstallationService(new DrizzleDeviceInstallationRepository());

  void registerHealthRoutes(app);
  void registerDeviceInstallationRoutes(app, deviceInstallationService);

  return app;
}
