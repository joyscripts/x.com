import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "@/config/env";
import { registerHealthRoutes } from "@/modules/health/health.routes";
import { requireInternalServiceSecret } from "@/modules/internal-auth/internal-auth.hook";
import { registerMediaRoutes } from "@/modules/media/media.routes";
import {
  MediaOutboxRelay,
  RabbitMqMediaEventsPublisher,
} from "@/modules/media/media-events.publisher";
import { DrizzleMediaRepository } from "@/modules/media/media.repository";
import {
  MediaService,
  type MediaServicePort,
} from "@/modules/media/media.service";
import { S3MediaStorage } from "@/modules/media/media.storage";

type CreateAppOptions = {
  mediaService?: MediaServicePort;
};

const maxRequestBodyBytes = 140 * 1024 * 1024;

export function createApp(options: CreateAppOptions = {}) {
  const app = Fastify({
    bodyLimit: maxRequestBodyBytes,
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

  const repository = new DrizzleMediaRepository();
  const outboxRelay =
    options.mediaService === undefined && env.NODE_ENV !== "test"
      ? new MediaOutboxRelay(
          repository,
          new RabbitMqMediaEventsPublisher(
            env.RABBITMQ_URL,
            env.MEDIA_EVENTS_EXCHANGE,
          ),
        )
      : undefined;
  const mediaService =
    options.mediaService ?? new MediaService(repository, new S3MediaStorage());

  if (outboxRelay) {
    app.addHook("onReady", async () => {
      outboxRelay.start();
    });
    app.addHook("onClose", async () => {
      await outboxRelay.close();
    });
  }

  void registerHealthRoutes(app);
  void registerMediaRoutes(app, mediaService);

  return app;
}
