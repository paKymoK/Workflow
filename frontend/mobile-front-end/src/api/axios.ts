import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const GATEWAY_URL = process.env.EXPO_PUBLIC_GATEWAY_URL ?? 'http://localhost:8080';

export const api = axios.create({
  baseURL: GATEWAY_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
