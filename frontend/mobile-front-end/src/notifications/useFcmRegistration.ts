import { useEffect } from 'react';

import { useAuth } from '@/src/auth/AuthContext';
import { registerDeviceToken } from '@/src/api/notificationsApi';
import { getFcmToken, currentPlatform } from './fcm';
import { setLastFcmToken } from './tokenStore';

/**
 * Registers this device's FCM token once authenticated, mirroring how useChatSocket is mounted
 * once at the app root (App.tsx) keyed on isAuthenticated. AuthContext's logout() reads the
 * token back via tokenStore to unregister before clearing tokens.
 */
export function useFcmRegistration() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    getFcmToken().then((token) => {
      if (cancelled || !token) return;
      setLastFcmToken(token);
      registerDeviceToken(token, currentPlatform).catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);
}
