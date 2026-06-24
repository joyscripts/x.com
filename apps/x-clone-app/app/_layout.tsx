import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  usePathname,
  useRouter,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SystemBars } from "react-native-edge-to-edge";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import {
  AuthSessionProvider,
  useAuthSession,
} from "@/hooks/use-auth-session";
import useNotifications from "@/hooks/use-notifications";
import { getFirebaseMessaging } from "@/lib/firebase-messaging";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

getFirebaseMessaging()?.setBackgroundMessageHandler(async () => undefined);

export default function RootLayout() {
  const isLoading = false;

  useEffect(() => {
    if (isLoading === false) {
      SplashScreen.hideAsync();
    }
  }, []);

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  useNotifications();
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <AuthSessionProvider>
          <SessionGate />
        </AuthSessionProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

function SessionGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthSession();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isAuthRoute = pathname.startsWith("/auth");

    if (!isAuthenticated && !isAuthRoute) {
      router.replace("/auth" as never);
    }

    if (isAuthenticated && isAuthRoute) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return (
    <>
      <SystemBars style="auto" />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
