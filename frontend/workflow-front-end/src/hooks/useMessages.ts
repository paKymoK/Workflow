import { useCallback, useEffect, useRef } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addConversationMembers,
  createConversation,
  fetchConversations,
  fetchMessages,
  fetchPresence,
  markConversationRead,
  notifyTyping,
  removeConversationMember,
  renameConversation,
  sendMessage,
} from "../api/messagesApi";
import type { CreateConversationRequest, PresenceStatus, SendMessageRequest } from "../api/types";

// Live updates now arrive via useChatSocket (see AppLayout); this is just a safety-net
// poll in case a WS event is missed or the socket is momentarily disconnected.
const CONVERSATIONS_POLL_MS = 60_000;
const MESSAGES_PAGE_SIZE = 50;
// Matches the auto-clear TTL in useChatSocket — no point pinging the server more often
// than the indicator it drives can even go stale.
const TYPING_THROTTLE_MS = 2_500;

export const messagesKeys = {
  conversations: ["conversations"] as const,
  thread: (conversationId: string) => ["conversations", conversationId, "messages"] as const,
  // Ad-hoc pub/sub, not a real fetch: useChatSocket writes into this key on TYPING events and
  // this hook just subscribes, the same trick the MESSAGE_CREATED handler uses on `thread`.
  typing: (conversationId: string) => ["conversations", conversationId, "typing"] as const,
  // Global, not per-conversation — presence isn't scoped to a single conversation.
  presence: ["presence"] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: messagesKeys.conversations,
    queryFn: fetchConversations,
    refetchInterval: CONVERSATIONS_POLL_MS,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateConversationRequest) => createConversation(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: messagesKeys.conversations }),
  });
}

export function useRenameConversation(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => renameConversation(conversationId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: messagesKeys.conversations }),
  });
}

export function useAddConversationMembers(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (participantSubs: string[]) =>
      addConversationMembers(conversationId, participantSubs),
    onSuccess: () => qc.invalidateQueries({ queryKey: messagesKeys.conversations }),
  });
}

export function useRemoveConversationMember(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sub: string) => removeConversationMember(conversationId, sub),
    onSuccess: () => qc.invalidateQueries({ queryKey: messagesKeys.conversations }),
  });
}

/** Newest-first pages; a page's cursor is the id of its own oldest (last) message,
 * matching the backend's `findByConversationIdAndIdLessThanOrderByIdDesc` pagination. */
export function useConversationMessages(conversationId: string | null) {
  return useInfiniteQuery({
    queryKey: messagesKeys.thread(conversationId ?? ""),
    queryFn: ({ pageParam }) =>
      fetchMessages(conversationId as string, pageParam, MESSAGES_PAGE_SIZE),
    enabled: !!conversationId,
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length < MESSAGES_PAGE_SIZE ? undefined : lastPage[lastPage.length - 1].id,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMessageRequest) => sendMessage(conversationId, payload),
    onSuccess: () => {
      // Thread cache is kept in sync by the MESSAGE_CREATED WS echo (see useChatSocket) —
      // invalidating it here too would refetch every already-loaded page on each send.
      qc.invalidateQueries({ queryKey: messagesKeys.conversations });
    },
  });
}

/** Not bound to a conversation at hook-creation time — pass the id at call time so
 * marking a just-selected conversation as read doesn't race the state update. */
export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => markConversationRead(conversationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: messagesKeys.conversations }),
  });
}

/** Fire-and-forget, throttled client-side so every keystroke doesn't hit the network —
 * the server broadcast this drives is purely ephemeral, no ack needed. */
export function useSendTyping(conversationId: string | null) {
  const lastSentAtRef = useRef(0);
  return useCallback(() => {
    if (!conversationId) return;
    const now = Date.now();
    if (now - lastSentAtRef.current < TYPING_THROTTLE_MS) return;
    lastSentAtRef.current = now;
    notifyTyping(conversationId).catch(() => {});
  }, [conversationId]);
}

/** sub -> display name of everyone currently typing in this conversation, per the
 * TYPING events useChatSocket writes into this same query key (self-expiring). */
export function useTypingUsers(conversationId: string | null): Record<string, string> {
  const { data } = useQuery({
    queryKey: messagesKeys.typing(conversationId ?? ""),
    queryFn: () => Promise.resolve({} as Record<string, string>),
    enabled: false,
    initialData: {} as Record<string, string>,
    staleTime: Infinity,
  });
  return data;
}

/** sub -> online/last-seen, kept live by PRESENCE_CHANGED events (see useChatSocket) — this
 * hook only ever reads that shared cache entry, never fetches itself. */
export function usePresenceMap(): Record<string, PresenceStatus> {
  const { data } = useQuery({
    queryKey: messagesKeys.presence,
    queryFn: () => Promise.resolve({} as Record<string, PresenceStatus>),
    enabled: false,
    initialData: {} as Record<string, PresenceStatus>,
    staleTime: Infinity,
  });
  return data;
}

/** Seeds the shared presence cache with initial state for the given subs (e.g. every
 * participant across the conversation list) — after that, live updates arrive over the
 * socket. Re-fetches whenever the (order-independent) set of subs changes. */
export function useSyncPresence(subs: string[]) {
  const qc = useQueryClient();
  const dedupedKey = Array.from(new Set(subs)).sort().join(",");

  useEffect(() => {
    if (!dedupedKey) return;
    let cancelled = false;
    fetchPresence(dedupedKey.split(",")).then((statuses) => {
      if (cancelled) return;
      qc.setQueryData<Record<string, PresenceStatus>>(messagesKeys.presence, (existing) => ({
        ...existing,
        ...statuses,
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [dedupedKey, qc]);
}
