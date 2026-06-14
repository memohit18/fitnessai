import axios from 'axios';

import { env } from '../constants';

export const baseApi = axios.create({
  baseURL: env.apiUrl,
  timeout: env.apiTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
  },
});
