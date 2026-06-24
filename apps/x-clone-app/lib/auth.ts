import * as SecureStore from "expo-secure-store";
import type {
  AuthRefreshTokenResponse,
  AuthRequestOtpRequest,
  AuthRequestOtpResponse,
  AuthSession,
  AuthVerifyOtpRequest,
  AuthVerifyOtpResponse,
} from "@repo/contracts";
import { postJson } from "@/lib/api";

const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const SESSION_USER_ID_KEY = "auth_session_user_id";
const SESSION_PHONE_NUMBER_KEY = "auth_session_phone_number";

let refreshPromise: Promise<AuthSession | null> | undefined;

export async function requestAuthOtp(
  payload: AuthRequestOtpRequest,
  signal?: AbortSignal,
) {
  return postJson<AuthRequestOtpResponse>(
    "/auth/otp/request",
    payload,
    signal,
  );
}

export async function verifyAuthOtp(
  payload: AuthVerifyOtpRequest,
  signal?: AbortSignal,
) {
  const response = await postJson<AuthVerifyOtpResponse>(
    "/auth/otp/verify",
    payload,
    signal,
  );

  await saveAuthSession(response.session);

  return response;
}

export async function saveAuthSession(session: AuthSession) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken),
    SecureStore.setItemAsync(SESSION_USER_ID_KEY, session.userId),
    SecureStore.setItemAsync(SESSION_PHONE_NUMBER_KEY, session.phoneNumber),
  ]);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function getStoredAuthSession() {
  const [accessToken, refreshToken, userId, phoneNumber] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(SESSION_USER_ID_KEY),
    SecureStore.getItemAsync(SESSION_PHONE_NUMBER_KEY),
  ]);

  if (!accessToken || !refreshToken || !userId || !phoneNumber) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    userId,
    phoneNumber,
  };
}

export type StoredAuthSession = Awaited<
  ReturnType<typeof getStoredAuthSession>
>;

export async function clearAuthSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(SESSION_USER_ID_KEY),
    SecureStore.deleteItemAsync(SESSION_PHONE_NUMBER_KEY),
  ]);
}

export async function refreshAuthSession() {
  if (!refreshPromise) {
    refreshPromise = refreshAuthSessionOnce().finally(() => {
      refreshPromise = undefined;
    });
  }

  return refreshPromise;
}

async function refreshAuthSessionOnce() {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    await clearAuthSession();
    return null;
  }

  try {
    const response = await postJson<AuthRefreshTokenResponse>(
      "/auth/refresh",
      { refreshToken },
    );

    await saveAuthSession(response.session);

    return response.session;
  } catch (error) {
    await clearAuthSession();
    throw error;
  }
}
