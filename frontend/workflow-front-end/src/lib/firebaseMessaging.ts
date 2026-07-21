import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage, type Messaging, type MessagePayload } from "firebase/messaging";

// PLACEHOLDER: fill these in .env (VITE_FIREBASE_*) with your Firebase web app config before
// deploying — see firebase-messaging-sw.js for where the same config is needed for the service
// worker (that file can't read Vite env vars, so it has its own inlined copy).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

function isConfigured(): boolean {
  return !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("REPLACE_");
}

/** Shared by getFcmToken and subscribeToForegroundMessages so config/support checks live in one place. */
async function getMessagingInstance(): Promise<Messaging | null> {
  if (!isConfigured() || !(await isSupported())) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getMessaging(app);
}

/**
 * Registers the FCM service worker and requests a device token. Returns null (logged, never
 * throws) if the browser doesn't support push, permission is denied, or config is still the
 * placeholder — callers should treat "no token" as a normal, expected outcome pre-deployment.
 */
export async function getFcmToken(): Promise<string | null> {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) {
      if (!isConfigured()) {
        console.warn("[fcm] Firebase config is still a placeholder — skipping token registration");
      }
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    return await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  } catch (err) {
    console.warn("[fcm] Failed to obtain FCM token:", err);
    return null;
  }
}

/**
 * Foreground messages (tab open and focused) are delivered to the page via onMessage rather than
 * the service worker's onBackgroundMessage — this is what feeds the in-app notification bell.
 * Returns an unsubscribe function; safe to call even before the messaging instance resolves.
 */
export function subscribeToForegroundMessages(callback: (payload: MessagePayload) => void): () => void {
  let unsubscribe: (() => void) | null = null;
  let cancelled = false;
  getMessagingInstance()
    .then((messaging) => {
      if (!messaging || cancelled) return;
      unsubscribe = onMessage(messaging, callback);
    })
    .catch((err) => console.warn("[fcm] Failed to subscribe to foreground messages:", err));
  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}
