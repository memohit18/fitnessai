type AppEnv = 'development' | 'staging' | 'production';

/**
 * Expo only inlines EXPO_PUBLIC_* when accessed as static property reads
 * (process.env.EXPO_PUBLIC_FOO). Dynamic process.env[name] keeps stale
 * build-time values from the last native build.
 */
function requireStatic(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  appEnv: requireStatic(
    process.env.EXPO_PUBLIC_APP_ENV,
    'EXPO_PUBLIC_APP_ENV',
  ) as AppEnv,
  apiUrl: requireStatic(
    process.env.EXPO_PUBLIC_API_URL,
    'EXPO_PUBLIC_API_URL',
  ),
  authApiUrl: requireStatic(
    process.env.EXPO_PUBLIC_AUTH_API_URL,
    'EXPO_PUBLIC_AUTH_API_URL',
  ),
  apiTimeoutMs: Number(
    requireStatic(
      process.env.EXPO_PUBLIC_API_TIMEOUT_MS,
      'EXPO_PUBLIC_API_TIMEOUT_MS',
    ),
  ),
  authScheme: requireStatic(
    process.env.EXPO_PUBLIC_AUTH_SCHEME,
    'EXPO_PUBLIC_AUTH_SCHEME',
  ),
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  googleIosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME ?? '',
  isDev: process.env.EXPO_PUBLIC_APP_ENV === 'development',
} as const;
