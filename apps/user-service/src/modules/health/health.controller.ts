import type { FastifyReply, FastifyRequest } from "fastify";
import { getHealthResponseSchema } from "@/modules/health/schemas/health.schema";
import { HealthService } from "@/modules/health/health.service";

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  getHealth = async (_request: FastifyRequest, reply: FastifyReply) => {
    const result = getHealthResponseSchema.parse(this.healthService.getStatus());

    return reply.status(200).send(result);
  };
}
