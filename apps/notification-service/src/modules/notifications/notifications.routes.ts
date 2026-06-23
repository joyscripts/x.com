import type { FastifyInstance } from "fastify";
import { NotificationsController } from "@/modules/notifications/notifications.controller";
import type { NotificationsServicePort } from "@/modules/notifications/notifications.service";

export async function registerNotificationRoutes(
  app: FastifyInstance,
  service: NotificationsServicePort,
) {
  const controller = new NotificationsController(service);

  app.get("/notifications", controller.listNotifications);
  app.post(
    "/notifications/:notificationId/read",
    controller.markNotificationRead,
  );
}
