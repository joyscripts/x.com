import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import {
  getMessaging,
  type MulticastMessage,
  type SendResponse,
} from "firebase-admin/messaging";
import { env } from "@/config/env";
import type {
  PushDeliveryResult,
  PushMessage,
  PushProvider,
} from "@/modules/notification-channels/push/push.provider";

const FIREBASE_APP_NAME = "notification-service-fcm";

function getFirebaseApp(): App {
  if (getApps().some((app) => app.name === FIREBASE_APP_NAME)) {
    return getApp(FIREBASE_APP_NAME);
  }

  const credential = env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? cert(JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON))
    : applicationDefault();

  return initializeApp(
    {
      credential,
      projectId: env.FIREBASE_PROJECT_ID || undefined,
    },
    FIREBASE_APP_NAME,
  );
}

function normalizeFcmData(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).flatMap(([key, value]) => {
      if (value === undefined) {
        return [];
      }

      if (typeof value === "string") {
        return [[key, value]];
      }

      return [[key, JSON.stringify(value)]];
    }),
  );
}

function isInvalidTokenResponse(response: SendResponse) {
  if (response.success || !response.error) {
    return false;
  }

  return [
    "messaging/invalid-registration-token",
    "messaging/registration-token-not-registered",
  ].includes(response.error.code);
}

export class FcmPushProvider implements PushProvider {
  async send(messages: PushMessage[]): Promise<PushDeliveryResult> {
    if (messages.length === 0) {
      return {
        acceptedCount: 0,
        rejectedTokens: [],
      };
    }

    const firstMessage = messages[0];
    const multicastMessage: MulticastMessage = {
      tokens: messages.map((message) => message.to),
      notification: {
        title: firstMessage.title,
        body: firstMessage.body,
      },
      data: normalizeFcmData(firstMessage.data),
      android: {
        priority: "high",
        notification: {
          channelId: "default",
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    const response =
      await getMessaging(getFirebaseApp()).sendEachForMulticast(
        multicastMessage,
      );

    return {
      acceptedCount: response.successCount,
      rejectedTokens: response.responses.flatMap((sendResponse, index) =>
        isInvalidTokenResponse(sendResponse) ? [messages[index]!.to] : [],
      ),
    };
  }
}
