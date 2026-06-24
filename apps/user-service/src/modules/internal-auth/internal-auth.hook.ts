import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "@/config/env";

export const requireInternalServiceSecret = fp(
  async (app) => {
    app.addHook(
      "preHandler",
      async (request: FastifyRequest, reply: FastifyReply) => {
        if (request.url === "/health") {
          return;
        }

        const secret = request.headers["x-internal-service-secret"];

        if (secret !== env.INTERNAL_SERVICE_SECRET) {
          return reply.status(401).send({
            message: "Unauthorized",
          });
        }
      },
    );
  },
  {
    name: "require-internal-service-secret",
  },
);
