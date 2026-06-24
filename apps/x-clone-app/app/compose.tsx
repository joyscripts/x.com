import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import type { UserProfile } from "@repo/contracts";
import { ComposePostForm } from "@/components/posts/compose-post-form";
import { useAuthPrivate } from "@/hooks/useAuthPrivate";
import { createPost } from "@/lib/posts";
import { getCurrentUser } from "@/lib/users";

export default function ComposeScreen() {
  const router = useRouter();
  const { authFetch } = useAuthPrivate();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getCurrentUser(authFetch, controller.signal)
      .then((response) => setCurrentUser(response.user))
      .catch(() => undefined);

    return () => controller.abort();
  }, [authFetch]);

  return (
    <ComposePostForm
      currentUser={currentUser}
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={() => router.back()}
      onSubmit={async (input) => {
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
          await createPost(authFetch, input);
          router.replace("/(tabs)" as never);
        } catch {
          setErrorMessage("Could not send that post.");
        } finally {
          setIsSubmitting(false);
        }
      }}
    />
  );
}
