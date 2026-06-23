import type {
  RegisterDeviceInstallationRequest,
  RegisterDeviceInstallationResponse,
} from "@repo/contracts";
import { createApp } from "@/app";
import type { NotificationRegistrationServicePort } from "@/modules/notifications/notifications.service";

class FakeNotificationRegistrationService implements NotificationRegistrationServicePort {
  async registerDeviceInstallation(
    input: RegisterDeviceInstallationRequest,
  ): Promise<RegisterDeviceInstallationResponse> {
    return {
      status: "registered",
      installation: {
        installationId: input.installationId,
        userId: input.userId ?? null,
        platform: input.platform,
        pushProvider: input.pushProvider,
        deviceToken: input.deviceToken,
        appVariant: input.appVariant,
        appVersion: input.appVersion ?? null,
        deviceName: input.deviceName ?? null,
        deviceModel: input.deviceModel ?? null,
        osVersion: input.osVersion ?? null,
        createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
        updatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
        lastRegisteredAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      },
    };
  }
}

describe("notification routes", () => {
  it("forwards device installation registration through the gateway", async () => {
    const app = createApp({
      notificationRegistrationService:
        new FakeNotificationRegistrationService(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/notifications/device-installations",
      payload: {
        installationId: "1bf49483-2be3-4c6f-af77-c08f6955c818",
        userId: "test-user",
        platform: "android",
        pushProvider: "fcm",
        deviceToken: "fcm-token-123",
        appVariant: "development",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      status: "registered",
      installation: {
        installationId: "1bf49483-2be3-4c6f-af77-c08f6955c818",
        userId: "test-user",
        pushProvider: "fcm",
      },
    });
  });

  it("rejects invalid device installation payloads", async () => {
    const app = createApp({
      notificationRegistrationService:
        new FakeNotificationRegistrationService(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/notifications/device-installations",
      payload: {
        installationId: "not-a-uuid",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      message: "Invalid device installation payload",
    });
  });
});
