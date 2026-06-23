export type EmailMessage = {
  toUserId: string;
  subject: string;
  body: string;
  data: Record<string, unknown>;
};

export type EmailDeliveryResult = {
  acceptedCount: number;
};

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailDeliveryResult>;
}
