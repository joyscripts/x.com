import type { NotificationRequestedEvent } from "@repo/contracts";

export type ResolvedNotification = {
  title: string;
  body: string;
  data: Record<string, unknown>;
};

export interface NotificationDefinition {
  templateKey: string;
  resolve(event: NotificationRequestedEvent): ResolvedNotification;
}
