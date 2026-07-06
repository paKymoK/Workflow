import { useCallback, useEffect, useRef } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addConversationMembers,
  browsePublicChannels,
  createConversation,
  fetchConversations,
  fetchMessages,
  fetchPresence,
  fetchReplies,
  joinChannel,
  markConversationRead,
  notifyTyping,
  removeConversationMember,
  renameConversation,
  searchMessages,
  sendMessage,
  toggleReaction,
} from "../api/messagesApi";
import { fetchUserBySub } from "../api/ticketApi";
import type { CreateConversationRequest, PresenceStatus, SendMessageRequest } from "../api/types";

// Live updates now arrive via useChatSocket (see AppLayout); this is just a safety-net
// poll in case a WS event is missed or the socket is momentarily disconnected.
const CONVERSATIONS_POLL_MS = 60_000;
const MESSAGES_PAGE_SIZE = 50;
// Matches the auto-clear TTL in useChatSocket — no point pinging the server more often
// than the indicator it drives can even go stale.
const TYPING_THROTTLE_MS = 2_500;

// `conversations` is a prefix of `thread`/`typing`/`search`/`replies` below (they all start
// with the "conversations" element too) — TanStack Query's default invalidateQueries/
// setQueryData matching is prefix-based, so any invalidateQueries({queryKey: messagesKeys.conversations})
// call MUST pass `exact: true`, or it will also match — and refetch, if active — the open
// thread and friends. This caused a real bug: an unhandled WS event type invalidating just
// the list also refetched the open thread, and that refetch's side effects re-emitted the
// same event, looping forever. See useChatSocket's RECEIPT_UPDATED handling.
export const messagesKeys = {
  conversations: ["conversations"] as const,
  thread: (conversationId: string) => ["conversations", conversationId, "messages"] as const,
  // Ad-hoc pub/sub, not a real fetch: useChatSocket writes into this key on TYPING events and
  // this hook just subscribes, the same trick the MESSAGE_CREATED handler uses on `thread`.
  typing: (conversationId: string) => ["conversations", conversationId, "typing"] as const,
  // Global, not per-conversation — presence isn't scoped to a single conversation.
  presence: ["presence"] as const,
  publicChannels: (search: string) => ["publicChannels", search] as const,
  search: (conversationId: string, query: string) =>
    ["conversations", conversationId, "search", query] as const,
  replies: (parentMessageId: number) => ["conversations", "thread-replies", parentMessageId] as const,
  // Global, sub -> resolved display name — same "shared cache, seeded + read separately"
  // trick as presence.
  participantNames: ["participantNames"] as const,
  // Same idea, sub -> avatar URL (or null) — populated alongside participantNames.
  participantAvatars: ["participantAvatars"] as const,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: messagesKeys.conversations, exact: true }),
  });
}

export function useRenameConversation(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => renameConversation(conversationId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: messagesKeys.conversations, exact: true }),
  });
}

export function useAddConversationMembers(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (participantSubs: string[]) =>
      addConversationMembers(conversationId, participantSubs),
    onSuccess: () => qc.invalidateQueries({ queryKey: messagesKeys.conversations, exact: true }),
  });
}

export function useRemoveConversationMember(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sub: string) => removeConversationMember(conversationId, sub),
    onSuccess: () => qc.invalidateQueries({ queryKey: messagesKeys.conversations, exact: true }),
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

/** Full-history search within one conversation, backed by Postgres full-text search — not
 * limited to whatever pages happen to be loaded. Caller should debounce `query`. */
export function useMessageSearch(conversationId: string | null, query: string) {
  return useQuery({
    queryKey: messagesKeys.search(conversationId ?? "", query),
    queryFn: () => searchMessages(conversationId as string, query),
    enabled: !!conversationId && query.trim().length > 0,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMessageRequest) => sendMessage(conversationId, payload),
    onSuccess: () => {
      // Thread cache is kept in sync by the MESSAGE_CREATED WS echo (see useChatSocket) —
      // invalidating it here too would refetch every already-loaded page on each send.
      qc.invalidateQueries({ queryKey: messagesKeys.conversations, exact: true });
    },
  });
}

