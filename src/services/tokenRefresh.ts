import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { env } from '../constants';
import {
  decodeTokenPayload,
  isAccessTokenValid,
  isRefreshTokenValid,
} from '../lib/auth/token';
import type { AuthSession } from '../types/auth';
import type { RefreshResponse } from '../types/api/auth';
import { extractAuthSession } from '../utils/api';
import { clearSession, saveSession } from './authSession';

function getStore() {
  // Lazy: store → authSlice must finish before tokenRefresh touches the store.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require('../store') as typeof import('../store')).store;
}

function authActions() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../store/slices/authSlice') as typeof import('../store/slices/authSlice');
}

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function isAuthEndpoint(url: string) {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/signup') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/google')
  );
}

export function clearRefreshTimer() {
  if (refreshTimer != null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

export function shouldAttemptTokenRefresh(
  status: number | string | undefined,
  requestUrl: string,
) {
  return status === 401 && !isAuthEndpoint(requestUrl);
}

async function persistAndDispatch(session: AuthSession) {
  await saveSession(session);
  getStore().dispatch(authActions().sessionRefreshed(session));
  scheduleProactiveTokenRefresh();
}

async function forceSignOut() {
  clearRefreshTimer();
  try {
    await clearSession();
  } catch {
    // Ignore storage failures during forced logout.
  }
  void getStore().dispatch(authActions().signOut());
}

/**
 * Call auth-service POST /auth/refresh.
 * Single-flight so parallel 401s share one refresh.
 */
export async function refreshAccessToken(
  seedSession?: AuthSession | null,
): Promise<string | null> {
  const state = getStore().getState().auth;
  const refreshToken =
    seedSession?.refreshToken || state?.refreshToken || null;

  if (!refreshToken || !isRefreshTokenValid(refreshToken)) {
    if (state?.status === 'authenticated' || seedSession) {
      await forceSignOut();
    }
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const { data } = await axios.post<RefreshResponse>(
        `${env.authApiUrl}/auth/refresh`,
        { refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: env.apiTimeoutMs,
        },
      );

      const fallbackEmail =
        seedSession?.user.email ?? state?.user?.email ?? undefined;
      const next = extractAuthSession(data, fallbackEmail);

      if (!next?.accessToken) {
        await forceSignOut();
        return null;
      }

      const session: AuthSession = {
        accessToken: next.accessToken,
        refreshToken: next.refreshToken || refreshToken,
        user: {
          id:
            next.user.id ||
            seedSession?.user.id ||
            state?.user?.id ||
            next.user.email,
          email: next.user.email,
          name:
            next.user.name?.trim() ||
            seedSession?.user.name ||
            state?.user?.name ||
            null,
        },
      };

      await persistAndDispatch(session);
      return session.accessToken;
    } catch {
      await forceSignOut();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function getValidAccessToken(
  seedSession?: AuthSession | null,
): Promise<string | null> {
  const accessToken =
    seedSession?.accessToken ?? getStore().getState().auth?.accessToken;

  if (isAccessTokenValid(accessToken)) {
    return accessToken ?? null;
  }

  return refreshAccessToken(seedSession);
}

export function scheduleProactiveTokenRefresh() {
  clearRefreshTimer();

  const accessToken = getStore().getState().auth?.accessToken;
  if (!accessToken) return;

  const claims = decodeTokenPayload(accessToken);
  if (!claims?.exp) return;

  const delay = claims.exp * 1000 - Date.now() - 60_000;

  if (delay <= 0) {
    void refreshAccessToken().then((token) => {
      if (token) scheduleProactiveTokenRefresh();
    });
    return;
  }

  refreshTimer = setTimeout(() => {
    void refreshAccessToken().then((token) => {
      if (token) scheduleProactiveTokenRefresh();
    });
  }, delay);
}

export function attachAuthInterceptors(
  client: ReturnType<typeof axios.create>,
) {
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as RetriableConfig | undefined;
      const status = error.response?.status;
      const url = String(original?.url ?? '');

      if (
        !original ||
        original._retry ||
        !shouldAttemptTokenRefresh(status, url)
      ) {
        return Promise.reject(error);
      }

      const token = await refreshAccessToken();
      if (!token) {
        return Promise.reject(error);
      }

      original._retry = true;
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${token}`;
      return client(original);
    },
  );
}
