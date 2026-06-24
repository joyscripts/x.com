import {
  bootstrapUserRequestSchema,
  bootstrapUserResponseSchema,
  getUserResponseSchema,
  updateUserProfileRequestSchema,
  updateUserProfileResponseSchema,
} from "@repo/contracts";
import { z } from "zod";

export const createBootstrapUserRequestSchema = bootstrapUserRequestSchema;
export const createBootstrapUserResponseSchema = bootstrapUserResponseSchema;
export const createGetUserResponseSchema = getUserResponseSchema;
export const createUpdateUserProfileRequestSchema =
  updateUserProfileRequestSchema;
export const createUpdateUserProfileResponseSchema =
  updateUserProfileResponseSchema;

export const getUserParamsSchema = z.object({
  id: z.string().uuid(),
});
