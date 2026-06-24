import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import type { OtpType } from "@repo/contracts";
import { useAuthSession } from "@/hooks/use-auth-session";
import { ApiError } from "@/lib/api";
import { requestAuthOtp, verifyAuthOtp } from "@/lib/auth";

type AuthStep = "phone" | "otp";

const otpTypes: Array<{ label: string; value: OtpType }> = [
  { label: "Sign up", value: "signup" },
  { label: "Log in", value: "login" },
];

export default function AuthScreen() {
  const router = useRouter();
  const { reloadSession } = useAuthSession();
  const [step, setStep] = useState<AuthStep>("phone");
  const [otpType, setOtpType] = useState<OtpType>("signup");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedPhoneNumber = useMemo(
    () => phoneNumber.replace(/\s/g, ""),
    [phoneNumber],
  );
  const canSubmitPhone = normalizedPhoneNumber.length >= 8 && !isSubmitting;
  const canSubmitOtp = otpCode.length === 6 && !isSubmitting;

  async function handleRequestOtp() {
    if (!canSubmitPhone) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await requestAuthOtp({
        phoneNumber: normalizedPhoneNumber,
        otpType,
      });
      setStep("otp");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp() {
    if (!canSubmitOtp) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await verifyAuthOtp({
        phoneNumber: normalizedPhoneNumber,
        otpType,
        otpCode,
      });
      await reloadSession();
      router.replace("/(tabs)");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1, backgroundColor: "#000000" }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "space-between",
          paddingHorizontal: 28,
          paddingVertical: 36,
          gap: 32,
        }}
      >
        <View style={{ gap: 40 }}>
          <View
            style={{
              alignItems: "center",
              paddingTop: 20,
            }}
          >
            <Text
              selectable
              style={{
                color: "#F7F9F9",
                fontSize: 34,
                fontWeight: "800",
                lineHeight: 40,
              }}
            >
              X
            </Text>
          </View>

          <View style={{ gap: 22 }}>
            <Text
              selectable
              style={{
                color: "#F7F9F9",
                fontSize: 31,
                fontWeight: "800",
                lineHeight: 36,
              }}
            >
              {step === "phone" ? "See what's happening now." : "Enter your code"}
            </Text>

            {step === "phone" ? (
              <PhoneStep
                canSubmit={canSubmitPhone}
                isSubmitting={isSubmitting}
                otpType={otpType}
                phoneNumber={phoneNumber}
                setOtpType={setOtpType}
                setPhoneNumber={setPhoneNumber}
                onSubmit={handleRequestOtp}
              />
            ) : (
              <OtpStep
                canSubmit={canSubmitOtp}
                isSubmitting={isSubmitting}
                otpCode={otpCode}
                phoneNumber={normalizedPhoneNumber}
                setOtpCode={setOtpCode}
                onBack={() => {
                  setErrorMessage(null);
                  setOtpCode("");
                  setStep("phone");
                }}
                onSubmit={handleVerifyOtp}
              />
            )}

            {errorMessage ? (
              <Text
                selectable
                style={{
                  color: "#F4212E",
                  fontSize: 14,
                  lineHeight: 20,
                }}
              >
                {errorMessage}
              </Text>
            ) : null}
          </View>
        </View>

        <Text
          selectable
          style={{
            color: "#71767B",
            fontSize: 13,
            lineHeight: 18,
          }}
        >
          By continuing, you agree to the X Clone Terms, Privacy Policy, and
          Cookie Use.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PhoneStep({
  canSubmit,
  isSubmitting,
  otpType,
  phoneNumber,
  setOtpType,
  setPhoneNumber,
  onSubmit,
}: {
  canSubmit: boolean;
  isSubmitting: boolean;
  otpType: OtpType;
  phoneNumber: string;
  setOtpType: (value: OtpType) => void;
  setPhoneNumber: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <View style={{ gap: 18 }}>
      <View
        style={{
          flexDirection: "row",
          borderWidth: 1,
          borderColor: "#2F3336",
          borderRadius: 999,
          borderCurve: "continuous",
          padding: 4,
          gap: 4,
        }}
      >
        {otpTypes.map((item) => {
          const selected = item.value === otpType;

          return (
            <Pressable
              key={item.value}
              onPress={() => setOtpType(item.value)}
              style={{
                flex: 1,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                backgroundColor: selected ? "#F7F9F9" : "transparent",
              }}
            >
              <Text
                style={{
                  color: selected ? "#0F1419" : "#F7F9F9",
                  fontSize: 15,
                  fontWeight: "700",
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          borderWidth: 1,
          borderColor: "#2F3336",
          borderRadius: 4,
          borderCurve: "continuous",
          paddingHorizontal: 14,
          paddingVertical: 8,
          gap: 2,
        }}
      >
        <Text
          style={{
            color: "#71767B",
            fontSize: 13,
          }}
        >
          Phone
        </Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="phone-pad"
          onChangeText={setPhoneNumber}
          placeholder="+15551234567"
          placeholderTextColor="#71767B"
          returnKeyType="done"
          style={{
            color: "#F7F9F9",
            fontSize: 20,
            minHeight: 42,
          }}
          textContentType="telephoneNumber"
          value={phoneNumber}
        />
      </View>

      <PrimaryButton
        disabled={!canSubmit}
        isSubmitting={isSubmitting}
        label={otpType === "signup" ? "Create account" : "Log in"}
        onPress={onSubmit}
      />
    </View>
  );
}

function OtpStep({
  canSubmit,
  isSubmitting,
  otpCode,
  phoneNumber,
  setOtpCode,
  onBack,
  onSubmit,
}: {
  canSubmit: boolean;
  isSubmitting: boolean;
  otpCode: string;
  phoneNumber: string;
  setOtpCode: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <View style={{ gap: 18 }}>
      <Text
        selectable
        style={{
          color: "#71767B",
          fontSize: 15,
          lineHeight: 21,
        }}
      >
        We sent a 6-digit code to {phoneNumber}.
      </Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: "#2F3336",
          borderRadius: 4,
          borderCurve: "continuous",
          paddingHorizontal: 14,
          paddingVertical: 8,
          gap: 2,
        }}
      >
        <Text
          style={{
            color: "#71767B",
            fontSize: 13,
          }}
        >
          Verification code
        </Text>
        <TextInput
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={(value) =>
            setOtpCode(value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="123456"
          placeholderTextColor="#71767B"
          returnKeyType="done"
          style={{
            color: "#F7F9F9",
            fontSize: 24,
            letterSpacing: 0,
            minHeight: 46,
          }}
          textContentType="oneTimeCode"
          value={otpCode}
        />
      </View>

      <PrimaryButton
        disabled={!canSubmit}
        isSubmitting={isSubmitting}
        label="Next"
        onPress={onSubmit}
      />

      <Pressable
        onPress={onBack}
        style={{
          minHeight: 44,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: "#F7F9F9",
            fontSize: 15,
            fontWeight: "700",
          }}
        >
          Use a different phone
        </Text>
      </Pressable>
    </View>
  );
}

function PrimaryButton({
  disabled,
  isSubmitting,
  label,
  onPress,
}: {
  disabled: boolean;
  isSubmitting: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 52,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        backgroundColor: disabled ? "#2F3336" : "#F7F9F9",
      }}
    >
      {isSubmitting ? (
        <ActivityIndicator color="#0F1419" />
      ) : (
        <Text
          style={{
            color: disabled ? "#71767B" : "#0F1419",
            fontSize: 16,
            fontWeight: "800",
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function getAuthErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return "That did not go through. Check the phone number or code and try again.";
  }

  return "Something went wrong. Try again.";
}
