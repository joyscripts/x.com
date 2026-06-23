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
import { requireInternalServiceSecret } from "@/modules/internal-auth/internal-auth.hook";
import { DrizzleNotificationsRepository } from "@/modules/notifications/notifications.repository";
import { registerNotificationRoutes } from "@/modules/notifications/notifications.routes";
import {
  NotificationsService,
  type NotificationsServicePort,
} from "@/modules/notifications/notifications.service";

type CreateAppOptions = {
  deviceInstallationService?: DeviceInstallationServicePort;
  notificationsService?: NotificationsServicePort;
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
  app.addHook("preHandler", requireInternalServiceSecret);

  const deviceInstallationService =
    options.deviceInstallationService ??
    new DeviceInstallationService(new DrizzleDeviceInstallationRepository());
  const notificationsService =
    options.notificationsService ??
    new NotificationsService(new DrizzleNotificationsRepository());

  void registerHealthRoutes(app);
  void registerDeviceInstallationRoutes(app, deviceInstallationService);
  void registerNotificationRoutes(app, notificationsService);

  return app;
}
