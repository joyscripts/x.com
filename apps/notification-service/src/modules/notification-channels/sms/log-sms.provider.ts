import type { FastifyBaseLogger } from "fastify";
import type {
  SmsDeliveryResult,
  SmsMessage,
  SmsProvider,
} from "@/modules/notification-channels/sms/sms.provider";

export class LogSmsProvider implements SmsProvider {
  constructor(private readonly logger: FastifyBaseLogger) {}

  async send(message: SmsMessage): Promise<SmsDeliveryResult> {
    this.logger.info(
      {
        toUserId: message.toUserId,
        body: message.body,
        data: message.data,
      },
      "SMS notification would be sent",
    );

    return {
      acceptedCount: 1,
    };
  }
}
