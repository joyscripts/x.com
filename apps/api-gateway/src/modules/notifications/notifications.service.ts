import type {
  RegisterDeviceInstallationRequest,
  RegisterDeviceInstallationResponse,
} from "@repo/contracts";
import { createNotificationRegistrationResponseSchema } from "@/modules/notifications/schemas/notification-registration.schema";

export interface NotificationRegistrationServicePort {
  registerDeviceInstallation(
    input: RegisterDeviceInstallationRequest,
  ): Promise<RegisterDeviceInstallationResponse>;
}

export class HttpNotificationRegistrationService
  implements NotificationRegistrationServicePort
{
  constructor(
    private readonly notificationServiceUrl: string,
    private readonly internalServiceSecret: string,
  ) {}

  async registerDeviceInstallation(
    input: RegisterDeviceInstallationRequest,
  ): Promise<RegisterDeviceInstallationResponse> {
    const response = await fetch(
      `${this.notificationServiceUrl.replace(/\/$/, "")}/device-installations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-service-secret": this.internalServiceSecret,
        },
        body: JSON.stringify(input),
      },
    );

    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new Error(
        `Notification service request failed with HTTP ${response.status}: ${JSON.stringify(payload)}`,
      );
    }

    return createNotificationRegistrationResponseSchema.parse(payload);
  }
}
