import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { UserProfile } from "@repo/contracts";
import { ProfileForm } from "@/components/profile/profile-form";
import { useAuthPrivate } from "@/hooks/useAuthPrivate";
import {
  getCurrentUser,
  isDefaultUserProfile,
  updateCurrentUserProfile,
} from "@/lib/users";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { authFetch } = useAuthPrivate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getCurrentUser(authFetch, controller.signal)
      .then((response) => {
        setUser(response.user);
        if (!isDefaultUserProfile(response.user)) {
          router.replace("/(tabs)");
        }
      })
      .catch(() => setErrorMessage("Could not load your profile."))
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [authFetch, router]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
        }}
      >
        <ActivityIndicator color="#E7E9EA" />
      </View>
    );
  }

  if (!user) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
          padding: 24,
        }}
      >
        <Text
          selectable
          style={{
            color: "#F4212E",
            fontSize: 15,
            lineHeight: 21,
            textAlign: "center",
          }}
        >
          {errorMessage ?? "Could not load your profile."}
        </Text>
      </View>
    );
  }

  return (
    <ProfileForm
      errorMessage={errorMessage}
      initialUser={user}
      isSubmitting={isSubmitting}
      submitLabel="Next"
      subtitle="Pick a name and handle. You can change these later from your profile."
      title="Set up your profile"
      onSubmit={async (input) => {
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
          await updateCurrentUserProfile(authFetch, input);
          router.replace("/(tabs)");
        } catch {
          setErrorMessage("Could not save that profile. The handle may be taken.");
        } finally {
          setIsSubmitting(false);
        }
      }}
    />
  );
}
