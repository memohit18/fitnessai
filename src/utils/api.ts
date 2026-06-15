import axios from 'axios';

import type { AuthSession } from '../types/auth';
import type { AuthTokenPayload } from '../types/api/auth';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const data = error.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;

    if (typeof record.message === 'string') {
      return record.message;
    }

    if (typeof record.error === 'string') {
      return record.error;
    }

    if (Array.isArray(record.errors) && typeof record.errors[0] === 'string') {
      return record.errors[0];
    }
  }

  return error.message || fallback;
}

function readTokens(payload: AuthTokenPayload): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  const nested = payload.data;

  const accessToken =
    payload.accessToken ??
    payload.access_token ??
    payload.token ??
    nested?.accessToken ??
    nested?.access_token ??
    nested?.token ??
    null;

  const refreshToken =
    payload.refreshToken ??
    payload.refresh_token ??
    nested?.refreshToken ??
    nested?.refresh_token ??
    null;

  return { accessToken, refreshToken };
}

export function extractAuthSession(
  payload: AuthTokenPayload,
  fallbackEmail?: string,
): AuthSession | null {
  const { accessToken, refreshToken } = readTokens(payload);
  const user = payload.user ?? payload.data?.user;

  if (!accessToken) {
    return null;
  }

  const email = user?.email ?? fallbackEmail;

  if (!email) {
    return null;
  }

  return {
    accessToken,
    refreshToken: refreshToken ?? '',
    user: {
      id: user?.id ?? user?._id ?? email,
      email,
      name: user?.name ?? null,
    },
  };
}

/** @deprecated Use extractAuthSession */
export function extractSignupSession(payload: AuthTokenPayload, fallbackEmail?: string) {
  return extractAuthSession(payload, fallbackEmail);
}
