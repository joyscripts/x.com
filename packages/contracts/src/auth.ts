import { z } from "zod";
import { phoneNumberSchema } from "./common";

export const otpTypeSchema = z.enum(["signup", "login"]);
export type OtpType = z.infer<typeof otpTypeSchema>;

export const authRequestOtpRequestSchema = z.object({
  phoneNumber: phoneNumberSchema,
  otpType: otpTypeSchema,
});

export type AuthRequestOtpRequest = z.infer<typeof authRequestOtpRequestSchema>;

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

export type AuthVerifyOtpRequest = z.infer<typeof authVerifyOtpRequestSchema>;

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

export type AuthVerifyOtpResponse = z.infer<typeof authVerifyOtpResponseSchema>;

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

export const authLogoutRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export type AuthLogoutRequest = z.infer<typeof authLogoutRequestSchema>;

export const authLogoutResponseSchema = z.object({
  status: z.literal("logged_out"),
});

export type AuthLogoutResponse = z.infer<typeof authLogoutResponseSchema>;
