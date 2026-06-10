# Expo Mobile Runtime Guide

This guide explains how to handle:

- error screens
- 404 and unmatched routes
- global JavaScript errors
- splash screen behavior in code
- splash screen and icon configuration in `app.config.js`
- how to create splash and icon assets

This repo's Expo app lives in `apps/x-clone-app`.

## What exists in this repo already

- `apps/x-clone-app/app/+not-found.tsx` already provides a custom unmatched-route screen.
- `apps/x-clone-app/app/_layout.tsx` already uses `expo-splash-screen`.
- `apps/x-clone-app/app.config.js` already configures:
  - top-level app icon
  - Android adaptive icons
  - web favicon
  - `expo-splash-screen` through the config plugin

## 1. Error screens in Expo Router

There are three different concerns:

1. unmatched routes
2. route render failures
3. loading states

They are related, but they are not solved by the same API.

### 1.1 404 or unmatched routes

In Expo Router, unmatched routes are handled with `+not-found.tsx`.

Native apps do not have server 404s in the same way a website does, but Expo Router still gives you a consistent "not found" screen so universal routing behaves sensibly across native and web.

The simplest version is:

```tsx
import { Unmatched } from "expo-router";

export default Unmatched;
```

You can also fully customize it. A good custom not-found screen should:

- explain what happened
- offer a path back to the home screen
- optionally log the bad route if you want analytics

Example:

```tsx
import { Link, Stack } from "expo-router";
import { StyleSheet, View, Text } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen does not exist.</Text>
        <Text style={styles.body}>
          The link may be old, broken, or pointing to a screen we removed.
        </Text>
        <Link href="/" style={styles.link}>
          Go back home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  body: {
    textAlign: "center",
    marginBottom: 16,
  },
  link: {
    color: "#1d9bf0",
  },
});
```

### 1.2 Route-level error screens with `ErrorBoundary`

Expo Router lets any route export an `ErrorBoundary`.

This is the main way to handle render-time failures gracefully. If a screen throws while rendering, the exported `ErrorBoundary` can show fallback UI and offer a retry action.

Example:

```tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ErrorBoundaryProps } from "expo-router";

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error.message}</Text>
      <Pressable style={styles.button} onPress={retry}>
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function ProfileScreen() {
  return <View>{/* screen UI */}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  message: {
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
```

How to think about boundary placement:

- Put boundaries around route groups or screens where failure should stay local.
- Do not rely on one giant app-wide boundary for everything.
- Let a feed crash as a feed, not as the whole app.
- Let retry mean "rerender this route", not "force kill and restart the app".

### 1.3 Parent and nested boundaries

If a screen does not export `ErrorBoundary`, its error bubbles to the nearest parent boundary.

That means:

- route boundary catches that route
- layout boundary can catch a whole route group
- root layout boundary can catch broad navigation-level failures

This is useful when you want:

- one fallback for all authenticated screens
- one fallback for settings screens
- one fallback for a heavy feature area like chat, maps, or media

### 1.4 Loading states with `SuspenseFallback`

Expo Router also supports `SuspenseFallback` in layout files.

This is not an error screen. It is the loading UI shown while a child route is suspended.

Example:

```tsx
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";

export function SuspenseFallback() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function AppLayout() {
  return <Stack />;
}
```

Use this when:

- a route is code-splitting
- a route waits on Suspense-enabled data
- you want a branded loading state instead of a blank handoff

## 2. Global JavaScript errors

This is where many apps get confused.

### 2.1 What `ErrorBoundary` does catch

React error boundaries catch rendering failures in child components. They are the correct tool for:

- render crashes
- crashes thrown while React is reconciling a route subtree
- component-level fallback UI

### 2.2 What `ErrorBoundary` does not catch

React error boundaries do not catch:

- event handler errors
- async callback errors
- `setTimeout` / `requestAnimationFrame` errors
- errors thrown outside the React render tree

So if you throw inside a button handler or an awaited API call, your route boundary will not automatically save you.

### 2.3 Graceful strategy for "global JS errors"

In practice, graceful error handling in Expo apps usually means combining several layers:

1. route and layout `ErrorBoundary` exports for render errors
2. explicit `try/catch` in event handlers and async flows
3. user-facing fallback UI for failed actions
4. production error reporting

That looks more like this:

```tsx
import { Alert, Pressable, Text } from "react-native";

async function reportError(error: unknown) {
  console.error(error);
  // send to Sentry, Bugsnag, Crashlytics, or your own backend
}

export function SaveButton() {
  async function handlePress() {
    try {
      await saveProfile();
    } catch (error) {
      await reportError(error);
      Alert.alert(
        "Save failed",
        "We could not save your changes. Please try again."
      );
    }
  }

  return (
    <Pressable onPress={handlePress}>
      <Text>Save</Text>
    </Pressable>
  );
}
```

That is usually better than trying to invent one magical global crash screen.

### 2.4 A realistic production rule

If the error is:

