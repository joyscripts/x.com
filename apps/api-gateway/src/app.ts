import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "@/config/env";
import { AccessTokenService } from "@/modules/auth/access-token.service";
import { registerAuthRoutes } from "@/modules/auth/auth.routes";
import {
  HttpAuthGatewayService,
  type AuthGatewayServicePort,
} from "@/modules/auth/auth.service";
import { registerHealthRoutes } from "@/modules/health/health.routes";
import { registerNotificationRoutes } from "@/modules/notifications/notifications.routes";
import {
  HttpNotificationRegistrationService,
  type NotificationRegistrationServicePort,
} from "@/modules/notifications/notifications.service";
import { registerPostRoutes } from "@/modules/posts/posts.routes";
import {
  HttpPostsGatewayService,
  type PostsGatewayServicePort,
} from "@/modules/posts/posts.service";
import { registerUserRoutes } from "@/modules/users/users.routes";
import {
  HttpUsersGatewayService,
  type UsersGatewayServicePort,
} from "@/modules/users/users.service";

type CreateAppOptions = {
  authService?: AuthGatewayServicePort;
  notificationRegistrationService?: NotificationRegistrationServicePort;
  accessTokenService?: AccessTokenService;
  usersService?: UsersGatewayServicePort;
  postsService?: PostsGatewayServicePort;
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

  const accessTokenService =
    options.accessTokenService ?? new AccessTokenService(env.AUTH_JWT_SECRET);
  const authService =
    options.authService ??
    new HttpAuthGatewayService(
      env.AUTH_SERVICE_URL,
      env.INTERNAL_SERVICE_SECRET,
    );
  const notificationRegistrationService =
    options.notificationRegistrationService ??
    new HttpNotificationRegistrationService(
      env.NOTIFICATION_SERVICE_URL,
      env.INTERNAL_SERVICE_SECRET,
    );
  const usersService =
    options.usersService ??
    new HttpUsersGatewayService(
      env.USER_SERVICE_URL,
      env.INTERNAL_SERVICE_SECRET,
    );
  const postsService =
    options.postsService ??
    new HttpPostsGatewayService(
      env.POST_SERVICE_URL,
      env.INTERNAL_SERVICE_SECRET,
    );

  void registerHealthRoutes(app);
  void registerAuthRoutes(app, authService);
  void registerUserRoutes(app, accessTokenService, usersService);
  void registerPostRoutes(app, accessTokenService, postsService);
  void registerNotificationRoutes(app, notificationRegistrationService);

  return app;
}
