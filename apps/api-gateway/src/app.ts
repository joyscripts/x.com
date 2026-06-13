import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "@/config/env";
import { registerHealthRoutes } from "@/modules/health/health.routes";
import { registerNotificationRoutes } from "@/modules/notifications/notifications.routes";
import {
  HttpNotificationRegistrationService,
  type NotificationRegistrationServicePort,
} from "@/modules/notifications/notifications.service";

type CreateAppOptions = {
  notificationRegistrationService?: NotificationRegistrationServicePort;
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

  const notificationRegistrationService =
    options.notificationRegistrationService ??
    new HttpNotificationRegistrationService(
      env.NOTIFICATION_SERVICE_URL,
      env.INTERNAL_SERVICE_SECRET,
    );

  void registerHealthRoutes(app);
  void registerNotificationRoutes(app, notificationRegistrationService);

  return app;
}
