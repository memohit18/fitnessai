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
    name: 'thinktank_mobile',
    slug: 'thinktank_mobile',
    version: '1.0.0',
    scheme: 'thinktank',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.thinktank.mobile',
      ...(iosGoogleServicesExists ? { googleServicesFile: iosGoogleServicesPath } : {}),
    },
    android: {
      package: 'com.thinktank.mobile',
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
      'expo-dev-client',
      'expo-secure-store',
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
