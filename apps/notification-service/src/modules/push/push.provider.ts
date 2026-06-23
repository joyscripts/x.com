export type PushMessage = {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
};

export type PushDeliveryResult = {
  acceptedCount: number;
  rejectedTokens: string[];
};

export interface PushProvider {
  send(messages: PushMessage[]): Promise<PushDeliveryResult>;
}
