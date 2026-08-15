import axios, { type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@env';

import { loadTokens } from '@/src/auth/tokenStorage';
import { refreshTokenIfPossible } from '@/src/auth/refreshSingleton';
import { notifyLogout } from '@/src/auth/tokenSync';

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

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && config && !config._retry) {
      config._retry = true;
      const newAccessToken = await refreshTokenIfPossible();
      if (newAccessToken) {
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(config);
      }
      notifyLogout();
    }

    return Promise.reject(error);
  },
);
