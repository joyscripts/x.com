import { z } from "zod";
import { phoneNumberSchema } from "./common";

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

export type BootstrapUserRequest = z.infer<typeof bootstrapUserRequestSchema>;

export const bootstrapUserResponseSchema = z.object({
  user: userProfileSchema,
});

export type BootstrapUserResponse = z.infer<typeof bootstrapUserResponseSchema>;

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
