import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import type { NotificationRegistrationServicePort } from "@/modules/notifications/notifications.service";
import { createNotificationRegistrationRequestSchema } from "@/modules/notifications/schemas/notification-registration.schema";

export class NotificationsController {
  constructor(
    private readonly notificationRegistrationService: NotificationRegistrationServicePort,
  ) {}

  registerDeviceInstallation = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    try {
      const payload = createNotificationRegistrationRequestSchema.parse(
        request.body,
      );
      const response =
        await this.notificationRegistrationService.registerDeviceInstallation(
          payload,
        );

      return reply.status(201).send(response);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          message: "Invalid device installation payload",
          issues: error.flatten(),
        });
      }

      request.log.error(error, "Failed to register device installation");
      return reply.status(502).send({
        message: "Failed to register device installation",
      });
    }
  };
}
