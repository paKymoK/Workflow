import { api } from "@takypok/shared";
import type {
  ChatMessage,
  Conversation,
  ConversationListResponse,
  ConversationSummary,
  CreateConversationRequest,
  PresenceStatus,
  SendMessageRequest,
} from "./types";

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const { data } = await api.get<ConversationListResponse>("/chat-service/chat/conversations");
  return data.items;
}

export async function createConversation(
  payload: CreateConversationRequest,
): Promise<Conversation> {
  const { data } = await api.post<Conversation>("/chat-service/chat/conversations", payload);
  return data;
}

export async function renameConversation(
  conversationId: string,
  name: string,
): Promise<Conversation> {
  const { data } = await api.patch<Conversation>(
    `/chat-service/chat/conversations/${conversationId}`,
    { name },
  );
  return data;
}

export async function addConversationMembers(
  conversationId: string,
  participantSubs: string[],
): Promise<void> {
  await api.post(`/chat-service/chat/conversations/${conversationId}/members`, {
    participantSubs,
  });
}

export async function removeConversationMember(
  conversationId: string,
  sub: string,
): Promise<void> {
  await api.delete(`/chat-service/chat/conversations/${conversationId}/members/${sub}`);
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await api.post(`/chat-service/chat/conversations/${conversationId}/read`);
}

export async function notifyTyping(conversationId: string): Promise<void> {
  await api.post(`/chat-service/chat/conversations/${conversationId}/typing`);
}

export async function fetchPresence(subs: string[]): Promise<Record<string, PresenceStatus>> {
  if (subs.length === 0) return {};
  // Comma-joined rather than a repeated-key array param — Spring binds a single
  // comma-separated value to List<String> just fine, no axios array-serialization quirks.
  const { data } = await api.get<Record<string, PresenceStatus>>("/chat-service/chat/presence", {
    params: { subs: subs.join(",") },
  });
  return data;
}

export async function fetchMessages(
  conversationId: string,
  before?: number,
  size = 50,
): Promise<ChatMessage[]> {
  const { data } = await api.get<ChatMessage[]>(
    `/chat-service/chat/conversations/${conversationId}/messages`,
    { params: { before, size } },
  );
  return data;
}

export async function sendMessage(
  conversationId: string,
  payload: SendMessageRequest,
): Promise<ChatMessage> {
  const { data } = await api.post<ChatMessage>(
    `/chat-service/chat/conversations/${conversationId}/messages`,
    payload,
  );
  return data;
}
