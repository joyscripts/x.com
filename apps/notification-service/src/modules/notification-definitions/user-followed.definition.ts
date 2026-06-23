import type { NotificationDefinition } from "@/modules/notification-definitions/notification-definition";

export const userFollowedDefinition: NotificationDefinition = {
  templateKey: "user_followed",
  resolve(event) {
    const actorDisplayName =
      typeof event.data.actorDisplayName === "string"
        ? event.data.actorDisplayName
        : event.actorUserId;

    return {
      title: "New follower",
      body: `${actorDisplayName} followed you`,
      data: event.data,
    };
  },
};
