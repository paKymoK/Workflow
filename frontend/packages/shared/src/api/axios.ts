import axios from "axios";
import { message } from "antd";
import { notifyLogout } from "../lib/tokenSync";
import { refreshTokenIfPossible } from "../lib/refreshSingleton";

let isLoggingOut = false;

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
    const url: string = error.config?.url ?? "";
    if (url.includes("/api/health")) return Promise.reject(error);

    const status = error.response?.status;

    if (status === 401 && isRetriableConfig(error.config) && !error.config._retry) {
      error.config._retry = true;
      const newAccessToken = await refreshTokenIfPossible();
      if (newAccessToken) {
        isLoggingOut = false;
        const headers = toPlainHeaders(error.config.headers);
        headers.Authorization = `Bearer ${newAccessToken}`;
        return api({ ...error.config, headers });
      }

      if (!isLoggingOut) {
        isLoggingOut = true;
        notifyLogout();
        setTimeout(() => { isLoggingOut = false; }, 3000);
      }
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
