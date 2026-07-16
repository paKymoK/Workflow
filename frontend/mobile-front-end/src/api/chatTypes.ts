export type ConversationType = 'DIRECT' | 'GROUP';
export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED';
export type MessageAttachmentType = 'IMAGE' | 'VIDEO';
export type MessageAttachmentStatus = 'PROCESSING' | 'READY' | 'FAILED';

export interface MessageAttachment {
  type: MessageAttachmentType;
  mediaAssetId: string;
  url: string | null;
  status: MessageAttachmentStatus;
}

export interface ChatSender {
  sub: string;
  name: string;
  email?: string;
  avatar?: string | null;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
}

export interface ReactionSummary {
  emoji: string;
  // Full list of reactor subs, not just a count — "mine" depends on the viewer, so each
  // client works that out itself by checking whether its own sub is in this list.
  subs: string[];
}

export interface ChatMessage {
  id: number;
  conversationId: string;
  sender: ChatSender;
  content: string | null;
  messageType: MessageType;
  attachments: MessageAttachment[] | null;
  createdAt: string;
  reactions: ReactionSummary[];
  // Null for a top-level message; set when this message is itself a reply (not shown in the
  // main thread, only inside the opened thread panel).
  parentMessageId: number | null;
  // Always 0 for a reply itself — no nested threads.
  replyCount: number;
}

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  name: string | null;
  participantSubs: string[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  // Only populated for DIRECT — a GROUP has no single "the other participant" these
  // watermarks could unambiguously refer to.
  peerReadThroughMessageId: number | null;
  peerDeliveredThroughMessageId: number | null;
  // GROUP only — null for DIRECT. false = public, discoverable/self-joinable via
  // browsePublicChannels + joinChannel; true = today's invite-only behavior.
  privateChannel: boolean | null;
  // Whether the caller is this conversation's owner — only the owner may invite/remove other
  // GROUP members (enforced server-side). Meaningless for DIRECT.
  owner: boolean;
}

export interface PublicChannel {
  id: string;
  name: string;
  memberCount: number;
}

export interface PresenceStatus {
  online: boolean;
  lastSeenAt: string | null;
}

export interface ConversationListResponse {
  items: ConversationSummary[];
  hasMore: boolean;
  nextBefore: string | null;
  nextBeforeId: string | null;
}

export interface CreateConversationRequest {
  type: ConversationType;
  name?: string;
  participantSubs: string[];
  // GROUP only; omit/true = invite-only (today's behavior), false = public channel.
  privateChannel?: boolean;
}

export interface SendMessageRequest {
  content: string;
  messageType?: MessageType;
  attachments?: MessageAttachment[];
  // Set to reply within a thread instead of posting a new top-level message.
  parentMessageId?: number;
}
