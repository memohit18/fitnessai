import axios from 'axios';

import type { AuthSession } from '../types/auth';
import type { AuthTokenPayload } from '../types/api/auth';

type JwtClaims = {
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
};

function base64UrlToUtf8(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  );

  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(padded);
  }

  // Hermes / RN fallback when atob is unavailable.
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  let buffer = 0;
  let bits = 0;

  for (const char of padded) {
    if (char === '=') break;
    const index = alphabet.indexOf(char);
    if (index < 0) continue;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
}

function decodeJwtClaims(token: string): JwtClaims | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const parsed = JSON.parse(base64UrlToUtf8(payload)) as JwtClaims;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

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
  const record = payload as AuthTokenPayload & {
    access?: string;
    refresh?: string;
  };

  const accessToken =
    record.accessToken ??
    record.access_token ??
    record.access ??
    record.token ??
    nested?.accessToken ??
    nested?.access_token ??
    (nested as { access?: string } | undefined)?.access ??
    nested?.token ??
    null;

  const refreshToken =
    record.refreshToken ??
    record.refresh_token ??
    record.refresh ??
    nested?.refreshToken ??
    nested?.refresh_token ??
    (nested as { refresh?: string } | undefined)?.refresh ??
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

  const claims = decodeJwtClaims(accessToken);
  const email = user?.email ?? claims?.email ?? fallbackEmail;
  const name = user?.name?.trim() || claims?.name?.trim() || null;

  if (!email) {
    return null;
  }

  return {
    accessToken,
    refreshToken: refreshToken ?? '',
    user: {
      id: user?.id ?? user?._id ?? claims?.sub ?? email,
      email,
      name,
    },
  };
}

/** @deprecated Use extractAuthSession */
export function extractSignupSession(payload: AuthTokenPayload, fallbackEmail?: string) {
  return extractAuthSession(payload, fallbackEmail);
}
