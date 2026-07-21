import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

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

/**
 * Registers the FCM service worker and requests a device token. Returns null (logged, never
 * throws) if the browser doesn't support push, permission is denied, or config is still the
 * placeholder — callers should treat "no token" as a normal, expected outcome pre-deployment.
 */
export async function getFcmToken(): Promise<string | null> {
  try {
    if (!(await isSupported())) return null;
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("REPLACE_")) {
      console.warn("[fcm] Firebase config is still a placeholder — skipping token registration");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging(app);
    return await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  } catch (err) {
    console.warn("[fcm] Failed to obtain FCM token:", err);
    return null;
  }
}
