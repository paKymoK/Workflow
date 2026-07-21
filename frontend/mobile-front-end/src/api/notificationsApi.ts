import { api } from './axios';

export type DevicePlatform = 'ANDROID' | 'IOS';

export function registerDeviceToken(fcmToken: string, platform: DevicePlatform) {
  return api.post('/employee-service/v1/notifications/register-token', {
    platform,
    fcmToken,
  });
}

export function unregisterDeviceToken(fcmToken: string) {
  return api.post('/employee-service/v1/notifications/unregister-token', {
    fcmToken,
  });
}
