import axios from "axios";
import { message } from "antd";
import { navigate } from "../lib/navigate";
import { refreshAccessToken } from "../auth/pkce";

let refreshPromise: Promise<string | null> | null = null;

async function refreshTokenIfPossible() {
  const refreshToken = sessionStorage.getItem("refresh_token");
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken(refreshToken)
      .then((tokenResponse) => {
        sessionStorage.setItem("access_token", tokenResponse.access_token);
        if (tokenResponse.refresh_token) {
          sessionStorage.setItem("refresh_token", tokenResponse.refresh_token);
        }
        return tokenResponse.access_token;
      })
      .catch(() => {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function toPlainHeaders(headers: unknown): Record<string, string> {
  if (headers && typeof headers === "object" && !Array.isArray(headers)) {
    return { ...(headers as Record<string, string>) };
  }
  return {};
}

interface RetriableConfig {
  _retry?: boolean;
  headers?: unknown;
}

function isRetriableConfig(config: unknown): config is RetriableConfig {
  return !!config && typeof config === "object";
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    if (status === 401 && isRetriableConfig(error.config) && !error.config._retry) {
      error.config._retry = true;
      const newAccessToken = await refreshTokenIfPossible();
      if (newAccessToken) {
        const headers = toPlainHeaders(error.config.headers);
        headers.Authorization = `Bearer ${newAccessToken}`;
        return api({ ...error.config, headers });
      }

      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");
      navigate("/login");
      return Promise.reject(error);
    }

    if (status >= 400 && status < 500) {
      const msg: string = error.response?.data?.status?.message;
      message.error(msg || "Internal Server Error");
    }

    return Promise.reject(error);
  }
);

export const wsBaseUrl = import.meta.env.VITE_API_BASE_URL
  .replace(/^https:\/\//, "wss://")
  .replace(/^http:\/\//, "ws://");

export default api;
