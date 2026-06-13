import Colors from "@/constants/Colors";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import type { AppPushToken } from "@/lib/device-installations";

type UseDevicePushTokenOptions = {
  enabled: boolean;
};

export default function useDevicePushToken({
  enabled,
}: UseDevicePushTokenOptions) {
  const [devicePushToken, setDevicePushToken] =
    useState<AppPushToken | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(enabled && Platform.OS !== "web");

  useEffect(() => {
    if (!enabled || Platform.OS === "web") {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

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

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;

        if (!projectId) {
          throw new Error("Expo projectId is missing for push registration");
        }

        const token = await Notifications.getExpoPushTokenAsync({
          projectId,
        });

        if (isMounted) {
          setDevicePushToken({
            type: "expo",
            data: token.data,
          });
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError
              : new Error("Failed to get Expo push token"),
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadToken();

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  return {
    devicePushToken,
    isLoading,
    error,
  };
}
