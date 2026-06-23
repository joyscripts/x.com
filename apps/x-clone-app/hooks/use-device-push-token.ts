import Colors from "@/constants/Colors";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import type { AppPushToken } from "@/lib/device-installations";
import { getFirebaseMessaging } from "@/lib/firebase-messaging";

type UseDevicePushTokenOptions = {
  enabled: boolean;
};

export default function useDevicePushToken({
  enabled,
}: UseDevicePushTokenOptions) {
  const [devicePushToken, setDevicePushToken] = useState<AppPushToken | null>(
    null,
  );
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(enabled && Platform.OS !== "web");

  useEffect(() => {
    if (!enabled || Platform.OS === "web") {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const firebaseMessaging = getFirebaseMessaging();

    async function loadToken() {
      try {
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: Colors.dark.tint,
          });
        }

        if (!firebaseMessaging) {
          throw new Error("Firebase messaging is unavailable on this platform");
        }

        if (!firebaseMessaging.isDeviceRegisteredForRemoteMessages) {
          await firebaseMessaging.registerDeviceForRemoteMessages();
        }

        const token = await firebaseMessaging.getToken();

        if (isMounted) {
          setDevicePushToken({
            type: "fcm",
            data: token,
          });
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError
              : new Error("Failed to get FCM token"),
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadToken();

    const unsubscribeTokenRefresh = firebaseMessaging
      ? firebaseMessaging.onTokenRefresh((token: string) => {
          if (!isMounted) {
            return;
          }

          setDevicePushToken({
            type: "fcm",
            data: token,
          });
        })
      : () => undefined;

    return () => {
      isMounted = false;
      unsubscribeTokenRefresh();
    };
  }, [enabled]);

  return {
    devicePushToken,
    isLoading,
    error,
  };
}
