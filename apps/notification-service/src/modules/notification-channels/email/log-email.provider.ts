import type { FastifyBaseLogger } from "fastify";
import type {
  EmailDeliveryResult,
  EmailMessage,
  EmailProvider,
} from "@/modules/notification-channels/email/email.provider";

export class LogEmailProvider implements EmailProvider {
  constructor(private readonly logger: FastifyBaseLogger) {}

  async send(message: EmailMessage): Promise<EmailDeliveryResult> {
    this.logger.info(
      {
        toUserId: message.toUserId,
        subject: message.subject,
        data: message.data,
      },
      "Email notification would be sent",
    );

    return {
      acceptedCount: 1,
    };
  }
}
