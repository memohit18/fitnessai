import axios from 'axios';

import { env } from '../constants';
import { store } from '../store';
import type { LoginRequest, LoginResponse, SignupRequest, SignupResponse } from '../types/api/auth';

export const authApi = axios.create({
  baseURL: env.authApiUrl,
  timeout: env.apiTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
  },
});

authApi.interceptors.request.use((config) => {
  const accessToken = store.getState().auth.accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export async function signup(payload: SignupRequest): Promise<SignupResponse> {
  const { data } = await authApi.post<SignupResponse>('/auth/signup', payload);
  return data;
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await authApi.post<LoginResponse>('/auth/login', payload);
  return data;
}
