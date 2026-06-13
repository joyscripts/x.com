import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export default function useNotificationPermission() {
  const [permissions, setPermissions] =
    useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(Platform.OS !== "web");

  useEffect(() => {
    if (Platform.OS === "web") {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function requestPermission() {
      try {
        const existingPermissions = await Notifications.getPermissionsAsync();
        let nextPermissions = existingPermissions;

        if (existingPermissions.status !== "granted") {
          nextPermissions = await Notifications.requestPermissionsAsync();
        }

        if (isMounted) {
          setPermissions(nextPermissions);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError
              : new Error("Failed to request notification permissions"),
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void requestPermission();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    permissions,
    isGranted: permissions?.status === "granted",
    isLoading,
    error,
  };
}
