import { createApp } from "@/app";
import { env } from "@/config/env";
import { DrizzleDeviceInstallationRepository } from "@/modules/device-installations/device-installations.repository";
import { startNotificationEventsConsumer } from "@/modules/notification-events/notification-events.consumer";
import { NotificationEventsService } from "@/modules/notification-events/notification-events.service";
import { ExpoPushProvider } from "@/modules/push/expo-push.provider";

async function bootstrap() {
  const app = createApp();
  let notificationEventsConsumer:
    | Awaited<ReturnType<typeof startNotificationEventsConsumer>>
    | undefined;

  try {
    await app.listen({
      host: env.HOST,
      port: env.PORT,
    });

    notificationEventsConsumer = await startNotificationEventsConsumer({
      rabbitmqUrl: env.RABBITMQ_URL,
      exchangeName: env.NOTIFICATION_EVENTS_EXCHANGE,
      queueName: env.NOTIFICATION_EVENTS_QUEUE,
      bindings: env.NOTIFICATION_EVENTS_BINDINGS.split(",")
        .map((binding) => binding.trim())
        .filter(Boolean),
      logger: app.log,
      notificationEventsService: new NotificationEventsService(
        new DrizzleDeviceInstallationRepository(),
        new ExpoPushProvider(env.EXPO_PUSH_API_URL),
      ),
    });

    const shutdown = async () => {
      await notificationEventsConsumer?.close();
      await app.close();
      process.exit(0);
    };

    process.on("SIGINT", () => {
      void shutdown();
    });

    process.on("SIGTERM", () => {
      void shutdown();
    });
  } catch (error) {
    app.log.error(error);
    await notificationEventsConsumer?.close().catch(() => undefined);
    await app.close().catch(() => undefined);
    process.exit(1);
  }
}

void bootstrap();
