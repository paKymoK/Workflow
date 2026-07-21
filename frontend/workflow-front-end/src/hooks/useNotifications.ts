import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@takypok/shared";
import { subscribeToForegroundMessages } from "../lib/firebaseMessaging";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  receivedAt: number;
  read: boolean;
}

const MAX_NOTIFICATIONS = 50;

/** In-memory only — this is the foreground counterpart to the service worker's background push. */
export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    return subscribeToForegroundMessages((payload) => {
      const { title, body } = payload.notification ?? {};
      setNotifications((prev) =>
        [
          {
            id: crypto.randomUUID(),
            title: title ?? "New notification",
            body: body ?? "",
            receivedAt: Date.now(),
            read: false,
          },
          ...prev,
        ].slice(0, MAX_NOTIFICATIONS),
      );
    });
  }, [isAuthenticated]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markAllRead, clearAll };
}
