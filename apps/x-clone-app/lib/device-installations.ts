import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import type {
  RegisterDeviceInstallationRequest,
  RegisterDeviceInstallationResponse,
} from "@repo/contracts";
import { Platform } from "react-native";
import { postJson } from "@/lib/api";

const PUSH_INSTALLATION_ID_KEY = "push_installation_id";

export type AppPushToken = {
  type: "expo";
  data: string;
};

function createInstallationId() {
  const randomUuid = globalThis.crypto?.randomUUID?.();

  if (randomUuid) {
    return randomUuid;
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export async function getPushInstallationId() {
  const existingInstallationId = await SecureStore.getItemAsync(
    PUSH_INSTALLATION_ID_KEY,
  );

  if (existingInstallationId) {
    return existingInstallationId;
  }

  const installationId = createInstallationId();
  await SecureStore.setItemAsync(PUSH_INSTALLATION_ID_KEY, installationId);

  return installationId;
}

export async function createInstallationRegistrationPayload(
  token: AppPushToken,
): Promise<RegisterDeviceInstallationRequest> {
  return {
    installationId: await getPushInstallationId(),
    userId: process.env.EXPO_PUBLIC_NOTIFICATION_TEST_USER_ID ?? undefined,
    platform: Platform.OS === "ios" ? "ios" : "android",
    pushProvider: "expo",
    deviceToken: token.data,
    appVariant: process.env.EXPO_PUBLIC_APP_VARIANT ?? "development",
    appVersion:
      Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? undefined,
    deviceName: Constants.deviceName ?? undefined,
    osVersion: String(Constants.systemVersion ?? ""),
  };
}

export async function registerDeviceInstallation(
  payload: RegisterDeviceInstallationRequest,
  signal?: AbortSignal,
) {
  return postJson<RegisterDeviceInstallationResponse>(
    "/notifications/device-installations",
    payload,
    signal,
  );
}
