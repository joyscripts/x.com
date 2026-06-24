import type { NotificationDefinition } from "@/modules/notification-definitions/notification-definition";

export const authOtpDefinition: NotificationDefinition = {
  templateKey: "auth_otp",
  resolve(event) {
    const otpCode =
      typeof event.data.otpCode === "string" ? event.data.otpCode : "unknown";
    const otpType =
      typeof event.data.otpType === "string" ? event.data.otpType : "auth";

    return {
      title: "X Clone OTP",
      body: `Your ${otpType} OTP is ${otpCode}. It expires in 10 minutes.`,
      data: event.data,
    };
  },
};
