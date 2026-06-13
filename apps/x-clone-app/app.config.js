const iosGoogleServicesFile = process.env.EXPO_IOS_GOOGLE_SERVICES_FILE;
const androidGoogleServicesFile = process.env.EXPO_ANDROID_GOOGLE_SERVICES_FILE;

export default ({ config }) => ({
  ...config,
  expo: {
    extra: {
      eas: {
        projectId: "8af6014f-240a-49a4-a8a6-8b13b07cb4c3",
      },
    },
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
      googleServicesFile: iosGoogleServicesFile,
      bundleIdentifier: "com.x",
      supportsTablet: true,
    },

    android: {
      package: "com.x",
      googleServicesFile: androidGoogleServicesFile,
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
                    path: "./assets/fonts/inter/Inter_18pt-Light.ttf",
                    weight: 300,
                  },
                  {
                    path: "./assets/fonts/inter/Inter_18pt-Regular.ttf",
                    weight: 400,
                  },
                  {
                    path: "./assets/fonts/inter/Inter_18pt-Medium.ttf",
                    weight: 500,
                  },
                  {
                    path: "./assets/fonts/inter/Inter_18pt-SemiBold.ttf",
                    weight: 600,
                  },
                  {
                    path: "./assets/fonts/inter/Inter_18pt-Bold.ttf",
                    weight: 700,
                  },
                  {
                    path: "./assets/fonts/inter/Inter_18pt-Italic.ttf",
                    weight: 400,
                    style: "italic",
                  },
                  {
                    path: "./assets/fonts/inter/Inter_18pt-MediumItalic.ttf",
                    weight: 500,
                    style: "italic",
                  },
                  {
                    path: "./assets/fonts/inter/Inter_18pt-SemiBoldItalic.ttf",
                    weight: 600,
                    style: "italic",
                  },
                  {
                    path: "./assets/fonts/inter/Inter_18pt-BoldItalic.ttf",
                    weight: 700,
                    style: "italic",
                  },
                ],
              },

              {
                fontFamily: "Roboto",
                fontDefinitions: [
                  {
                    path: "./assets/fonts/roboto/Roboto-Light.ttf",
                    weight: 300,
                  },
                  {
                    path: "./assets/fonts/roboto/Roboto-Regular.ttf",
                    weight: 400,
                  },
                  {
                    path: "./assets/fonts/roboto/Roboto-Medium.ttf",
                    weight: 500,
                  },
                  {
                    path: "./assets/fonts/roboto/Roboto-Bold.ttf",
                    weight: 700,
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
