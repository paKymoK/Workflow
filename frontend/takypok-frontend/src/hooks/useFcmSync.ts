import { useEffect, useRef } from "react";
import { useAuth, registerDeviceToken } from "@takypok/shared";
import { getFcmToken } from "../lib/firebaseMessaging";

/**
 * Registers this browser's FCM token once authenticated, mirroring how useChatSocket is mounted
 * once in AppLayout keyed on isAuthenticated. Unregistration on manual logout is handled at the
 * logout button's onClick (AppLayout.tsx) rather than here, since useAuth().logout() redirects
 * the page immediately — an effect cleanup here would race the navigation.
 */
export function useFcmSync() {
  const { isAuthenticated } = useAuth();
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    getFcmToken().then((token) => {
      if (cancelled || !token) return;
      tokenRef.current = token;
      registerDeviceToken(token).catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return tokenRef;
}
