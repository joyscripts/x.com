import Colors from "@/constants/Colors";
import ExpoNotifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";

ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  try {
    let token;
    if (Platform.OS === "android") {
      await ExpoNotifications.setNotificationChannelAsync(
        process.env.EXPO_APP_BUNDLE_ID!,
        {
          name: "A channel is needed for the permissions",
          importance: ExpoNotifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: Colors["dark"].tint,
        },
      );
    }

    const { status: existingStatus } =
      await ExpoNotifications.getPermissionsAsync();

    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await ExpoNotifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
      if (!projectId) {
        throw new Error("Project ID not found");
      }
      token = (
        await ExpoNotifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(token);
    } catch (e) {
      token = `${e}`;
    }

    return token;
  } catch (e) {
    console.error(e);
  }
}

const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [channels, setChannels] = useState<
    ExpoNotifications.NotificationChannel[]
  >([]);
  const [notification, setNotification] = useState<
    ExpoNotifications.Notification | undefined
  >(undefined);
  const [permissions, setPermissions] =
    useState<ExpoNotifications.NotificationPermissionsStatus>();
  console.log("🚀 ~ useNotifications ~ permissions:", permissions);
  console.log("🚀 ~ useNotifications ~ expoPushToken:", expoPushToken);
  console.log("🚀 ~ useNotifications ~ channels:", channels);
  console.log("🚀 ~ useNotifications ~ notification:", notification);

  useEffect(() => {
    registerForPushNotificationsAsync().then(
      (token) => token && setExpoPushToken(token),
    );
    if (Platform.OS === "android") {
      ExpoNotifications.getNotificationChannelsAsync().then((value) =>
        setChannels(value ?? []),
      );
    }
    const notificationListener =
      ExpoNotifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    const responseListener =
      ExpoNotifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);
};

export default useNotifications;
