export type SmsMessage = {
  toUserId: string;
  body: string;
  data: Record<string, unknown>;
};

export type SmsDeliveryResult = {
  acceptedCount: number;
};

export interface SmsProvider {
  send(message: SmsMessage): Promise<SmsDeliveryResult>;
}
