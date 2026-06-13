import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import type { DeviceInstallationServicePort } from "@/modules/device-installations/device-installations.service";
import { createDeviceInstallationRequestSchema } from "@/modules/device-installations/schemas/device-installations.schema";

export class DeviceInstallationsController {
  constructor(
    private readonly service: DeviceInstallationServicePort,
  ) {}

  registerInstallation = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    try {
      const payload = createDeviceInstallationRequestSchema.parse(request.body);
      const response = await this.service.registerInstallation(payload);

      return reply.status(201).send(response);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          message: "Invalid device installation payload",
          issues: error.flatten(),
        });
      }

      request.log.error(error, "Failed to register device installation");
      return reply.status(500).send({
        message: "Failed to register device installation",
      });
    }
  };
}
