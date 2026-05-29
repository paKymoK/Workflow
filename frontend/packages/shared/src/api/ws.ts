export const wsBaseUrl = import.meta.env.VITE_API_BASE_URL
  .replace(/^https:\/\//, "wss://")
  .replace(/^http:\/\//, "ws://");
