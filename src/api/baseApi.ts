import axios from 'axios';

import { env } from '../constants';
import { attachAuthInterceptors } from '../services/tokenRefresh';

export const baseApi = axios.create({
  baseURL: env.apiUrl,
  timeout: env.apiTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
  },
});

baseApi.interceptors.request.use((config) => {
  // Lazy store access avoids init cycles with authSlice.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { store } = require('../store') as typeof import('../store');
  const accessToken = store.getState().auth?.accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

attachAuthInterceptors(baseApi);
