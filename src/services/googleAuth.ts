import { Platform } from 'react-native';

import { env } from '../constants';

type GoogleUserData = {
  idToken: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    photo: string | null;
  };
};

export type GoogleSignInResult =
  | { success: true; data: GoogleUserData }
  | { success: false; cancelled: boolean; message: string };

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

let googleModule: GoogleSignInModule | null | undefined;

function loadGoogleModule(): GoogleSignInModule | null {
  if (googleModule !== undefined) {
    return googleModule;
  }

  try {
    // Native module is only available in a rebuilt dev client.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    googleModule = require('@react-native-google-signin/google-signin') as GoogleSignInModule;
  } catch {
    googleModule = null;
  }

  return googleModule;
}

export function isGoogleSignInConfigured(): boolean {
  if (!loadGoogleModule()) {
    return false;
  }

  return Boolean(env.googleWebClientId);
}

export function configureGoogleSignIn(): void {
  const mod = loadGoogleModule();
  if (!mod) {
    console.warn('[GoogleSignIn] Native module unavailable. Rebuild the iOS app.');
    return;
  }

  if (!isGoogleSignInConfigured()) {
    console.warn(
      '[GoogleSignIn] Missing EXPO_PUBLIC_GOOGLE_CLIENT_ID.',
    );
    return;
  }

  const iosClientId = env.googleIosClientId || env.googleWebClientId;

  mod.GoogleSignin.configure({
    webClientId: env.googleWebClientId,
    ...(iosClientId ? { iosClientId } : {}),
    offlineAccess: false,
  });
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const mod = loadGoogleModule();
  if (!mod) {
    return {
      success: false,
      cancelled: false,
      message: 'Google Sign-In is unavailable. Rebuild the iOS app.',
    };
  }

  if (!isGoogleSignInConfigured()) {
    return {
      success: false,
      cancelled: false,
      message: 'Google Sign-In is not configured. Check your .env file.',
    };
  }

  try {
    if (Platform.OS === 'android') {
      await mod.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const response = await mod.GoogleSignin.signIn();

    if (!mod.isSuccessResponse(response)) {
      return { success: false, cancelled: true, message: 'Sign in was cancelled.' };
    }

    return { success: true, data: response.data };
  } catch (error) {
    if (mod.isErrorWithCode(error)) {
      switch (error.code) {
        case mod.statusCodes.IN_PROGRESS:
          return { success: false, cancelled: false, message: 'Sign in already in progress.' };
        case mod.statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return {
            success: false,
            cancelled: false,
            message: 'Google Play Services is not available.',
          };
        default:
          return {
            success: false,
            cancelled: false,
            message: error.message ?? 'Google Sign-In failed.',
          };
      }
    }

    return {
      success: false,
      cancelled: false,
      message: error instanceof Error ? error.message : 'Google Sign-In failed.',
    };
  }
}

export async function signOutFromGoogle(): Promise<void> {
  const mod = loadGoogleModule();
  if (!mod) return;

  try {
    await mod.GoogleSignin.signOut();
  } catch {
    // User may not be signed in with Google.
  }
}
