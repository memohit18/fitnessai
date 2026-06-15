declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_APP_ENV: 'development' | 'staging' | 'production';
    EXPO_PUBLIC_API_URL: string;
    EXPO_PUBLIC_API_TIMEOUT_MS: string;
    EXPO_PUBLIC_AUTH_SCHEME: string;
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
    EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?: string;
  }
}