- local to one screen: use `ErrorBoundary`
- local to one action: use `try/catch`
- local to one API call: return a recoverable UI state
- app-breaking and uncaught: report it and fail fast

For truly uncaught global JavaScript exceptions, there is no first-class Expo Router file like `+global-error.tsx` for native apps. The graceful approach is to prevent errors from becoming uncaught in the first place, then report what still escapes.

### 2.5 What to use for production reporting

Use a monitoring service in production, for example:

- Sentry
- Bugsnag
- Crashlytics

A good pattern is:

- show local fallback UI to the user
- log technical details to monitoring
- include route name, user id, build version, and device info if available

## 3. Splash screen control in code

Expo gives you two layers:

- native splash configuration in `app.config.js`
- runtime visibility control with `expo-splash-screen`

### 3.1 Default behavior

For many apps, you do not need manual control. Expo will hide the splash screen automatically when the app is ready.

### 3.2 Add a fade animation

If you only want a smoother exit, you can keep auto behavior and just set animation options:

```tsx
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

export default function RootLayout() {
  return <Stack />;
}
```

### 3.3 Manually delay hiding

Use manual control when you must wait for startup work, for example:

- fonts
- remote config
- auth restore
- local storage hydration
- essential bootstrap data

The important rule is:

- call `SplashScreen.preventAutoHideAsync()` in module scope
- do not wait to call it from inside a hook

Example:

```tsx
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        await Promise.all([
          loadFonts(),
          restoreSession(),
          warmImportantCaches(),
        ]);
      } catch (error) {
        console.warn(error);
      } finally {
        setIsReady(true);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hide();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return <Stack />;
}
```

### 3.4 Good rules for startup work

- Keep splash-blocking work minimal.
- Only block on work that is truly required for first paint.
- Do not wait for non-critical network calls.
- If something can load after the first screen appears, let it load later.
- Always release the splash in a `finally` path.

### 3.5 Common mistakes

- Calling `preventAutoHideAsync()` too late
- Forgetting to call `hide()` or `hideAsync()`
- Waiting on non-essential API calls
- Returning UI before assets are ready and hiding too early
- Keeping the splash forever if bootstrap fails

### 3.6 Important testing note

Splash screens are easy to misread during development.

Expo's docs recommend testing splash visuals on preview or production-style builds, not only in Expo Go or a development build, because those environments do not fully match the final splash behavior.

## 4. Configuring splash screen, app icon, and favicon in `app.config.js`

In this repo, `apps/x-clone-app/app.config.js` is the source of truth.

### 4.1 What belongs in `app.config.js`

Use `app.config.js` for native asset configuration that must exist before JavaScript runs:

- app name
- bundle/package ids
- app icon
- Android adaptive icon
- web favicon
- splash screen plugin options

These settings affect the native app binary, so changing them usually requires a rebuild.

### 4.2 Example configuration

This is the shape you normally want:

```js
export default ({ config }) => ({
  ...config,
  expo: {
    name: "X",
    slug: "x-clone",
    version: "1.0.0",
    icon: "./assets/images/icon.png",
    scheme: "xclone",

    ios: {
      bundleIdentifier: "com.x",
      supportsTablet: true,
      icon: "./assets/images/icon.png",
    },

    android: {
      package: "com.x",
      icon: "./assets/images/icon.png",
      adaptiveIcon: {
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundColor: "#E6F4FE",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
    },

    web: {
      favicon: "./assets/images/favicon.png",
    },

    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#FFFFFF",
          dark: {
            image: "./assets/images/splash-icon-dark.png",
            backgroundColor: "#18181B",
          },
        },
      ],
    ],
  },
});
```

### 4.3 Top-level `icon`

`icon` is the general app icon.

Use it when:

- you want one default icon for the app
- you want Expo to generate required icon sizes

This is the simplest setup:

```js
icon: "./assets/images/icon.png";
```

### 4.4 iOS icon

You can keep using the top-level icon, or override it for iOS with `ios.icon`.

Options:

- provide a PNG
- provide an Apple `.icon` directory for richer iOS variants

Use a dedicated iOS override if:

- the iOS icon needs a different export
- you want dark or tinted variants
- you are using Apple's newer icon workflow

### 4.5 Android icon and adaptive icon

Android supports adaptive icons.

That means the launcher icon can be made from:

- foreground image
- background color or background image
- monochrome image for Android 13 themed icons

This is better than relying only on one flat PNG.

Example:

```js
android: {
  icon: "./assets/images/icon.png",
  adaptiveIcon: {
    foregroundImage: "./assets/images/android-icon-foreground.png",
    backgroundColor: "#E6F4FE",
    backgroundImage: "./assets/images/android-icon-background.png",
    monochromeImage: "./assets/images/android-icon-monochrome.png",
  },
}
```

When to keep `android.icon` too:

- for older Android behavior
- as a fallback single-image icon

### 4.6 Web favicon

For web, use:

```js
web: {
  favicon: "./assets/images/favicon.png",
}
```

