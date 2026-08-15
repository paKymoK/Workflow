import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';

/**
 * Requests permission and returns this device's FCM token. Returns null (logged, never throws)
 * if permission is denied or Firebase isn't configured yet (placeholder google-services.json /
 * GoogleService-Info.plist) — callers should treat "no token" as a normal, expected outcome
 * pre-deployment, same as the web app's getFcmToken.
 */
export async function getFcmToken(): Promise<string | null> {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (!enabled) return null;

    return await messaging().getToken();
  } catch (err) {
    if (__DEV__) console.warn('[fcm] Failed to obtain FCM token:', err);
    return null;
  }
}

export const currentPlatform: 'ANDROID' | 'IOS' = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
