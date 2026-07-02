import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addConversationMembers,
  createConversation,
  fetchConversations,
  fetchMessages,
  markConversationRead,
  removeConversationMember,
  renameConversation,
  sendMessage,
} from "../api/messagesApi";
import type { CreateConversationRequest, SendMessageRequest } from "../api/types";

// Live updates now arrive via useChatSocket (see AppLayout); this is just a safety-net
// poll in case a WS event is missed or the socket is momentarily disconnected.
const CONVERSATIONS_POLL_MS = 60_000;

export const messagesKeys = {
  conversations: ["conversations"] as const,
  thread: (conversationId: string) => ["conversations", conversationId, "messages"] as const,
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

export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: messagesKeys.thread(conversationId ?? ""),
    queryFn: () => fetchMessages(conversationId as string),
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMessageRequest) => sendMessage(conversationId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messagesKeys.thread(conversationId) });
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
