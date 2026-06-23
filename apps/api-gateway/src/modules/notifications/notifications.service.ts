import type {
  ListInAppNotificationsResponse,
  MarkInAppNotificationReadResponse,
  RegisterDeviceInstallationRequest,
  RegisterDeviceInstallationResponse,
} from "@repo/contracts";
import {
  createListInAppNotificationsResponseSchema,
  createMarkInAppNotificationReadResponseSchema,
} from "@/modules/notifications/schemas/in-app-notifications.schema";
import { createNotificationRegistrationResponseSchema } from "@/modules/notifications/schemas/notification-registration.schema";

export interface NotificationRegistrationServicePort {
  registerDeviceInstallation(
    input: RegisterDeviceInstallationRequest,
  ): Promise<RegisterDeviceInstallationResponse>;
  listInAppNotifications(
    userId: string,
  ): Promise<ListInAppNotificationsResponse>;
  markInAppNotificationRead(
    notificationId: string,
  ): Promise<MarkInAppNotificationReadResponse>;
}

export class HttpNotificationRegistrationService implements NotificationRegistrationServicePort {
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

  async listInAppNotifications(
    userId: string,
  ): Promise<ListInAppNotificationsResponse> {
    const url = new URL(
      `${this.notificationServiceUrl.replace(/\/$/, "")}/notifications`,
    );
    url.searchParams.set("userId", userId);

    const response = await fetch(url, {
      headers: {
        "x-internal-service-secret": this.internalServiceSecret,
      },
    });
    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new Error(
        `Notification service request failed with HTTP ${response.status}: ${JSON.stringify(payload)}`,
      );
    }

    return createListInAppNotificationsResponseSchema.parse(payload);
  }

  async markInAppNotificationRead(
    notificationId: string,
  ): Promise<MarkInAppNotificationReadResponse> {
    const response = await fetch(
      `${this.notificationServiceUrl.replace(/\/$/, "")}/notifications/${notificationId}/read`,
      {
        method: "POST",
        headers: {
          "x-internal-service-secret": this.internalServiceSecret,
        },
      },
    );
    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new Error(
        `Notification service request failed with HTTP ${response.status}: ${JSON.stringify(payload)}`,
      );
    }

    return createMarkInAppNotificationReadResponseSchema.parse(payload);
  }
}
