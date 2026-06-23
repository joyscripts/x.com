import { z } from "zod";

export const serviceMetadataSchema = z.object({
  service: z.string(),
  version: z.string(),
  environment: z.enum(["development", "test", "production"]),
});

export type ServiceMetadata = z.infer<typeof serviceMetadataSchema>;

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  metadata: serviceMetadataSchema,
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const devicePlatformSchema = z.enum(["android", "ios"]);
export type DevicePlatform = z.infer<typeof devicePlatformSchema>;

export const pushProviderSchema = z.enum(["expo", "fcm", "apns"]);
export type PushProvider = z.infer<typeof pushProviderSchema>;

export const registerDeviceInstallationRequestSchema = z.object({
  installationId: z.string().uuid(),
  userId: z.string().min(1).optional(),
  platform: devicePlatformSchema,
  pushProvider: pushProviderSchema,
  deviceToken: z.string().min(1),
  appVariant: z.string().min(1),
  appVersion: z.string().min(1).optional(),
  deviceName: z.string().min(1).optional(),
  deviceModel: z.string().min(1).optional(),
  osVersion: z.string().min(1).optional(),
});

export type RegisterDeviceInstallationRequest = z.infer<
  typeof registerDeviceInstallationRequestSchema
>;

export const deviceInstallationSchema = z.object({
  installationId: z.string().uuid(),
  userId: z.string().min(1).nullable(),
  platform: devicePlatformSchema,
  pushProvider: pushProviderSchema,
  deviceToken: z.string().min(1),
  appVariant: z.string().min(1),
  appVersion: z.string().min(1).nullable(),
  deviceName: z.string().min(1).nullable(),
  deviceModel: z.string().min(1).nullable(),
  osVersion: z.string().min(1).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastRegisteredAt: z.string(),
});

export type DeviceInstallation = z.infer<typeof deviceInstallationSchema>;

export const registerDeviceInstallationResponseSchema = z.object({
  status: z.literal("registered"),
  installation: deviceInstallationSchema,
});

export type RegisterDeviceInstallationResponse = z.infer<
  typeof registerDeviceInstallationResponseSchema
>;

export const inAppNotificationSchema = z.object({
  notificationId: z.string().uuid(),
  eventId: z.string().uuid(),
  recipientUserId: z.string().min(1),
  actorUserId: z.string().min(1),
  type: z.string().min(1),
  templateKey: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});

export type InAppNotification = z.infer<typeof inAppNotificationSchema>;

export const listInAppNotificationsResponseSchema = z.object({
  notifications: z.array(inAppNotificationSchema),
});

export type ListInAppNotificationsResponse = z.infer<
  typeof listInAppNotificationsResponseSchema
>;

export const markInAppNotificationReadResponseSchema = z.object({
  notification: inAppNotificationSchema,
});

export type MarkInAppNotificationReadResponse = z.infer<
  typeof markInAppNotificationReadResponseSchema
>;

export const notificationChannelSchema = z.enum([
  "in_app",
  "push",
  "sms",
  "email",
]);
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;

export const notificationEventDataSchema = z.record(z.string(), z.unknown());
export type NotificationEventData = z.infer<typeof notificationEventDataSchema>;

export const notificationRequestedEventSchema = z.object({
  eventId: z.string().uuid(),
  type: z.string().min(1),
  actorUserId: z.string().min(1),
  recipientUserId: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  channels: z.array(notificationChannelSchema).min(1),
  templateKey: z.string().min(1),
  data: notificationEventDataSchema.default({}),
  occurredAt: z.string().datetime(),
});

export type NotificationRequestedEvent = z.infer<
  typeof notificationRequestedEventSchema
>;
