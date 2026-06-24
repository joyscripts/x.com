import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "@/config/env";
import { registerHealthRoutes } from "@/modules/health/health.routes";
import { requireInternalServiceSecret } from "@/modules/internal-auth/internal-auth.hook";
import { registerUserRoutes } from "@/modules/users/users.routes";
import { DrizzleUsersRepository } from "@/modules/users/users.repository";
import {
  UsersService,
  type UsersServicePort,
} from "@/modules/users/users.service";

type CreateAppOptions = {
  usersService?: UsersServicePort;
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

  const usersService =
    options.usersService ??
    new UsersService(new DrizzleUsersRepository());

  void registerHealthRoutes(app);
  void registerUserRoutes(app, usersService);

  return app;
}