/** No optimistic update — the REACTION_UPDATED WS echo (see useChatSocket) confirms the
 * toggle for everyone, including the actor, the same way the rest of this page works. */
export function useToggleReaction(conversationId: string) {
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) =>
      toggleReaction(conversationId, messageId, emoji),
  });
}

/** Not bound to a conversation at hook-creation time — pass the id at call time so
 * marking a just-selected conversation as read doesn't race the state update. */
export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => markConversationRead(conversationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: messagesKeys.conversations, exact: true }),
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

/** Public GROUP conversations the caller hasn't joined yet — for the "browse channels" tab. */
export function useBrowsePublicChannels(search: string, enabled: boolean) {
  return useQuery({
    queryKey: messagesKeys.publicChannels(search.trim().toLowerCase()),
    queryFn: () => browsePublicChannels(search.trim() || undefined),
    enabled,
  });
}

/** sub -> resolved display name, for DM peers (ConversationSummary only ever carries raw
 * subs, not names). Only ever reads the shared cache — useSyncParticipantNames populates it. */
export function useParticipantNamesMap(): Record<string, string> {
  const { data } = useQuery({
    queryKey: messagesKeys.participantNames,
    queryFn: () => Promise.resolve({} as Record<string, string>),
    enabled: false,
    initialData: {} as Record<string, string>,
    staleTime: Infinity,
  });
  return data;
}

/** sub -> avatar image URL (or null if that user has none set) — same cache-seeded-elsewhere
 * pattern as participant names, populated by the same useSyncParticipantNames fetch so DM
 * peer avatars never need a lookup of their own. */
export function useParticipantAvatarsMap(): Record<string, string | null> {
  const { data } = useQuery({
    queryKey: messagesKeys.participantAvatars,
    queryFn: () => Promise.resolve({} as Record<string, string | null>),
    enabled: false,
    initialData: {} as Record<string, string | null>,
    staleTime: Infinity,
  });
  return data;
}

/** Resolves names + avatars for whichever of the given subs aren't already cached. auth-service
 * has no batch-by-subs endpoint, so this is one request per missing sub — fine at DM-list
 * scale, but callers should pass only the subs that actually need this (DM peers), not every
 * channel member, to keep the request count small. */
export function useSyncParticipantNames(subs: string[]) {
  const qc = useQueryClient();
  const dedupedKey = Array.from(new Set(subs)).sort().join(",");

  useEffect(() => {
    if (!dedupedKey) return;
    const known = qc.getQueryData<Record<string, string>>(messagesKeys.participantNames) ?? {};
    const missing = dedupedKey.split(",").filter((sub) => !(sub in known));
    if (missing.length === 0) return;

    let cancelled = false;
    Promise.all(
      missing.map((sub) => fetchUserBySub(sub).then((user) => [sub, user] as const)),
    ).then((results) => {
      if (cancelled) return;
      qc.setQueryData<Record<string, string>>(messagesKeys.participantNames, (existing) => {
        const next = { ...existing };
        for (const [sub, user] of results) {
          if (user) next[sub] = user.name;
        }
        return next;
      });
      qc.setQueryData<Record<string, string | null>>(
        messagesKeys.participantAvatars,
        (existing) => {
          const next = { ...existing };
          for (const [sub, user] of results) {
            if (user) next[sub] = user.avatar ?? null;
          }
          return next;
        },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [dedupedKey, qc]);
}

/** Oldest-first replies to one top-level message, for the thread side panel. Live updates
 * (new replies while the panel is open) arrive via the MESSAGE_CREATED WS echo — see
 * useChatSocket, which appends into this same cache entry when parentMessageId is set. */
export function useThreadReplies(conversationId: string | null, parentMessageId: number | null) {
  return useQuery({
    queryKey: messagesKeys.replies(parentMessageId ?? -1),
    queryFn: () => fetchReplies(conversationId as string, parentMessageId as number),
    enabled: !!conversationId && parentMessageId !== null,
  });
}

export function useJoinChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => joinChannel(conversationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messagesKeys.conversations, exact: true });
      qc.invalidateQueries({ queryKey: ["publicChannels"] });
    },
  });
}
