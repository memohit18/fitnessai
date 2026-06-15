import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
  type SignInSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

import { env } from '../constants';

export type GoogleSignInResult =
  | { success: true; data: SignInSuccessResponse['data'] }
  | { success: false; cancelled: boolean; message: string };

export function isGoogleSignInConfigured(): boolean {
  if (Platform.OS === 'ios') {
    return Boolean(env.googleIosClientId && env.googleWebClientId);
  }
  return Boolean(env.googleWebClientId);
}

export function configureGoogleSignIn(): void {
  if (!isGoogleSignInConfigured()) {
    console.warn(
      '[GoogleSignIn] Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (and iOS client ID on iOS).',
    );
    return;
  }

  GoogleSignin.configure({
    iosClientId: env.googleIosClientId,
    webClientId: env.googleWebClientId,
    offlineAccess: true,
  });
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!isGoogleSignInConfigured()) {
    return {
      success: false,
      cancelled: false,
      message: 'Google Sign-In is not configured. Check your .env file.',
    };
  }

  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return { success: false, cancelled: true, message: 'Sign in was cancelled.' };
    }

    return { success: true, data: response.data };
  } catch (error) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.IN_PROGRESS:
          return { success: false, cancelled: false, message: 'Sign in already in progress.' };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
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
  try {
    await GoogleSignin.signOut();
  } catch {
    // User may not be signed in with Google.
  }
}
