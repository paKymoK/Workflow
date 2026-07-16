import type { ChatMessage, ConversationSummary, MessageAttachment, MessageType } from '@/src/api/chatTypes';

export function conversationLabel(
  conversation: ConversationSummary,
  mySub?: string,
  nameBySub?: Record<string, string>,
): string {
  if (conversation.type === 'GROUP') return conversation.name ?? 'Group';
  const other = conversation.participantSubs.find((sub) => sub !== mySub);
  if (!other) return 'Direct message';
  return nameBySub?.[other] ?? other;
}

// Presence is only unambiguous for 1:1 conversations — a GROUP has no single "the other
// person" to show a dot for, so those are left undecorated.
export function directPeerSub(conversation: ConversationSummary, mySub?: string): string | null {
  if (conversation.type !== 'DIRECT') return null;
  return conversation.participantSubs.find((sub) => sub !== mySub) ?? null;
}

// Same DIRECT-only scoping as presence — a GROUP has no single peer watermark these ticks
// could reflect, so ticks are only ever shown for 1:1 conversations.
export function receiptStatus(
  message: ChatMessage,
  conversation: ConversationSummary | null,
): { label: string; read: boolean } | null {
  if (!conversation || conversation.type !== 'DIRECT') return null;
  const { peerReadThroughMessageId, peerDeliveredThroughMessageId } = conversation;
  if (peerReadThroughMessageId != null && message.id <= peerReadThroughMessageId) {
    return { label: '✓✓ Read', read: true };
  }
  if (peerDeliveredThroughMessageId != null && message.id <= peerDeliveredThroughMessageId) {
    return { label: '✓✓ Delivered', read: false };
  }
  return { label: '✓ Sent', read: false };
}

// Web's composer produces Tiptap HTML; mobile's composer sends plain text, but a message
// authored on web can still arrive here as HTML — strip tags so it never renders raw markup.
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function lastMessagePreview(lastMessage: ChatMessage | null): string {
  if (!lastMessage) return 'No messages yet';
  const text = lastMessage.content ? stripHtml(lastMessage.content) : '';
  if (text) return text;
  const hasImage = lastMessage.attachments?.some((a) => a.type === 'IMAGE');
  const hasVideo = lastMessage.attachments?.some((a) => a.type === 'VIDEO');
  if (hasImage && hasVideo) return '📎 Photo & video';
  if (hasImage) return '📎 Photo';
  if (hasVideo) return '📎 Video';
  return '';
}

export function deriveMessageType(hasContent: boolean, attachments: MessageAttachment[]): MessageType {
  if (attachments.length === 0) return 'TEXT';
  const hasImage = attachments.some((a) => a.type === 'IMAGE');
  const hasVideo = attachments.some((a) => a.type === 'VIDEO');
  if (hasContent || (hasImage && hasVideo)) return 'MIXED';
  return hasImage ? 'IMAGE' : 'VIDEO';
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function formatLastSeen(lastSeenAt: string | null): string {
  if (!lastSeenAt) return 'Offline';
  return `Last seen ${formatTime(lastSeenAt)}`;
}
