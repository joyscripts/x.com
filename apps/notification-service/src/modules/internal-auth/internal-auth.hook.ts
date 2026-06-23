import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "@/config/env";

const PUBLIC_PATHS = new Set(["/health"]);

export async function requireInternalServiceSecret(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const pathname = new URL(request.url, "http://notification-service.local")
    .pathname;

  if (PUBLIC_PATHS.has(pathname)) {
    return;
  }

  const internalServiceSecret = request.headers["x-internal-service-secret"];

  if (internalServiceSecret !== env.INTERNAL_SERVICE_SECRET) {
    return reply.status(401).send({
      message: "Unauthorized",
    });
  }
}
