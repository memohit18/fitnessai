const fs = require('fs');
const path = require('path');

const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
const iosGoogleServicesPath = './GoogleService-Info.plist';
const androidGoogleServicesPath = './google-services.json';

const iosGoogleServicesExists = fs.existsSync(path.join(__dirname, iosGoogleServicesPath));
const androidGoogleServicesExists = fs.existsSync(path.join(__dirname, androidGoogleServicesPath));

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: 'DIP',
    slug: 'fitnessai',
    // Bump this for each store release. Remote gate compares against it.
    version: '1.0.0',
    scheme: 'thinktank',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.thinktank.mobile',
      buildNumber: '1',
      ...(iosGoogleServicesExists ? { googleServicesFile: iosGoogleServicesPath } : {}),
    },
    android: {
      package: 'com.thinktank.mobile',
      versionCode: 1,
      ...(androidGoogleServicesExists ? { googleServicesFile: androidGoogleServicesPath } : {}),
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    plugins: [
      [
        'expo-dev-client',
        {
          toolsButton: false,
        },
      ],
      'expo-font',
      'expo-secure-store',
      [
        'expo-image-picker',
        {
          photosPermission:
            'Allow ThinkTank to access your photos so you can upload meal and workout images.',
          cameraPermission: false,
          microphonePermission: false,
        },
      ],
      './plugins/withIosModularHeaders.js',
      ...(googleIosUrlScheme
        ? [
            [
              '@react-native-google-signin/google-signin',
              {
                iosUrlScheme: googleIosUrlScheme,
              },
            ],
          ]
        : []),
    ],
  },
};
