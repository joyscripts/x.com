import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "@/config/env";
import { registerHealthRoutes } from "@/modules/health/health.routes";
import { requireInternalServiceSecret } from "@/modules/internal-auth/internal-auth.hook";
import { registerPostRoutes } from "@/modules/posts/posts.routes";
import { DrizzlePostsRepository } from "@/modules/posts/posts.repository";
import {
  PostsService,
  type PostsServicePort,
} from "@/modules/posts/posts.service";

type CreateAppOptions = {
  postsService?: PostsServicePort;
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

  const postsService =
    options.postsService ?? new PostsService(new DrizzlePostsRepository());

  void registerHealthRoutes(app);
  void registerPostRoutes(app, postsService);

  return app;
}
