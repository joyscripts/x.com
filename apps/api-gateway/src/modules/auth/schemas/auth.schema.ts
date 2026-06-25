import {
  authRefreshTokenRequestSchema,
  authRefreshTokenResponseSchema,
  authLogoutRequestSchema,
  authLogoutResponseSchema,
  authRequestOtpRequestSchema,
  authRequestOtpResponseSchema,
  authVerifyOtpRequestSchema,
  authVerifyOtpResponseSchema,
} from "@repo/contracts";

export const requestOtpRequestSchema = authRequestOtpRequestSchema;
export const requestOtpResponseSchema = authRequestOtpResponseSchema;
export const verifyOtpRequestSchema = authVerifyOtpRequestSchema;
export const verifyOtpResponseSchema = authVerifyOtpResponseSchema;
export const refreshTokenRequestSchema = authRefreshTokenRequestSchema;
export const refreshTokenResponseSchema = authRefreshTokenResponseSchema;
export const logoutRequestSchema = authLogoutRequestSchema;
export const logoutResponseSchema = authLogoutResponseSchema;
