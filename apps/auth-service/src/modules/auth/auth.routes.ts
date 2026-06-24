import type { FastifyInstance } from "fastify";
import { AuthController } from "@/modules/auth/auth.controller";
import type { AuthServicePort } from "@/modules/auth/auth.service";

export async function registerAuthRoutes(
  app: FastifyInstance,
  authService: AuthServicePort,
) {
  const controller = new AuthController(authService);

  app.post("/auth/otp/request", controller.requestOtp);
  app.post("/auth/otp/verify", controller.verifyOtp);
  app.post("/auth/refresh", controller.refresh);
}
