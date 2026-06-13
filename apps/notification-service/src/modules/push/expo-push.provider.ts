export type PushMessage = {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
};

export interface PushProvider {
  send(messages: PushMessage[]): Promise<void>;
}

export class ExpoPushProvider implements PushProvider {
  constructor(private readonly apiUrl: string) {}

  async send(messages: PushMessage[]): Promise<void> {
    if (messages.length === 0) {
      return;
    }

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new Error(
        `Expo push request failed with HTTP ${response.status}: ${JSON.stringify(payload)}`,
      );
    }
  }
}
