import axios from 'axios';

import { env } from '../constants';
import type { AuthSession } from '../types/auth';
import type { MeResponse, RefreshResponse } from '../types/api/auth';
import { extractAuthSession } from '../utils/api';
import { saveSession } from './authSession';

function applyProfile(
  current: AuthSession,
  profile: { id?: string; email?: string; name?: string | null },
): AuthSession {
  const name = profile.name?.trim() || current.user.name;

  return {
    ...current,
    user: {
      id: profile.id ?? current.user.id,
      email: profile.email ?? current.user.email,
      name: name?.trim() || null,
    },
  };
}

async function fetchMe(accessToken: string): Promise<MeResponse> {
  const { data } = await axios.get<MeResponse>(`${env.authApiUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    timeout: env.apiTimeoutMs,
  });
  return data;
}

async function fetchRefresh(refreshToken: string): Promise<RefreshResponse> {
  const { data } = await axios.post<RefreshResponse>(
    `${env.authApiUrl}/auth/refresh`,
    { refreshToken },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: env.apiTimeoutMs,
    },
  );
  return data;
}

/**
 * Backfill user.name for sessions issued before auth-service put name in the JWT.
 * Uses refresh (new token + user) first, then /auth/me.
 */
export async function enrichAuthSession(session: AuthSession): Promise<AuthSession> {
  if (session.user.name?.trim()) {
    return session;
  }

  if (session.refreshToken) {
    try {
      const refreshed = await fetchRefresh(session.refreshToken);
      const next = extractAuthSession(refreshed, session.user.email);
      if (next) {
        const withProfile = next.user.name
          ? next
          : applyProfile(next, refreshed.user ?? {});
        await saveSession(withProfile);
        if (withProfile.user.name) {
          return withProfile;
        }
        session = withProfile;
      }
    } catch {
      // Fall through to /auth/me.
    }
  }

  try {
    const profile = await fetchMe(session.accessToken);
    const next = applyProfile(session, profile);
    await saveSession(next);
    return next;
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !session.refreshToken) {
      return session;
    }

    try {
      const refreshed = await fetchRefresh(session.refreshToken);
      const next = extractAuthSession(refreshed, session.user.email);
      if (!next) return session;

      let withProfile = next.user.name
        ? next
        : applyProfile(next, refreshed.user ?? {});

      if (!withProfile.user.name) {
        try {
          const profile = await fetchMe(withProfile.accessToken);
          withProfile = applyProfile(withProfile, profile);
        } catch {
          // Keep refreshed tokens even if profile fetch fails.
        }
      }

      await saveSession(withProfile);
      return withProfile;
    } catch {
      return session;
    }
  }
}
