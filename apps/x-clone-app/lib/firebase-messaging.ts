import { Platform } from "react-native";
import type { FirebaseMessagingTypes } from "@react-native-firebase/messaging";

export type FirebaseMessagingModule = FirebaseMessagingTypes.Module | null;

export function getFirebaseMessaging(): FirebaseMessagingModule {
  if (Platform.OS === "web") {
    return null;
  }

  const messagingModule = require("@react-native-firebase/messaging")
    .default as typeof import("@react-native-firebase/messaging").default;

  return messagingModule();
}
