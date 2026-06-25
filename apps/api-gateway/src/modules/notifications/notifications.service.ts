import type {
  ListInAppNotificationsResponse,
  MarkInAppNotificationReadResponse,
  RegisterDeviceInstallationRequest,
  RegisterDeviceInstallationResponse,
} from "@repo/contracts";
import {
  DownstreamServiceError,
  InternalHttpClient,
} from "@/lib/internal-http-client";
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
  private readonly client: InternalHttpClient;

  constructor(notificationServiceUrl: string, internalServiceSecret: string) {
    this.client = new InternalHttpClient(
      "Notification service",
      notificationServiceUrl,
      internalServiceSecret,
    );
  }

  async registerDeviceInstallation(
    input: RegisterDeviceInstallationRequest,
  ): Promise<RegisterDeviceInstallationResponse> {
    const payload = await this.request("/device-installations", {
      method: "POST",
      body: input,
    });

    return createNotificationRegistrationResponseSchema.parse(payload);
  }

  async listInAppNotifications(
    userId: string,
  ): Promise<ListInAppNotificationsResponse> {
    const url = new URL(this.client.resolveUrl("/notifications"));
    url.searchParams.set("userId", userId);

    const payload = await this.request(url);

    return createListInAppNotificationsResponseSchema.parse(payload);
  }

  async markInAppNotificationRead(
    notificationId: string,
  ): Promise<MarkInAppNotificationReadResponse> {
    const payload = await this.request(
      `/notifications/${notificationId}/read`,
      {
        method: "POST",
      },
    );

    return createMarkInAppNotificationReadResponseSchema.parse(payload);
  }

  private async request(
    pathOrUrl: string | URL,
    options: Parameters<InternalHttpClient["requestJson"]>[1] = {},
  ) {
    try {
      return await this.client.requestJson(pathOrUrl, options);
    } catch (error) {
      if (error instanceof DownstreamServiceError) {
        throw new Error(error.message, { cause: error });
      }
      throw error;
    }
  }
}
