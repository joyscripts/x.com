import type { NotificationRequestedEvent } from "@repo/contracts";
import type { DeviceInstallationRepository } from "@/modules/device-installations/device-installations.repository";
import type {
  NotificationDeliveriesRepository,
  RecordDeliveryInput,
} from "@/modules/notification-deliveries/notification-deliveries.repository";
import { EmailChannelHandler } from "@/modules/notification-channels/email/email-channel.handler";
import type {
  EmailMessage,
  EmailProvider,
} from "@/modules/notification-channels/email/email.provider";
import { InAppChannelHandler } from "@/modules/notification-channels/in-app/in-app-channel.handler";
import type {
  PushDeliveryResult,
  PushMessage,
  PushProvider,
} from "@/modules/notification-channels/push/push.provider";
import { PushChannelHandler } from "@/modules/notification-channels/push/push-channel.handler";
import { SmsChannelHandler } from "@/modules/notification-channels/sms/sms-channel.handler";
import type {
  SmsMessage,
  SmsProvider,
} from "@/modules/notification-channels/sms/sms.provider";
import { NotificationEventsService } from "@/modules/notification-events/notification-events.service";
import type {
  NotificationsRepository,
  CreateNotificationInput,
} from "@/modules/notifications/notifications.repository";
class FakePushProvider implements PushProvider {
  public readonly sentMessages: PushMessage[] = [];

  async send(messages: PushMessage[]) {
    this.sentMessages.push(...messages);

    const result: PushDeliveryResult = {
      acceptedCount: messages.length,
      rejectedTokens: [],
    };

    return result;
  }
}

class FakeEmailProvider implements EmailProvider {
  public readonly sentMessages: EmailMessage[] = [];

  async send(message: EmailMessage) {
    this.sentMessages.push(message);

    return {
      acceptedCount: 1,
    };
  }
}

class FakeSmsProvider implements SmsProvider {
  public readonly sentMessages: SmsMessage[] = [];

  async send(message: SmsMessage) {
    this.sentMessages.push(message);

    return {
      acceptedCount: 1,
    };
  }
}

class FakeNotificationsRepository implements NotificationsRepository {
  public readonly createdNotifications: CreateNotificationInput[] = [];

  async createFromEvent(input: CreateNotificationInput) {
    this.createdNotifications.push(input);

    return {
      notificationId: "1bf49483-2be3-4c6f-af77-c08f6955c818",
      eventId: input.event.eventId,
      recipientUserId: input.event.recipientUserId,
      actorUserId: input.event.actorUserId,
      type: input.event.type,
      templateKey: input.event.templateKey,
      entityType: input.event.entityType,
      entityId: input.event.entityId,
      title: input.content.title,
      body: input.content.body,
      data: input.content.data,
      readAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    };
  }

  async listByRecipientUserId() {
    return [];
  }

  async markRead() {
    return undefined;
  }
}

class FakeNotificationDeliveriesRepository implements NotificationDeliveriesRepository {
  public readonly recordedDeliveries: RecordDeliveryInput[] = [];

