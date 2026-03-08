import axios from "axios";
import { message } from "antd";
import { navigate } from "../lib/navigate";

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
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      sessionStorage.removeItem("access_token");
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
