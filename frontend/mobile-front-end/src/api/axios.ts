import axios from 'axios';
import { API_BASE_URL } from '@env';

import { loadTokens } from '@/src/auth/tokenStorage';

export const api = axios.create({
  baseURL: API_BASE_URL ?? 'http://localhost:8080',
});

api.interceptors.request.use(async (config) => {
  const tokens = await loadTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});
