type AppEnv = 'development' | 'staging' | 'production';

function requireEnv(name: keyof NodeJS.ProcessEnv): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: keyof NodeJS.ProcessEnv): string {
  return process.env[name] ?? '';
}

export const env = {
  appEnv: requireEnv('EXPO_PUBLIC_APP_ENV') as AppEnv,
  apiUrl: requireEnv('EXPO_PUBLIC_API_URL'),
  apiTimeoutMs: Number(requireEnv('EXPO_PUBLIC_API_TIMEOUT_MS')),
  authScheme: requireEnv('EXPO_PUBLIC_AUTH_SCHEME'),
  googleIosClientId: optionalEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
  googleWebClientId: optionalEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
  googleIosUrlScheme: optionalEnv('EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME'),
  isDev: process.env.EXPO_PUBLIC_APP_ENV === 'development',
} as const;
