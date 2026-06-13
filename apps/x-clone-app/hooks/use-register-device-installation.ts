import { useEffect, useRef, useState } from "react";
import type { RegisterDeviceInstallationResponse } from "@repo/contracts";
import {
  type AppPushToken,
  createInstallationRegistrationPayload,
  registerDeviceInstallation,
} from "@/lib/device-installations";

type UseRegisterDeviceInstallationOptions = {
  enabled: boolean;
  devicePushToken: AppPushToken | null;
};

export default function useRegisterDeviceInstallation({
  enabled,
  devicePushToken,
}: UseRegisterDeviceInstallationOptions) {
  const [registration, setRegistration] =
    useState<RegisterDeviceInstallationResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastRegistrationKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !devicePushToken) {
      return;
    }

    const nextDevicePushToken = devicePushToken;
    const registrationKey = `${nextDevicePushToken.type}:${nextDevicePushToken.data}`;

    if (lastRegistrationKeyRef.current === registrationKey) {
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    async function syncInstallation() {
      setIsLoading(true);
      setError(null);

      try {
        const payload =
          await createInstallationRegistrationPayload(nextDevicePushToken);
        const response = await registerDeviceInstallation(
          payload,
          controller.signal,
        );

        if (isMounted) {
          setRegistration(response);
          lastRegistrationKeyRef.current = registrationKey;
        }
      } catch (caughtError) {
        if (controller.signal.aborted || !isMounted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError
            : new Error("Failed to register device installation"),
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void syncInstallation();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [devicePushToken, enabled]);

  return {
    registration,
    isLoading,
    error,
  };
}
