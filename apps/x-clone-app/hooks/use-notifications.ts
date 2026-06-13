import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import useDevicePushToken from "@/hooks/use-device-push-token";
import useNotificationPermission from "@/hooks/use-notification-permission";
import useRegisterDeviceInstallation from "@/hooks/use-register-device-installation";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function useNotifications() {
  const permission = useNotificationPermission();

  const devicePushToken = useDevicePushToken({
    enabled: permission.isGranted,
  });

  const registration = useRegisterDeviceInstallation({
    enabled: permission.isGranted,
    devicePushToken: devicePushToken.devicePushToken,
  });

  const [notification, setNotification] =
    useState<Notifications.Notification>();

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    const notificationListener = Notifications.addNotificationReceivedListener(
      (receivedNotification) => {
        setNotification(receivedNotification);
      },
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  useEffect(() => {
    if (permission.error) {
      console.error("Notification permission flow failed", permission.error);
    }
  }, [permission.error]);

  useEffect(() => {
    if (devicePushToken.error) {
      console.error("Expo push token flow failed", devicePushToken.error);
    }
  }, [devicePushToken.error]);

  useEffect(() => {
    if (registration.error) {
      console.error(
        "Device installation registration failed",
        registration.error,
      );
    }
  }, [registration.error]);

  return {
    permission,
    devicePushToken,
    registration,
    notification,
  };
}
