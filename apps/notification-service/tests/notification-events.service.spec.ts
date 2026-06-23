import type { NotificationRequestedEvent } from "@repo/contracts";
import type { DeviceInstallationRepository } from "@/modules/device-installations/device-installations.repository";
import { NotificationEventsService } from "@/modules/notification-events/notification-events.service";
import type {
  PushDeliveryResult,
  PushMessage,
  PushProvider,
} from "@/modules/push/push.provider";

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

describe("notification events service", () => {
  it("sends push notifications to fcm installations for the recipient", async () => {
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
    const service = new NotificationEventsService(
      deviceInstallationRepository,
      pushProvider,
    );

    const event: NotificationRequestedEvent = {
      eventId: "6ce19327-d8c1-4d18-9762-6eca50200b2a",
      type: "rabbitmq.ping",
      actorUserId: "system",
      recipientUserId: "test-user",
      entityType: "system",
      entityId: "6ce19327-d8c1-4d18-9762-6eca50200b2a",
      channels: ["push"],
      templateKey: "rabbitmq_ping",
      data: {
        message: "hello from test",
      },
      occurredAt: "2026-06-13T10:00:00.000Z",
    };

    const result = await service.handleRequestedEvent(event);

    expect(result).toEqual({
      matchedInstallationCount: 1,
      pushedInstallationCount: 1,
    });
    expect(pushProvider.sentMessages).toEqual([
      expect.objectContaining({
        to: "fcm-token-123",
        title: "RabbitMQ ping",
        body: "hello from test",
      }),
    ]);
  });

  it("skips push delivery when the event does not request push", async () => {
    const deviceInstallationRepository: Pick<
      DeviceInstallationRepository,
      "listInstallationsByUserId"
    > = {
      async listInstallationsByUserId() {
        return [];
      },
    };
    const pushProvider = new FakePushProvider();
    const service = new NotificationEventsService(
      deviceInstallationRepository,
      pushProvider,
    );

    const event: NotificationRequestedEvent = {
      eventId: "b70fac50-c834-4f5e-970f-a18c533d6480",
      type: "rabbitmq.ping",
      actorUserId: "system",
      recipientUserId: "test-user",
      entityType: "system",
      entityId: "b70fac50-c834-4f5e-970f-a18c533d6480",
      channels: ["in_app"],
      templateKey: "rabbitmq_ping",
      data: {},
      occurredAt: "2026-06-13T10:00:00.000Z",
    };

    const result = await service.handleRequestedEvent(event);

    expect(result).toEqual({
      matchedInstallationCount: 0,
      pushedInstallationCount: 0,
    });
    expect(pushProvider.sentMessages).toHaveLength(0);
  });
});