This controls the browser tab icon.

### 4.7 Splash screen plugin

Expo recommends configuring splash screen visuals with the `expo-splash-screen` config plugin.

Important options:

- `image`
- `backgroundColor`
- `dark.image`
- `dark.backgroundColor`
- `imageWidth`
- `resizeMode`
- optional per-platform `ios` and `android` overrides

### 4.8 When config changes take effect

Changes to these native config values usually require rebuilding the native app.

Examples:

- changing `icon`
- changing `android.adaptiveIcon`
- changing splash plugin image or background color
- changing bundle/package identifiers

In short:

- JS code change: usually hot reload or reload is enough
- native config change: rebuild

## 5. How to create the splash screen and app icon assets

### 5.1 Recommended asset folder layout

This repo already uses:

```text
apps/x-clone-app/assets/images/
  icon.png
  splash-icon.png
  favicon.png
  android-icon-foreground.png
  android-icon-background.png
  android-icon-monochrome.png
```

That is a good convention. Keep all launch and branding assets together.

### 5.2 App icon creation

Recommended baseline:

- PNG format
- 1024x1024
- exactly square
- simple silhouette
- strong contrast
- little or no text

Why:

- Expo can generate smaller required sizes from a strong 1024 source
- small launcher icons need simple shapes to stay readable

Design advice:

- Avoid tiny details.
- Avoid full words in the icon.
- Test on light and dark wallpapers.
- Make the center shape large enough to survive downscaling.

### 5.3 Android adaptive icon creation

For Android adaptive icons, think in layers:

- foreground: the logo mark only
- background: solid color or simple background image
- monochrome: one-color version for themed icons

Good foreground rules:

- transparent background
- centered logo
- enough padding so OS masking does not clip the mark

Good background rules:

- keep it simple
- use brand color or subtle background art
- same dimensions as the foreground if you use `backgroundImage`

### 5.4 Splash image creation

Recommended baseline:

- PNG format only
- 1024x1024 source image
- transparent background for the splash mark itself
- centered logo or symbol

The splash image should usually be:

- simpler than a full poster
- closer to a centered brand mark than a busy composition

That is because Expo's splash plugin is best when the image sits on a clean background color and scales predictably.

### 5.5 Figma and design workflow

A practical workflow is:

1. Design the icon mark in Figma.
2. Export:
   - `icon.png`
   - `splash-icon.png`
   - `android-icon-foreground.png`
   - `android-icon-monochrome.png`
3. Create:
   - a plain `android-icon-background.png`, or use only a background color
   - `favicon.png` from the same base mark
4. Drop them in `apps/x-clone-app/assets/images/`.
5. Update `app.config.js`.
6. Rebuild the native app.

### 5.6 Suggested practical sizes

Even if the config eventually generates multiple sizes, these source exports are a good starting point:

- `icon.png`: 1024x1024
- `splash-icon.png`: 1024x1024
- `android-icon-foreground.png`: 1024x1024
- `android-icon-background.png`: 1024x1024
- `android-icon-monochrome.png`: 1024x1024
- `favicon.png`: 48x48 or 64x64, though using a larger source and exporting down is fine

## 6. Recommended setup for this repo

If you want a clean, maintainable setup for `apps/x-clone-app`, this is the most practical structure:

- Keep `+not-found.tsx` as the universal unmatched-route screen.
- Add route-level `ErrorBoundary` exports to important feature screens.
- Add layout-level boundaries for route groups like auth, tabs, and settings.
- Use `SuspenseFallback` in layout files for loading states.
- Use `try/catch` in async button handlers and API actions.
- Report production errors with a monitoring service.
- Keep splash-blocking startup work minimal.
- Use a dedicated `splash-icon.png` instead of reusing `icon.png` if you want better splash composition control.

## 7. Quick checklist

### Error handling

- `+not-found.tsx` exists
- important routes export `ErrorBoundary`
- async actions use `try/catch`
- production errors are reported

### Splash control

- `preventAutoHideAsync()` is called in module scope if manual control is needed
- `hide()` is called after required startup work finishes
- bootstrap work has a `finally` path

### Asset config

- `icon` points to a 1024 square PNG
- Android adaptive icon layers are present
- `web.favicon` is set
- splash plugin uses the intended image and background colors
- native app is rebuilt after changing config

## Official references

- Expo Router error handling: [https://docs.expo.dev/router/error-handling/](https://docs.expo.dev/router/error-handling/)
- Expo SplashScreen SDK 56: [https://docs.expo.dev/versions/v56.0.0/sdk/splash-screen/](https://docs.expo.dev/versions/v56.0.0/sdk/splash-screen/)
- Expo app config SDK 56: [https://docs.expo.dev/versions/v56.0.0/config/app/](https://docs.expo.dev/versions/v56.0.0/config/app/)
- Expo splash screen and app icon guide: [https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)
- React error boundary behavior: [https://react.dev/reference/react/Component](https://react.dev/reference/react/Component)
