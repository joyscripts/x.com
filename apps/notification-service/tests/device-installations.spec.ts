import type {
  RegisterDeviceInstallationRequest,
  RegisterDeviceInstallationResponse,
} from "@repo/contracts";
import { createApp } from "@/app";
import type { DeviceInstallationServicePort } from "@/modules/device-installations/device-installations.service";

class FakeDeviceInstallationService implements DeviceInstallationServicePort {
  async registerInstallation(
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
        createdAt: new Date("2025-01-01T00:00:00.000Z").toISOString(),
        updatedAt: new Date("2025-01-01T00:00:00.000Z").toISOString(),
        lastRegisteredAt: new Date("2025-01-01T00:00:00.000Z").toISOString(),
      },
    };
  }
}

describe("device installations route", () => {
  it("registers an installation payload", async () => {
    const app = createApp({
      deviceInstallationService: new FakeDeviceInstallationService(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/device-installations",
      headers: {
        "x-internal-service-secret": "dev-internal-service-secret",
      },
      payload: {
        installationId: "1bf49483-2be3-4c6f-af77-c08f6955c818",
        platform: "android",
        pushProvider: "expo",
        deviceToken: "token-123",
        appVariant: "development",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      status: "registered",
      installation: {
        installationId: "1bf49483-2be3-4c6f-af77-c08f6955c818",
        platform: "android",
        pushProvider: "expo",
      },
    });
  });

  it("rejects invalid payloads", async () => {
    const app = createApp({
      deviceInstallationService: new FakeDeviceInstallationService(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/device-installations",
      headers: {
        "x-internal-service-secret": "dev-internal-service-secret",
      },
      payload: {
        installationId: "not-a-uuid",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      message: "Invalid device installation payload",
    });
  });

  it("rejects requests without the internal service secret", async () => {
    const app = createApp({
      deviceInstallationService: new FakeDeviceInstallationService(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/device-installations",
      payload: {
        installationId: "1bf49483-2be3-4c6f-af77-c08f6955c818",
        platform: "android",
        pushProvider: "expo",
        deviceToken: "token-123",
        appVariant: "development",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      message: "Unauthorized",
    });
  });
});
