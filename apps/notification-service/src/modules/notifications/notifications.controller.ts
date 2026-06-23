import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import type { NotificationsServicePort } from "@/modules/notifications/notifications.service";
import {
  listNotificationsQuerySchema,
  markNotificationReadParamsSchema,
} from "@/modules/notifications/schemas/notifications.schema";

export class NotificationsController {
  constructor(private readonly service: NotificationsServicePort) {}

  listNotifications = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listNotificationsQuerySchema.parse(request.query);
      const response = await this.service.listForUser(query.userId);

      return reply.status(200).send(response);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          message: "Invalid notifications query",
          issues: error.flatten(),
        });
      }

      request.log.error(error, "Failed to list notifications");
      return reply.status(500).send({
        message: "Failed to list notifications",
      });
    }
  };

  markNotificationRead = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    try {
      const params = markNotificationReadParamsSchema.parse(request.params);
      const response = await this.service.markRead(params.notificationId);

      if (!response) {
        return reply.status(404).send({
          message: "Notification not found",
        });
      }

      return reply.status(200).send(response);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          message: "Invalid notification params",
          issues: error.flatten(),
        });
      }

      request.log.error(error, "Failed to mark notification read");
      return reply.status(500).send({
        message: "Failed to mark notification read",
      });
    }
  };
}
