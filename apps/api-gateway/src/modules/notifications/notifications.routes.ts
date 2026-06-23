import type { FastifyInstance } from "fastify";
import type { NotificationRegistrationServicePort } from "@/modules/notifications/notifications.service";
import { NotificationsController } from "@/modules/notifications/notifications.controller";

export async function registerNotificationRoutes(
  app: FastifyInstance,
  notificationRegistrationService: NotificationRegistrationServicePort,
) {
  const controller = new NotificationsController(
    notificationRegistrationService,
  );

  app.post(
    "/notifications/device-installations",
    controller.registerDeviceInstallation,
  );
  app.get("/notifications", controller.listInAppNotifications);
  app.post(
    "/notifications/:notificationId/read",
    controller.markInAppNotificationRead,
  );
}
