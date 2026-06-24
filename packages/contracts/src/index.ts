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

export const otpTypeSchema = z.enum(["signup", "login"]);
export type OtpType = z.infer<typeof otpTypeSchema>;

export const phoneNumberSchema = z
  .string()
  .trim()
  .min(8)
  .max(20)
  .regex(/^\+?[1-9]\d{7,19}$/);

export const authRequestOtpRequestSchema = z.object({
  phoneNumber: phoneNumberSchema,
  otpType: otpTypeSchema,
});

export type AuthRequestOtpRequest = z.infer<
  typeof authRequestOtpRequestSchema
>;

export const authRequestOtpResponseSchema = z.object({
  status: z.literal("otp_sent"),
  phoneNumber: phoneNumberSchema,
  otpType: otpTypeSchema,
  expiresInSeconds: z.number().int().positive(),
});

export type AuthRequestOtpResponse = z.infer<
  typeof authRequestOtpResponseSchema
>;

export const authVerifyOtpRequestSchema = z.object({
  phoneNumber: phoneNumberSchema,
  otpType: otpTypeSchema,
  otpCode: z.string().regex(/^\d{6}$/),
});

export type AuthVerifyOtpRequest = z.infer<
  typeof authVerifyOtpRequestSchema
>;

export const authSessionSchema = z.object({
  userId: z.string().min(1),
  phoneNumber: phoneNumberSchema,
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenType: z.literal("Bearer"),
  expiresInSeconds: z.number().int().positive(),
  refreshExpiresInSeconds: z.number().int().positive(),
});

export type AuthSession = z.infer<typeof authSessionSchema>;

export const authVerifyOtpResponseSchema = z.object({
  status: z.literal("authenticated"),
  session: authSessionSchema,
});

export type AuthVerifyOtpResponse = z.infer<
  typeof authVerifyOtpResponseSchema
>;

export const authRefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export type AuthRefreshTokenRequest = z.infer<
  typeof authRefreshTokenRequestSchema
>;

export const authRefreshTokenResponseSchema = z.object({
  status: z.literal("refreshed"),
  session: authSessionSchema,
});

export type AuthRefreshTokenResponse = z.infer<
  typeof authRefreshTokenResponseSchema
>;

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  phoneNumber: phoneNumberSchema,
  handle: z.string().min(1),
  displayName: z.string().min(1),
  bio: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const bootstrapUserRequestSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

export type BootstrapUserRequest = z.infer<
  typeof bootstrapUserRequestSchema
>;

export const bootstrapUserResponseSchema = z.object({
  user: userProfileSchema,
});

export type BootstrapUserResponse = z.infer<
  typeof bootstrapUserResponseSchema
>;

export const getUserResponseSchema = z.object({
  user: userProfileSchema,
});

export type GetUserResponse = z.infer<typeof getUserResponseSchema>;

export const userHandleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(15)
  .regex(/^[a-z0-9_]+$/);

export const updateUserProfileRequestSchema = z.object({
  handle: userHandleSchema,
  displayName: z.string().trim().min(1).max(50),
  bio: z.string().trim().max(160).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export type UpdateUserProfileRequest = z.infer<
  typeof updateUserProfileRequestSchema
>;

export const updateUserProfileResponseSchema = z.object({
  user: userProfileSchema,
});

export type UpdateUserProfileResponse = z.infer<
  typeof updateUserProfileResponseSchema
>;

export const postContentSchema = z.string().trim().min(1).max(280);

export const postSchema = z.object({
  id: z.string().uuid(),
  authorId: z.string().uuid(),
  content: postContentSchema,
  replyToPostId: z.string().uuid().nullable(),
  repostOfPostId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

export type Post = z.infer<typeof postSchema>;

export const createPostRequestSchema = z.object({
  content: postContentSchema,
  replyToPostId: z.string().uuid().nullable().optional(),
  repostOfPostId: z.string().uuid().nullable().optional(),
});

export type CreatePostRequest = z.infer<typeof createPostRequestSchema>;

export const createPostResponseSchema = z.object({
  post: postSchema,
});

export type CreatePostResponse = z.infer<typeof createPostResponseSchema>;

export const getPostResponseSchema = z.object({
  post: postSchema,
});

export type GetPostResponse = z.infer<typeof getPostResponseSchema>;

export const listPostsRequestSchema = z.object({
  authorId: z.string().uuid().optional(),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type ListPostsRequest = z.infer<typeof listPostsRequestSchema>;

export const listPostsResponseSchema = z.object({
  posts: z.array(postSchema),
  nextCursor: z.string().nullable(),
});

export type ListPostsResponse = z.infer<typeof listPostsResponseSchema>;

export const deletePostResponseSchema = z.object({
  post: postSchema,
});

export type DeletePostResponse = z.infer<typeof deletePostResponseSchema>;

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
