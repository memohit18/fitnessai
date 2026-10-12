import * as SecureStore from 'expo-secure-store';

import { AUTH_SESSION_KEY } from '../constants/auth';
import type { AuthSession } from '../types/auth';
import { extractAuthSession } from '../utils/api';

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

    // Prefer stored user; backfill name/id from JWT when older sessions omit them.
    const fromToken = extractAuthSession({
      accessToken,
      refreshToken,
      user: parsed.user,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: fromToken?.user.id ?? parsed.user.id,
        email: parsed.user.email,
        name: parsed.user.name?.trim() || fromToken?.user.name || null,
        avatar: parsed.user.avatar ?? null,
      },
    };
  } catch {
    await clearSession();
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
}
