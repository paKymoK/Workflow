import { useEffect } from "react";
import { useQueryClient, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import { wsBaseUrl, useAuth } from "@takypok/shared";
import { messagesKeys } from "./useMessages";
import type { ChatMessage, PresenceStatus, ReactionSummary } from "../api/types";

type ChatEventType =
  | "MESSAGE_CREATED"
  | "PARTICIPANT_ADDED"
  | "PARTICIPANT_REMOVED"
  | "CONVERSATION_RENAMED"
  | "TYPING"
  | "PRESENCE_CHANGED"
  | "RECEIPT_UPDATED"
  | "REACTION_UPDATED";

interface ChatEvent {
  type: ChatEventType;
  payload: Record<string, unknown>;
}

const MAX_BACKOFF_MS = 15_000;
// The server only tells us "X is typing right now", never "X stopped" — so each event
// (re)starts a timer that clears that one sub's entry if no follow-up arrives in time.
const TYPING_TTL_MS = 3_000;
const typingClearTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Single app-wide connection to chat-service's WebSocket, mounted once in AppLayout so
 * unread badges/live messages work regardless of which page is open. Auth handshake mirrors
 * the existing workflow-service SLA socket: send the raw access token as the first frame.
 */
export function useChatSocket() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;

    let socket: WebSocket | null = null;
    let closedByEffect = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const connect = () => {
      const token = sessionStorage.getItem("access_token");
      socket = new WebSocket(`${wsBaseUrl}/chat-service/web-socket/chat`);

      socket.onopen = () => {
        attempt = 0;
        socket?.send(token ?? "");
      };

      socket.onmessage = (event) => {
        try {
          const chatEvent = JSON.parse(event.data) as ChatEvent;
          handleEvent(qc, chatEvent);
        } catch {
          // non-JSON frame, ignore
        }
      };

      socket.onclose = () => {
        if (closedByEffect) return;
        const delay = Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS);
        attempt += 1;
        retryTimer = setTimeout(connect, delay);
      };

      socket.onerror = () => socket?.close();
    };

    connect();

    return () => {
      closedByEffect = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, [isAuthenticated, qc]);
}

function handleEvent(qc: QueryClient, event: ChatEvent) {
  // Not conversation-scoped — a sub's online status matters to every conversation they're
  // in, not just one — so this is handled before the conversationId guard below.
  if (event.type === "PRESENCE_CHANGED") {
    const sub = event.payload.sub as string | undefined;
    const online = event.payload.online as boolean | undefined;
    if (!sub || online === undefined) return;
    qc.setQueryData<Record<string, PresenceStatus>>(messagesKeys.presence, (existing) => ({
      ...existing,
      [sub]: { online, lastSeenAt: online ? null : new Date().toISOString() },
    }));
    return;
  }

  const conversationId = event.payload.conversationId as string | undefined;
  if (!conversationId) return;

  if (event.type === "TYPING") {
    const sub = event.payload.sub as string | undefined;
    if (!sub) return;
    const name = (event.payload.name as string | undefined) ?? sub;
    const typingKey = messagesKeys.typing(conversationId);

    qc.setQueryData<Record<string, string>>(typingKey, (existing) => ({
      ...existing,
      [sub]: name,
    }));

    const timerId = `${conversationId}:${sub}`;
    clearTimeout(typingClearTimers.get(timerId));
    typingClearTimers.set(
      timerId,
      setTimeout(() => {
        typingClearTimers.delete(timerId);
        qc.setQueryData<Record<string, string>>(typingKey, (existing) => {
          if (!existing || !(sub in existing)) return existing;
          const rest = { ...existing };
          delete rest[sub];
          return rest;
        });
      }, TYPING_TTL_MS),
    );
    return; // ephemeral — doesn't touch the conversations list
  }

  if (event.type === "REACTION_UPDATED") {
    const messageId = event.payload.messageId as number | undefined;
    const reactions = event.payload.reactions as ReactionSummary[] | undefined;
    if (messageId === undefined || !reactions) return;
    qc.setQueryData<InfiniteData<ChatMessage[], number | undefined>>(
      messagesKeys.thread(conversationId),
      (existing) => {
        if (!existing) return existing;
        return {
          ...existing,
          pages: existing.pages.map((page) =>
            page.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
          ),
        };
      },
    );
    return; // doesn't affect the conversations list
  }

  if (event.type === "MESSAGE_CREATED") {
    const message = event.payload.message as ChatMessage;

    if (message.parentMessageId !== null) {
      // A reply — goes into the thread panel's own cache (only if that panel has been
      // opened at least once; otherwise there's nothing to append to, and the next open
      // fetches fresh via REST anyway), not the main thread's live message list.
      const parentId = message.parentMessageId;
      qc.setQueryData<ChatMessage[]>(messagesKeys.replies(parentId), (existing) => {
        if (!existing || existing.some((m) => m.id === message.id)) return existing;
        return [...existing, message];
      });
      // The parent's "💬 N replies" line lives in the main thread cache, though.
      qc.setQueryData<InfiniteData<ChatMessage[], number | undefined>>(
        messagesKeys.thread(conversationId),
        (existing) => {
          if (!existing) return existing;
          return {
            ...existing,
            pages: existing.pages.map((page) =>
              page.map((m) =>
                m.id === parentId ? { ...m, replyCount: m.replyCount + 1 } : m,
              ),
            ),
          };
        },
      );
    } else {
      qc.setQueryData<InfiniteData<ChatMessage[], number | undefined>>(
        messagesKeys.thread(conversationId),
        (existing) => {
          if (!existing) return existing;
          const [firstPage, ...restPages] = existing.pages;
          if (firstPage.some((m) => m.id === message.id)) return existing;
          return { ...existing, pages: [[message, ...firstPage], ...restPages] };
        },
      );
    }
  }

  // Covers unread counts / last-message preview (MESSAGE_CREATED) as well as membership
  // and rename changes — all of those only affect the conversation summary list.
  qc.invalidateQueries({ queryKey: messagesKeys.conversations });
}
