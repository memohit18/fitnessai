import axios from 'axios';

import { env } from '../constants';
import { attachAuthInterceptors } from '../services/tokenRefresh';
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RefreshResponse,
  SignupRequest,
  SignupResponse,
} from '../types/api/auth';

export const authApi = axios.create({
  baseURL: env.authApiUrl,
  timeout: env.apiTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
  },
});

authApi.interceptors.request.use((config) => {
  // Refresh must not send a stale bearer token.
  if (config.url?.includes('/auth/refresh')) {
    return config;
  }

  // Lazy store access avoids init cycles with authSlice.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { store } = require('../store') as typeof import('../store');
  const accessToken = store.getState().auth?.accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

attachAuthInterceptors(authApi);

export async function signup(payload: SignupRequest): Promise<SignupResponse> {
  const { data } = await authApi.post<SignupResponse>('/auth/signup', payload);
  return data;
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await authApi.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function googleLogin(payload: {
  idToken: string;
  deviceType: 'mobile';
  deviceName: string;
}): Promise<LoginResponse> {
  const { data } = await authApi.post<LoginResponse>('/auth/google/login', payload);
  return data;
}

export async function googleSignup(payload: {
  idToken: string;
  deviceType: 'mobile';
  deviceName: string;
}): Promise<SignupResponse> {
  const { data } = await authApi.post<SignupResponse>('/auth/google/signup', payload);
  return data;
}

export async function refreshTokens(refreshToken: string): Promise<RefreshResponse> {
  const { data } = await authApi.post<RefreshResponse>('/auth/refresh', {
    refreshToken,
  });
  return data;
}

export async function getMe(accessToken?: string): Promise<MeResponse> {
  const { data } = await authApi.get<MeResponse>('/auth/me', {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });
  return data;
}
