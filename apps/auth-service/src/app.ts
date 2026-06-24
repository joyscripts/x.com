import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "@/config/env";
import { DrizzleAuthSessionRepository } from "@/modules/auth/auth.repository";
import { registerAuthRoutes } from "@/modules/auth/auth.routes";
import { AuthService, type AuthServicePort } from "@/modules/auth/auth.service";
import { RabbitMqNotificationEventsPublisher } from "@/modules/auth/notification-events.publisher";
import { RedisOtpStore } from "@/modules/auth/otp.store";
import { HttpUsersClient } from "@/modules/auth/users.client";
import { registerHealthRoutes } from "@/modules/health/health.routes";
import { requireInternalServiceSecret } from "@/modules/internal-auth/internal-auth.hook";

type CreateAppOptions = {
  authService?: AuthServicePort;
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
  void app.register(requireInternalServiceSecret);

  const authService =
    options.authService ??
    new AuthService(
      new RedisOtpStore(env.REDIS_URL),
      new DrizzleAuthSessionRepository(),
      new RabbitMqNotificationEventsPublisher(
        env.RABBITMQ_URL,
        env.NOTIFICATION_EVENTS_EXCHANGE,
      ),
      new HttpUsersClient(env.USER_SERVICE_URL, env.INTERNAL_SERVICE_SECRET),
    );

  if (!options.authService) {
    app.addHook("onClose", async () => {
      await authService.close?.();
    });
  }

  void registerHealthRoutes(app);
  void registerAuthRoutes(app, authService);

  return app;
}
