import * as SecureStore from 'expo-secure-store';

import { AUTH_SESSION_KEY } from '../constants/auth';
import type { AuthSession } from '../types/auth';

export async function saveSession(session: AuthSession): Promise<void> {
  await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(session), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

export async function loadSession(): Promise<AuthSession | null> {
  const raw = await SecureStore.getItemAsync(AUTH_SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession> & { token?: string };

    if (!parsed.user?.email) {
      await clearSession();
      return null;
    }

    const accessToken = parsed.accessToken ?? parsed.token;
    const refreshToken = parsed.refreshToken ?? '';

    if (!accessToken) {
      await clearSession();
      return null;
    }

    return {
      accessToken,
      refreshToken,
      user: parsed.user,
    };
  } catch {
    await clearSession();
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
}
