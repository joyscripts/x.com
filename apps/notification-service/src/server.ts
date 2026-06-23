import { createApp } from "@/app";
import { env } from "@/config/env";
import { DrizzleDeviceInstallationRepository } from "@/modules/device-installations/device-installations.repository";
import { DrizzleNotificationDeliveriesRepository } from "@/modules/notification-deliveries/notification-deliveries.repository";
import { EmailChannelHandler } from "@/modules/notification-channels/email/email-channel.handler";
import { LogEmailProvider } from "@/modules/notification-channels/email/log-email.provider";
import { InAppChannelHandler } from "@/modules/notification-channels/in-app/in-app-channel.handler";
import { FcmPushProvider } from "@/modules/notification-channels/push/fcm-push.provider";
import { PushChannelHandler } from "@/modules/notification-channels/push/push-channel.handler";
import { LogSmsProvider } from "@/modules/notification-channels/sms/log-sms.provider";
import { SmsChannelHandler } from "@/modules/notification-channels/sms/sms-channel.handler";
import { startNotificationEventsConsumer } from "@/modules/notification-events/notification-events.consumer";
import { NotificationEventsService } from "@/modules/notification-events/notification-events.service";
import { DrizzleNotificationsRepository } from "@/modules/notifications/notifications.repository";

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

    const deviceInstallationRepository =
      new DrizzleDeviceInstallationRepository();
    const deliveriesRepository = new DrizzleNotificationDeliveriesRepository();
    const notificationsRepository = new DrizzleNotificationsRepository();

    notificationEventsConsumer = await startNotificationEventsConsumer({
      rabbitmqUrl: env.RABBITMQ_URL,
      exchangeName: env.NOTIFICATION_EVENTS_EXCHANGE,
      queueName: env.NOTIFICATION_EVENTS_QUEUE,
      bindings: env.NOTIFICATION_EVENTS_BINDINGS.split(",")
        .map((binding) => binding.trim())
        .filter(Boolean),
      logger: app.log,
      notificationEventsService: new NotificationEventsService([
        new InAppChannelHandler(notificationsRepository, deliveriesRepository),
        new PushChannelHandler(
          deviceInstallationRepository,
          new FcmPushProvider(),
          deliveriesRepository,
        ),
        new EmailChannelHandler(
          new LogEmailProvider(app.log),
          deliveriesRepository,
        ),
        new SmsChannelHandler(
          new LogSmsProvider(app.log),
          deliveriesRepository,
        ),
      ]),
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
