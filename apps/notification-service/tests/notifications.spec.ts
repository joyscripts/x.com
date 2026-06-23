import type {
  ListInAppNotificationsResponse,
  MarkInAppNotificationReadResponse,
} from "@repo/contracts";
import { createApp } from "@/app";
import type { NotificationsServicePort } from "@/modules/notifications/notifications.service";

class FakeNotificationsService implements NotificationsServicePort {
  async listForUser(userId: string): Promise<ListInAppNotificationsResponse> {
    return {
      notifications: [
        {
          notificationId: "1bf49483-2be3-4c6f-af77-c08f6955c818",
          eventId: "6ce19327-d8c1-4d18-9762-6eca50200b2a",
          recipientUserId: userId,
          actorUserId: "system",
          type: "rabbitmq.ping",
          templateKey: "rabbitmq_ping",
          entityType: "system",
          entityId: "6ce19327-d8c1-4d18-9762-6eca50200b2a",
          title: "RabbitMQ ping",
          body: "hello",
          data: {},
          readAt: null,
          createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
        },
      ],
    };
  }

  async markRead(
    notificationId: string,
  ): Promise<MarkInAppNotificationReadResponse | undefined> {
    return {
      notification: {
        notificationId,
        eventId: "6ce19327-d8c1-4d18-9762-6eca50200b2a",
        recipientUserId: "test-user",
        actorUserId: "system",
        type: "rabbitmq.ping",
        templateKey: "rabbitmq_ping",
        entityType: "system",
        entityId: "6ce19327-d8c1-4d18-9762-6eca50200b2a",
        title: "RabbitMQ ping",
        body: "hello",
        data: {},
        readAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
        createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      },
    };
  }
}

describe("notifications routes", () => {
  it("allows health checks without the internal service secret", async () => {
    const app = createApp({
      notificationsService: new FakeNotificationsService(),
    });

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
  });

  it("lists in-app notifications for a user", async () => {
    const app = createApp({
      notificationsService: new FakeNotificationsService(),
    });

    const response = await app.inject({
      method: "GET",
      url: "/notifications?userId=test-user",
      headers: {
        "x-internal-service-secret": "dev-internal-service-secret",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      notifications: [
        {
          recipientUserId: "test-user",
          title: "RabbitMQ ping",
        },
      ],
    });
  });

  it("marks an in-app notification as read", async () => {
    const app = createApp({
      notificationsService: new FakeNotificationsService(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/notifications/1bf49483-2be3-4c6f-af77-c08f6955c818/read",
      headers: {
        "x-internal-service-secret": "dev-internal-service-secret",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      notification: {
        notificationId: "1bf49483-2be3-4c6f-af77-c08f6955c818",
        readAt: "2026-01-01T00:00:00.000Z",
      },
    });
  });

  it("rejects notification reads without the internal service secret", async () => {
    const app = createApp({
      notificationsService: new FakeNotificationsService(),
    });

    const response = await app.inject({
      method: "GET",
      url: "/notifications?userId=test-user",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      message: "Unauthorized",
    });
  });
});
