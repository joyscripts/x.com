export default ({ config }) => ({
  ...config,
  expo: {
    name: "X",
    slug: "x-clone",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "xclone",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      entitlements: {
        "aps-environment": process.env.EXPO_PUBLIC_APP_VARIANT,
      },
      infoPlist: {
        UIBackgroundModes: [
          "fetch",
          "processing",
          "remote-notification",
          "location",
        ],
        NSLocationWhenInUseUsageDescription:
          "Allow X to access your location to pin service addresses accurately and guide active jobs.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Allow X to access your location in the background so active engineer jobs can be tracked safely until arrival.",
      },
      googleServicesFile: "./GoogleService-Info.plist",
      bundleIdentifier: "com.x.clone",
      supportsTablet: true,
    },

    android: {
      package: "com.x.clone",
      googleServicesFile: "./google-services.json",
      predictiveBackGestureEnabled: false,

      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },

      permissions: [
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_LOCATION",
      ],
    },

    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    plugins: [
      "expo-router",
      "./scripts/withAndroidFixes.js",

      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow X to access your photos for service report uploads.",
        },
      ],

      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#FFFFFF",
        },
      ],

      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            deploymentTarget: "16.4",
          },
          android: {
            compileSdkVersion: 36,
            targetSdkVersion: 36,
          },
        },
      ],

      [
        "expo-splash-screen",
        {
          image: "./assets/images/icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#FFFFFF",
          dark: {
            backgroundColor: "#18181B",
          },
        },
      ],

      [
        "react-native-edge-to-edge",
        {
          android: {
            parentTheme: "Default",
            enforceNavigationBarContrast: false,
          },
        },
      ],

      //   [
      //     "react-native-maps",
      //     {
      //       iosGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      //       androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      //     },
      //   ],

      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Allow X to access your location to pin service addresses accurately and guide active jobs.",
          locationAlwaysAndWhenInUsePermission:
            "Allow X to use your location in the background so active engineer jobs can be tracked safely until arrival.",
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true,
        },
      ],

      [
        "expo-font",
        {
          android: {
            fonts: [
              {
                fontFamily: "Inter",
                fontDefinitions: [
                  {
                    path: "./assets/fonts/inter/Inter-VariableFont_opsz,wght.ttf",
                    weight: 200,
                  },
                  {
                    path: "./assets/fonts/inter/Inter-VariableFont_opsz,wght.ttf",
                    weight: 300,
                  },
                  {
                    path: "./assets/fonts/inter/Inter-VariableFont_opsz,wght.ttf",
                    weight: 400,
                  },
                  {
                    path: "./assets/fonts/inter/Inter-VariableFont_opsz,wght.ttf",
                    weight: 500,
                  },
                  {
                    path: "./assets/fonts/inter/Inter-VariableFont_opsz,wght.ttf",
                    weight: 600,
                  },
                  {
                    path: "./assets/fonts/inter/Inter-VariableFont_opsz,wght.ttf",
                    weight: 700,
                  },
                  {
                    path: "./assets/fonts/inter/Inter-VariableFont_opsz,wght.ttf",
                    weight: 800,
                  },
                  {
                    path: "./assets/fonts/inter/Inter-Italic-VariableFont_opsz,wght.ttf",
                    weight: 200,
                    style: "italic",
                  },
                  {
                    path: "./assets/fonts/inter/Inter-Italic-VariableFont_opsz,wght.ttf",
                    weight: 300,
                    style: "italic",
                  },
                  {
                    path: "./assets/fonts/inter/Inter-Italic-VariableFont_opsz,wght.ttf",
                    weight: 400,
                    style: "italic",
                  },
                  {
                    path: "./assets/fonts/inter/Inter-Italic-VariableFont_opsz,wght.ttf",
                    weight: 500,
                    style: "italic",
                  },
                  {
                    path: "./assets/fonts/inter/Inter-Italic-VariableFont_opsz,wght.ttf",
                    weight: 600,
                    style: "italic",
                  },
                  {
                    path: "./assets/fonts/inter/Inter-Italic-VariableFont_opsz,wght.ttf",
                    weight: 700,
                    style: "italic",
                  },
                  {
                    path: "./assets/fonts/inter/Inter-Italic-VariableFont_opsz,wght.ttf",
                    weight: 800,
                    style: "italic",
                  },
                ],
              },
              {
                fontFamily: "Roboto",
                fontDefinitions: [
                  {
                    path: "./assets/fonts/roboto/Roboto-VariableFont_wdth,wght.ttf",
                    weight: 200,
                  },
                  {
                    path: "./assets/fonts/roboto/Roboto-VariableFont_wdth,wght.ttf",
                    weight: 300,
                  },
                  {
                    path: "./assets/fonts/roboto/Roboto-VariableFont_wdth,wght.ttf",
                    weight: 400,
                  },
                  {
                    path: "./assets/fonts/roboto/Roboto-VariableFont_wdth,wght.ttf",
                    weight: 500,
                  },
                  {
                    path: "./assets/fonts/roboto/Roboto-VariableFont_wdth,wght.ttf",
                    weight: 600,
                  },
                  {
                    path: "./assets/fonts/roboto/Roboto-VariableFont_wdth,wght.ttf",
                    weight: 700,
                  },
                  {
                    path: "./assets/fonts/roboto/Roboto-VariableFont_wdth,wght.ttf",
                    weight: 800,
                  },
                  {
                    path: "./assets/fonts/roboto/Roboto-Italic-VariableFont_wdth,wght.ttf",
                    weight: 200,
                    style: "italic",
                  },
                  {
                    path: "./assets/fonts/roboto/Roboto-Italic-VariableFont_wdth,wght.ttf",
                    weight: 300,
                    style: "italic",
                  },
                  {
                    path: "./assets/fonts/roboto/Roboto-Italic-VariableFont_wdth,wght.ttf",
                    weight: 400,
                    style: "italic",
                  },
                  {
                    path: "./assets/fonts/roboto/Roboto-Italic-VariableFont_wdth,wght.ttf",
                    weight: 500,
                    style: "italic",
                  },
                  {
                    path: "./assets/fonts/roboto/Roboto-Italic-VariableFont_wdth,wght.ttf",
                    weight: 600,
                    style: "italic",
                  },
                  {
                    path: "./assets/fonts/roboto/Roboto-Italic-VariableFont_wdth,wght.ttf",
                    weight: 700,
                    style: "italic",
                  },
                  {
                    path: "./assets/fonts/roboto/Roboto-Italic-VariableFont_wdth,wght.ttf",
                    weight: 800,
                    style: "italic",
                  },
                ],
              },
            ],
          },
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
});
