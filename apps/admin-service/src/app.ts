import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "@/config/env";
import { registerHealthRoutes } from "@/modules/health/health.routes";

export function createApp() {
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

  void registerHealthRoutes(app);

  return app;
}
