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

const authStorage = {
  async getItem(key: string) {
    if (process.env.EXPO_OS === "web") {
      return globalThis.localStorage?.getItem(key) ?? null;
    }

    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    if (process.env.EXPO_OS === "web") {
      globalThis.localStorage?.setItem(key, value);
      return;
    }

    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string) {
    if (process.env.EXPO_OS === "web") {
      globalThis.localStorage?.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
  },
};

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
    authStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken),
    authStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken),
    authStorage.setItem(SESSION_USER_ID_KEY, session.userId),
    authStorage.setItem(SESSION_PHONE_NUMBER_KEY, session.phoneNumber),
  ]);
}

export async function getAccessToken() {
  return authStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return authStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function getStoredAuthSession() {
  const [accessToken, refreshToken, userId, phoneNumber] = await Promise.all([
    authStorage.getItem(ACCESS_TOKEN_KEY),
    authStorage.getItem(REFRESH_TOKEN_KEY),
    authStorage.getItem(SESSION_USER_ID_KEY),
    authStorage.getItem(SESSION_PHONE_NUMBER_KEY),
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
    authStorage.deleteItem(ACCESS_TOKEN_KEY),
    authStorage.deleteItem(REFRESH_TOKEN_KEY),
    authStorage.deleteItem(SESSION_USER_ID_KEY),
    authStorage.deleteItem(SESSION_PHONE_NUMBER_KEY),
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