  async record(input: RecordDeliveryInput) {
    this.recordedDeliveries.push(input);

    return {
      deliveryId: "2bf49483-2be3-4c6f-af77-c08f6955c818",
      eventId: input.event.eventId,
      notificationId: input.notificationId ?? null,
      recipientUserId: input.event.recipientUserId,
      channel: input.channel,
      provider: input.provider,
      status: input.status,
      detail: input.detail ?? null,
      attemptedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
  }
}

function createService({
  deviceInstallationRepository,
  notificationsRepository = new FakeNotificationsRepository(),
  deliveriesRepository = new FakeNotificationDeliveriesRepository(),
  pushProvider = new FakePushProvider(),
  emailProvider = new FakeEmailProvider(),
  smsProvider = new FakeSmsProvider(),
}: {
  deviceInstallationRepository: Pick<
    DeviceInstallationRepository,
    "listInstallationsByUserId"
  >;
  notificationsRepository?: NotificationsRepository;
  deliveriesRepository?: NotificationDeliveriesRepository;
  pushProvider?: PushProvider;
  emailProvider?: EmailProvider;
  smsProvider?: SmsProvider;
}) {
  return new NotificationEventsService([
    new InAppChannelHandler(notificationsRepository, deliveriesRepository),
    new PushChannelHandler(
      deviceInstallationRepository,
      pushProvider,
      deliveriesRepository,
    ),
    new EmailChannelHandler(emailProvider, deliveriesRepository),
    new SmsChannelHandler(smsProvider, deliveriesRepository),
  ]);
}

function createRabbitMqPingEvent(
  channels: NotificationRequestedEvent["channels"],
): NotificationRequestedEvent {
  return {
    eventId: "6ce19327-d8c1-4d18-9762-6eca50200b2a",
    type: "rabbitmq.ping",
    actorUserId: "system",
    recipientUserId: "test-user",
    entityType: "system",
    entityId: "6ce19327-d8c1-4d18-9762-6eca50200b2a",
    channels,
    templateKey: "rabbitmq_ping",
    data: {
      message: "hello from test",
    },
    occurredAt: "2026-06-13T10:00:00.000Z",
  };
}

describe("notification events service", () => {
  it("logs auth OTP events through the sms channel", async () => {
    const smsProvider = new FakeSmsProvider();
    const service = createService({
      deviceInstallationRepository: {
        async listInstallationsByUserId() {
          return [];
        },
      },
      smsProvider,
    });

    const result = await service.handleRequestedEvent({
      eventId: "4ce19327-d8c1-4d18-9762-6eca50200b2a",
      type: "auth.otp.requested",
      actorUserId: "auth-service",
      recipientUserId: "+15551234567",
      entityType: "auth_otp",
      entityId: "4ce19327-d8c1-4d18-9762-6eca50200b2a",
      channels: ["sms"],
      templateKey: "auth_otp",
      data: {
        phoneNumber: "+15551234567",
        otpType: "signup",
        otpCode: "123456",
      },
      occurredAt: "2026-06-13T10:00:00.000Z",
    });

    expect(result).toEqual({
      matchedInstallationCount: 0,
      inAppNotificationCount: 0,
      pushedInstallationCount: 0,
      emailedNotificationCount: 0,
      smsNotificationCount: 1,
    });
    expect(smsProvider.sentMessages).toEqual([
      expect.objectContaining({
        toUserId: "+15551234567",
        body: "Your signup OTP is 123456. It expires in 10 minutes.",
      }),
    ]);
  });

  it("fans out one event across in-app, push, email, and sms channels", async () => {
    const deviceInstallationRepository: Pick<
      DeviceInstallationRepository,
      "listInstallationsByUserId"
    > = {
      async listInstallationsByUserId() {
        return [
          {
            installationId: "inst-1",
            userId: "test-user",
            platform: "android",
            pushProvider: "fcm",
            deviceToken: "fcm-token-123",
            appVariant: "development",
            appVersion: "1.0.0",
            deviceName: "Pixel",
            deviceModel: "Pixel 9",
            osVersion: "15",
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            updatedAt: new Date("2026-01-01T00:00:00.000Z"),
            lastRegisteredAt: new Date("2026-01-01T00:00:00.000Z"),
          },
        ];
      },
    };
    const pushProvider = new FakePushProvider();
    const emailProvider = new FakeEmailProvider();
    const smsProvider = new FakeSmsProvider();
    const service = createService({
      deviceInstallationRepository,
      pushProvider,
      emailProvider,
      smsProvider,
    });

    const result = await service.handleRequestedEvent(
      createRabbitMqPingEvent(["in_app", "push", "email", "sms"]),
    );

    expect(result).toEqual({
      matchedInstallationCount: 1,
      inAppNotificationCount: 1,
      pushedInstallationCount: 1,
      emailedNotificationCount: 1,
      smsNotificationCount: 1,
    });
    expect(pushProvider.sentMessages).toEqual([
      expect.objectContaining({
        to: "fcm-token-123",
        title: "RabbitMQ ping",
        body: "hello from test",
      }),
    ]);
    expect(emailProvider.sentMessages).toEqual([
      expect.objectContaining({
        toUserId: "test-user",
        subject: "RabbitMQ ping",
        body: "hello from test",
      }),
    ]);
    expect(smsProvider.sentMessages).toEqual([
      expect.objectContaining({
        toUserId: "test-user",
        body: "hello from test",
      }),
    ]);
  });

  it("stores in-app notifications without attempting push delivery", async () => {
    const pushProvider = new FakePushProvider();
    const notificationsRepository = new FakeNotificationsRepository();
    const service = createService({
      deviceInstallationRepository: {
        async listInstallationsByUserId() {
          return [];
        },
      },
      notificationsRepository,
      pushProvider,
    });

    const result = await service.handleRequestedEvent(
      createRabbitMqPingEvent(["in_app"]),
    );

    expect(result).toEqual({
      matchedInstallationCount: 0,
      inAppNotificationCount: 1,
      pushedInstallationCount: 0,
      emailedNotificationCount: 0,
      smsNotificationCount: 0,
    });
    expect(notificationsRepository.createdNotifications).toHaveLength(1);
    expect(pushProvider.sentMessages).toHaveLength(0);
  });
});
