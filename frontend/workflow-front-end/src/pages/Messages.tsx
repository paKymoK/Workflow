import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Avatar,
  AutoComplete,
  Badge,
  Button,
  Empty,
  Input,
  message as antMessage,
  Modal,
  Popover,
  Spin,
  Switch,
  Tabs,
} from "antd";
import {
  LockOutlined,
  MessageOutlined,
  NumberOutlined,
  PaperClipOutlined,
  PlusOutlined,
  SendOutlined,
  SmileOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import DOMPurify from "dompurify";
import { useAuth } from "@takypok/shared";
import { fetchUsers, getFileUrl, uploadFile, uploadVideo, type UserSummary } from "../api/ticketApi";
import type {
  ChatMessage,
  ConversationSummary,
  MessageAttachment,
  MessageType,
  PresenceStatus,
} from "../api/types";
import { dynamicStyle } from "../utils/dynamicStyle";
import { resizeImageForUpload } from "../utils/imageResize";
import { waitForVideoReady } from "../utils/videoJob";
import LazyVideoAttachment from "../components/LazyVideoAttachment";
import MessageComposerAttachments, {
  type PendingAttachment,
} from "../components/MessageComposerAttachments";
import MessageContent from "../components/MessageContent";
import RichTextEditor from "../components/RichTextEditor";
import {
  useAddConversationMembers,
  useBrowsePublicChannels,
  useConversationMessages,
  useConversations,
  useCreateConversation,
  useJoinChannel,
  useMarkConversationRead,
  useMessageSearch,
  useParticipantAvatarsMap,
  useParticipantNamesMap,
  useRemoveConversationMember,
  useSendMessage,
  usePresenceMap,
  useSendTyping,
  useSyncParticipantNames,
  useSyncPresence,
  useThreadReplies,
  useToggleReaction,
  useTypingUsers,
} from "../hooks/useMessages";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function conversationLabel(
  conversation: ConversationSummary,
  mySub?: string,
  nameBySub?: Record<string, string>,
) {
  if (conversation.type === "GROUP") return conversation.name ?? "Group";
  const other = conversation.participantSubs.find((sub) => sub !== mySub);
  if (!other) return "Direct message";
  return nameBySub?.[other] ?? other;
}

// Presence is only unambiguous for 1:1 conversations — a GROUP has no single "the other
// person" to show a dot for, so those are left undecorated for now.
function directPeerSub(conversation: ConversationSummary, mySub?: string): string | null {
  if (conversation.type !== "DIRECT") return null;
  return conversation.participantSubs.find((sub) => sub !== mySub) ?? null;
}

// Same DIRECT-only scoping as presence — a GROUP has no single peer watermark these ticks
// could reflect, so ticks are only ever shown for 1:1 conversations.
function receiptStatus(
  message: ChatMessage,
  conversation: ConversationSummary | null,
): { label: string; read: boolean } | null {
  if (!conversation || conversation.type !== "DIRECT") return null;
  const { peerReadThroughMessageId, peerDeliveredThroughMessageId } = conversation;
  if (peerReadThroughMessageId != null && message.id <= peerReadThroughMessageId) {
    return { label: "✓✓ Read", read: true };
  }
  if (peerDeliveredThroughMessageId != null && message.id <= peerDeliveredThroughMessageId) {
    return { label: "✓✓ Delivered", read: false };
  }
  return { label: "✓ Sent", read: false };
}

// Tiptap's "empty" state is "<p></p>", not "" — strip tags to check for actual text.
function isHtmlEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}

// Rich-text message content is HTML; previews (conversation list, etc.) need plain text.
function htmlToPlainText(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

function lastMessagePreview(lastMessage: ChatMessage | null): string {
  if (!lastMessage) return "No messages yet";
  const text = lastMessage.content ? htmlToPlainText(lastMessage.content) : "";
  if (text) return text;
  const hasImage = lastMessage.attachments?.some((a) => a.type === "IMAGE");
  const hasVideo = lastMessage.attachments?.some((a) => a.type === "VIDEO");
  if (hasImage && hasVideo) return "📎 Photo & video";
  if (hasImage) return "📎 Photo";
  if (hasVideo) return "📎 Video";
  return "";
}

function deriveMessageType(hasContent: boolean, attachments: MessageAttachment[]): MessageType {
  if (attachments.length === 0) return "TEXT";
  const hasImage = attachments.some((a) => a.type === "IMAGE");
  const hasVideo = attachments.some((a) => a.type === "VIDEO");
  if (hasContent || (hasImage && hasVideo)) return "MIXED";
  return hasImage ? "IMAGE" : "VIDEO";
}

function ConversationRow({
  conversation,
  mySub,
  selectedId,
  presenceBySub,
  nameBySub,
  avatarBySub,
  onOpen,
}: {
  conversation: ConversationSummary;
  mySub?: string;
  selectedId: string | null;
  presenceBySub: Record<string, PresenceStatus>;
  nameBySub: Record<string, string>;
  avatarBySub: Record<string, string | null>;
  onOpen: (id: string) => void;
}) {
  const peerSub = directPeerSub(conversation, mySub);
  const peerOnline = peerSub ? (presenceBySub[peerSub]?.online ?? false) : false;
  const peerAvatarUrl = peerSub ? avatarBySub[peerSub] : null;
  const channelIcon =
    conversation.type === "GROUP" ? (
      conversation.privateChannel ? <LockOutlined /> : <NumberOutlined />
    ) : (
      <UserOutlined />
    );

  return (
    <button
      onClick={() => onOpen(conversation.id)}
      className={`w-full flex items-center gap-2.5 px-4 py-2.5 border-none text-left cursor-pointer transition-colors ${
        conversation.id === selectedId ? "bg-[var(--hover)]" : "bg-transparent hover:bg-[var(--hover)]"
      }`}
    >
      <div className="relative flex-shrink-0">
        <Avatar
          src={peerAvatarUrl ?? undefined}
          icon={!peerAvatarUrl ? channelIcon : undefined}
          shape={conversation.type === "GROUP" ? "square" : "circle"}
          className="!bg-[var(--accent)] !text-white"
        />
        {peerSub && (
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--surface)] ${
              peerOnline ? "bg-[var(--green)]" : "bg-[var(--text-faint)]"
            }`}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12.5px] font-semibold text-[var(--text)] truncate">
            {conversationLabel(conversation, mySub, nameBySub)}
          </span>
          {conversation.unreadCount > 0 && <Badge count={conversation.unreadCount} size="small" />}
        </div>
        <span className="block text-[11px] text-[var(--text-faint)] truncate">
          {lastMessagePreview(conversation.lastMessage)}
        </span>
      </div>
    </button>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const mySub = user?.sub as string | undefined;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newOpen, setNewOpen] = useState(false);
  const [newTab, setNewTab] = useState<"dm" | "channel" | "browse">("dm");
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<UserSummary[]>([]);
  const [picked, setPicked] = useState<UserSummary | null>(null);
  const optionsRef = useRef<UserSummary[]>([]);
  const [channelName, setChannelName] = useState("");
  const [channelPrivate, setChannelPrivate] = useState(true);
  const [channelSearch, setChannelSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteOptions, setInviteOptions] = useState<UserSummary[]>([]);
  const inviteOptionsRef = useRef<UserSummary[]>([]);
  const [messageSearch, setMessageSearch] = useState("");
  const [debouncedMessageSearch, setDebouncedMessageSearch] = useState("");
  const [sidebarSearch, setSidebarSearch] = useState("");
  // Messenger-style: react/reply icons and the receipt line are hidden until hovered
  // (desktop) or tapped (this tracks the one tapped-open, mobile) — except the receipt
  // line, which always shows on the last message regardless.
  const [revealedMessageId, setRevealedMessageId] = useState<number | null>(null);
  const [threadParentId, setThreadParentId] = useState<number | null>(null);
  const [threadDraft, setThreadDraft] = useState("");
  // RichTextEditor/Tiptap only uses `content` as the *initial* value — changing the prop
  // after mount doesn't clear what's visibly typed. Bumping these forces a remount (fresh
  // editor instance) whenever a send should visibly reset the composer.
  const [composerResetKey, setComposerResetKey] = useState(0);
  const [replyResetKey, setReplyResetKey] = useState(0);
  // Teams-style: plain-looking box by default, "Aa" reveals the formatting toolbar. Same
  // editor instance throughout, so toggling never loses what's already typed.
  const [richOpen, setRichOpen] = useState(false);
  const [replyRichOpen, setReplyRichOpen] = useState(false);

  const { data: conversations = [], isLoading } = useConversations();
  const { mutate: createConversation, isPending: creating } = useCreateConversation();
  const { mutate: markRead } = useMarkConversationRead();
  const { mutate: joinChannelMutate, isPending: joining } = useJoinChannel();
  const { data: publicChannels = [], isLoading: loadingChannels } = useBrowsePublicChannels(
    channelSearch,
    newOpen && newTab === "browse",
  );

  const directPeerSubs = useMemo(
    () =>
      Array.from(
        new Set(
          conversations
            .map((c) => directPeerSub(c, mySub))
            .filter((sub): sub is string => sub !== null),
        ),
      ),
    [conversations, mySub],
  );
  useSyncParticipantNames(directPeerSubs);
  const nameBySub = useParticipantNamesMap();
  const avatarBySub = useParticipantAvatarsMap();

  const sidebarQuery = sidebarSearch.trim().toLowerCase();
  const directConversations = useMemo(
    () =>
      conversations.filter(
        (c) =>
          c.type === "DIRECT" &&
          (!sidebarQuery ||
            conversationLabel(c, mySub, nameBySub).toLowerCase().includes(sidebarQuery)),
      ),
    [conversations, mySub, nameBySub, sidebarQuery],
  );
  const channelConversations = useMemo(
    () =>
      conversations.filter(
        (c) =>
          c.type === "GROUP" &&
          (!sidebarQuery ||
            conversationLabel(c, mySub, nameBySub).toLowerCase().includes(sidebarQuery)),
      ),
    [conversations, mySub, nameBySub, sidebarQuery],
  );

  const allParticipantSubs = useMemo(
    () =>
      Array.from(
        new Set(conversations.flatMap((c) => c.participantSubs).filter((sub) => sub !== mySub)),
      ),
    [conversations, mySub],
  );
  useSyncPresence(allParticipantSubs);
  const presenceBySub = usePresenceMap();
  const {
    data: messagePages,
    isLoading: loadingMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useConversationMessages(selectedId);
  const { mutate: send, isPending: sending } = useSendMessage(selectedId ?? "");
  const { mutate: toggleReaction } = useToggleReaction(selectedId ?? "");
  const { mutate: addMembers } = useAddConversationMembers(selectedId ?? "");
  const { mutate: removeMember } = useRemoveConversationMember(selectedId ?? "");
  const sendTyping = useSendTyping(selectedId);
  const typingUsers = useTypingUsers(selectedId);
  const { data: threadReplies = [], isLoading: loadingReplies } = useThreadReplies(
    selectedId,
    threadParentId,
  );

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const selectedPeerSub = selected ? directPeerSub(selected, mySub) : null;
  const selectedPeerStatus = selectedPeerSub ? presenceBySub[selectedPeerSub] : undefined;
  const presenceLabel = selectedPeerSub
    ? selectedPeerStatus?.online
      ? "Online"
      : selectedPeerStatus?.lastSeenAt
        ? `Last seen ${dayjs(selectedPeerStatus.lastSeenAt).format("HH:mm")}`
        : "Offline"
    : null;

  const typingLabel = useMemo(() => {
    const names = Object.values(typingUsers);
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} is typing…`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
    return "Several people are typing…";
  }, [typingUsers]);

  // Pages arrive newest-first (each page itself newest->oldest), so concatenating them
  // is already fully sorted descending; reverse once for oldest-first chat rendering.
  const messages = useMemo(
    () => (messagePages ? messagePages.pages.flat().reverse() : []),
    [messagePages],
  );
  const threadParentMessage = threadParentId
    ? (messages.find((m) => m.id === threadParentId) ?? null)
    : null;

  // Debounced so every keystroke doesn't hit the search endpoint.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedMessageSearch(messageSearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [messageSearch]);

  const { data: searchResults, isFetching: searching } = useMessageSearch(
    selectedId,
    debouncedMessageSearch,
  );

  // Backend full-text search over the conversation's entire history (not just loaded
  // pages) — results come back newest-first, matching `messages`' own raw order before the
  // reverse above, so the same reversal gets them into oldest-first render order.
  const visibleMessages = useMemo(() => {
    if (!debouncedMessageSearch) return messages;
    return searchResults ? [...searchResults].reverse() : [];
  }, [messages, debouncedMessageSearch, searchResults]);

  useEffect(() => {
    setMessageSearch("");
    setDebouncedMessageSearch("");
    setRevealedMessageId(null);
    setThreadParentId(null);
    setThreadDraft("");
    setRichOpen(false);
    setReplyRichOpen(false);
  }, [selectedId]);

  // Also reset when switching which thread is open (without necessarily switching
  // conversation) — otherwise a stale draft from the previous thread would carry over.
  useEffect(() => {
    setThreadDraft("");
    setReplyRichOpen(false);
  }, [threadParentId]);

  const scrollParentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: visibleMessages.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 68,
    overscan: 8,
    getItemKey: (index) => visibleMessages[index].id,
  });

  // Auto-scroll to bottom on conversation switch and when a new (newest) message arrives —
  // but not when older pages get prepended (handled separately below), and not while a
  // search filter is active (jumping around a filtered view would be jarring mid-search).
  const newestMessageId = messages.length ? messages[messages.length - 1].id : null;
  const prevNewestMessageIdRef = useRef<number | null>(null);

  useEffect(() => {
    prevNewestMessageIdRef.current = null;
  }, [selectedId]);

  useLayoutEffect(() => {
    if (newestMessageId === null || newestMessageId === prevNewestMessageIdRef.current) return;
    prevNewestMessageIdRef.current = newestMessageId;
    if (debouncedMessageSearch) return;
    rowVirtualizer.scrollToIndex(visibleMessages.length - 1, { align: "end" });
  }, [newestMessageId, visibleMessages.length, rowVirtualizer, debouncedMessageSearch]);

  useEffect(() => {
    if (!selectedId || newestMessageId === null) return;
    markRead(selectedId);
  }, [selectedId, newestMessageId, markRead]);

  // Keep the viewport anchored on the message the user was looking at when an older
  // page loads in above it, instead of letting the prepend shove the view around.
  const prevScrollHeightRef = useRef<number | null>(null);
  const pageCount = messagePages?.pages.length ?? 0;

  useLayoutEffect(() => {
    const el = scrollParentRef.current;
    if (!el || prevScrollHeightRef.current === null) return;
    el.scrollTop += el.scrollHeight - prevScrollHeightRef.current;
    prevScrollHeightRef.current = null;
  }, [pageCount]);

  function handleThreadScroll() {
    if (debouncedMessageSearch) return; // paginating the live thread while viewing search hits doesn't apply
    const el = scrollParentRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    if (el.scrollTop < 200) {
      prevScrollHeightRef.current = el.scrollHeight;
      fetchNextPage();
    }
  }

  function openConversation(id: string) {
    setSelectedId(id);
    setDraft("");
    setPendingAttachments([]);
    markRead(id);
  }

  function updatePendingAttachment(key: string, patch: Partial<PendingAttachment>) {
    setPendingAttachments((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  function removePendingAttachment(key: string) {
    setPendingAttachments((prev) => prev.filter((p) => p.key !== key));
  }

  async function handleAttachFiles(files: FileList | null) {
    if (!files) return;

    for (const file of Array.from(files)) {
      const key = `${Date.now()}-${Math.random()}`;
      const isVideo = file.type.startsWith("video/");
      setPendingAttachments((prev) => [
        ...prev,
        { key, name: file.name, kind: isVideo ? "video" : "image", status: "uploading" },
      ]);

      try {
        if (isVideo) {
          const job = await uploadVideo(file);
          updatePendingAttachment(key, { status: "processing" });
          const finalStatus = await waitForVideoReady(job.jobId);
          if (finalStatus.status !== "DONE") {
            throw new Error(finalStatus.errorMessage ?? "Video processing failed");
          }
          updatePendingAttachment(key, {
            status: "ready",
            attachment: { type: "VIDEO", mediaAssetId: job.videoId, url: null, status: "READY" },
          });
        } else {
          const resized = await resizeImageForUpload(file);
          const uploaded = await uploadFile(resized);
          updatePendingAttachment(key, {
            status: "ready",
            attachment: {
              type: "IMAGE",
              mediaAssetId: uploaded.id,
              url: getFileUrl(uploaded.id, uploaded.extension),
              status: "READY",
            },
          });
        }
      } catch {
        updatePendingAttachment(key, { status: "failed" });
        antMessage.error(`Failed to attach ${file.name}`);
      }
    }
  }

  async function handleSearch(query: string) {
    setSearch(query);
    setPicked(null);
    if (!query.trim()) {
      optionsRef.current = [];
      setOptions([]);
      return;
    }
    const results = await fetchUsers(query, 8);
    const filtered = results.filter((u) => u.sub !== mySub);
    optionsRef.current = filtered;
    setOptions(filtered);
  }

  function closeNewModal() {
    setNewOpen(false);
    setNewTab("dm");
    setPicked(null);
    setSearch("");
    setOptions([]);
    optionsRef.current = [];
    setChannelName("");
    setChannelPrivate(true);
    setChannelSearch("");
  }

  async function handleInviteSearch(query: string) {
    setInviteSearch(query);
    if (!query.trim()) {
      inviteOptionsRef.current = [];
      setInviteOptions([]);
      return;
    }
    const results = await fetchUsers(query, 8);
    const existing = new Set(selected?.participantSubs ?? []);
    const filtered = results.filter((u) => u.sub !== mySub && !existing.has(u.sub));
    inviteOptionsRef.current = filtered;
    setInviteOptions(filtered);
  }

  function handleInviteSelect(value: string) {
    const user = inviteOptionsRef.current.find((u) => u.sub === value);
    if (!user) return;
    addMembers([user.sub], {
      onSuccess: () => antMessage.success(`${user.name} added`),
      onError: () => antMessage.error("Failed to add member"),
    });
    setInviteSearch("");
    setInviteOptions([]);
    inviteOptionsRef.current = [];
  }

  function closeInviteModal() {
    setInviteOpen(false);
    setInviteSearch("");
    setInviteOptions([]);
    inviteOptionsRef.current = [];
  }

  function handleRemoveMember(sub: string) {
    removeMember(sub, { onError: () => antMessage.error("Failed to remove member") });
  }

  function handleCreateDm() {
    if (!picked) return;
    createConversation(
      { type: "DIRECT", participantSubs: [picked.sub] },
      {
        onSuccess: (conversation) => {
          closeNewModal();
          setSelectedId(conversation.id);
        },
      },
    );
  }

  function handleCreateChannel() {
    if (!channelName.trim()) return;
    createConversation(
      {
        type: "GROUP",
        name: channelName.trim(),
        participantSubs: [],
        privateChannel: channelPrivate,
      },
      {
        onSuccess: (conversation) => {
          closeNewModal();
          setSelectedId(conversation.id);
        },
      },
    );
  }

  function handleJoinChannel(channelId: string) {
    joinChannelMutate(channelId, {
      onSuccess: () => {
        closeNewModal();
        setSelectedId(channelId);
      },
    });
  }

  const hasPendingUploads = pendingAttachments.some(
    (p) => p.status === "uploading" || p.status === "processing",
  );
  const readyAttachments = pendingAttachments
    .filter((p) => p.status === "ready" && p.attachment)
    .map((p) => p.attachment as MessageAttachment);
  const canSend =
    !hasPendingUploads && (!isHtmlEmpty(draft) || readyAttachments.length > 0);

  function handleSend() {
    if (!selectedId || !canSend) return;
    const content = draft;
    setDraft("");
    setPendingAttachments([]);
    setComposerResetKey((k) => k + 1);
    send({
      content,
      messageType: deriveMessageType(!isHtmlEmpty(content), readyAttachments),
      attachments: readyAttachments.length > 0 ? readyAttachments : undefined,
    });
  }

  function handleSendReply() {
    if (!selectedId || !threadParentId || isHtmlEmpty(threadDraft)) return;
    const content = threadDraft;
    setThreadDraft("");
    setReplyResetKey((k) => k + 1);
    send({ content, messageType: "TEXT", parentMessageId: threadParentId });
  }

  return (
    <div className="h-full flex gap-3.5">
      {/* Conversation list */}
      <div className="w-72 flex-shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)]">
          <span className="text-[14px] font-bold text-[var(--text)]">Messages</span>
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setNewOpen(true)}
            className="!text-[var(--accent)]"
          />
        </div>
        <div className="px-3 pt-2.5">
          <Input
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            placeholder="Search people, channels..."
            allowClear
            size="small"
            className="w-full"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spin />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full py-8">
              <p className="text-[11px] text-[var(--text-faint)]">
                No conversations yet
              </p>
            </div>
          ) : sidebarQuery && channelConversations.length === 0 && directConversations.length === 0 ? (
            <div className="flex items-center justify-center h-full py-8">
              <p className="text-[11px] text-[var(--text-faint)]">
                No matches for “{sidebarSearch.trim()}”
              </p>
            </div>
          ) : (
            <>
              {channelConversations.length > 0 && (
                <>
                  <p className="px-4 pt-2.5 pb-1 text-[10px] font-bold tracking-[.04em] text-[var(--text-faint)] uppercase">
                    Channels
                  </p>
                  {channelConversations.map((conversation) => (
                    <ConversationRow
                      key={conversation.id}
                      conversation={conversation}
                      mySub={mySub}
                      selectedId={selectedId}
                      presenceBySub={presenceBySub}
                      nameBySub={nameBySub}
                      avatarBySub={avatarBySub}
                      onOpen={openConversation}
                    />
                  ))}
                </>
              )}
              {directConversations.length > 0 && (
                <>
                  <p className="px-4 pt-2.5 pb-1 text-[10px] font-bold tracking-[.04em] text-[var(--text-faint)] uppercase">
                    Direct Messages
                  </p>
                  {directConversations.map((conversation) => (
                    <ConversationRow
                      key={conversation.id}
                      conversation={conversation}
                      mySub={mySub}
                      selectedId={selectedId}
                      presenceBySub={presenceBySub}
                      nameBySub={nameBySub}
                      avatarBySub={avatarBySub}
                      onOpen={openConversation}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <Empty
              description={
                <span className="text-[11px] text-[var(--text-faint)]">
                  Select a conversation
                </span>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 px-[18px] py-3.5 border-b border-[var(--border)]">
              <div className="min-w-0 flex-1">
                <span className="text-[14px] font-bold text-[var(--text)]">
                  {conversationLabel(selected, mySub, nameBySub)}
                </span>
                {presenceLabel && (
                  <span className={`block text-[11px] ${selectedPeerStatus?.online ? "text-[var(--green)]" : "text-[var(--text-faint)]"}`}>
                    {presenceLabel}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selected.type === "GROUP" && selected.owner && (
                  <Button
                    type="text"
                    size="small"
                    icon={<UserAddOutlined />}
                    onClick={() => setInviteOpen(true)}
                    className="!text-[var(--accent)]"
                  />
                )}
                <Input
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                  placeholder="Search in conversation..."
                  allowClear
                  size="small"
                  className="!w-48"
                />
              </div>
            </div>

            <div ref={scrollParentRef} onScroll={handleThreadScroll} className="flex-1 overflow-y-auto p-4">
              {loadingMessages || (debouncedMessageSearch && searching) ? (
                <div className="flex justify-center py-8">
                  <Spin />
                </div>
              ) : debouncedMessageSearch && visibleMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[11px] text-[var(--text-faint)]">
                    No messages match “{debouncedMessageSearch}”
                  </p>
                </div>
              ) : (
                <>
                  {isFetchingNextPage && !debouncedMessageSearch && (
                    <div className="flex justify-center py-2">
                      <Spin size="small" />
                    </div>
                  )}
                  <div
                    className="relative"
                    style={dynamicStyle({ height: rowVirtualizer.getTotalSize() })}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const msg = visibleMessages[virtualRow.index];
                      const mine = msg.sender.sub === mySub;
                      const receipt = mine ? receiptStatus(msg, selected) : null;
                      const isLastMessage = msg.id === newestMessageId;
                      const isRevealed = revealedMessageId === msg.id;
                      const receiptRevealed = isLastMessage || isRevealed;
                      // Messenger-style clustering: avatar + name/time header show once per
                      // consecutive run from the same sender, not on every bubble.
                      const prevMsg = visibleMessages[virtualRow.index - 1];
                      const nextMsg = visibleMessages[virtualRow.index + 1];
                      const startOfGroup = !prevMsg || prevMsg.sender.sub !== msg.sender.sub;
                      const endOfGroup = !nextMsg || nextMsg.sender.sub !== msg.sender.sub;
                      return (
                        <div
                          key={virtualRow.key}
                          data-index={virtualRow.index}
                          ref={rowVirtualizer.measureElement}
                          className={`absolute top-0 left-0 w-full ${endOfGroup ? "pb-2" : "pb-0.5"}`}
                          style={dynamicStyle({ transform: `translateY(${virtualRow.start}px)` })}
                        >
                          <div
                            className={`group flex gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}
                            onClick={() =>
                              setRevealedMessageId((prev) => (prev === msg.id ? null : msg.id))
                            }
                          >
                            {endOfGroup ? (
                              <Avatar
                                size={26}
                                src={msg.sender.avatar ?? undefined}
                                className={`flex-shrink-0 !text-[10px] !font-semibold !text-white ${
                                  mine ? "!bg-[var(--purple)]" : "!bg-[var(--accent)]"
                                }`}
                              >
                                {msg.sender.name.trim().charAt(0).toUpperCase() || "?"}
                              </Avatar>
                            ) : (
                              <div className="w-[26px] flex-shrink-0" />
                            )}
                            <div
                              className={`max-w-[70%] flex flex-col ${mine ? "items-end" : "items-start"}`}
                            >
                              {startOfGroup && (
                                <div
                                  className={`flex items-baseline gap-1.5 mb-0.5 ${
                                    mine ? "flex-row-reverse" : "flex-row"
                                  }`}
                                >
                                  {!mine && (
                                    <span className="text-[11px] text-[var(--text)] font-semibold">
                                      {msg.sender.name}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-[var(--text-faint)]">
                                    {dayjs(msg.createdAt).format("HH:mm")}
                                  </span>
                                </div>
                              )}
                              <div
                                className={`px-3 py-2 rounded-[13px] text-xs leading-[1.4] ${
                                  mine
                                    ? "bg-[var(--accent)] text-white"
                                    : "bg-[var(--hover)] text-[var(--text)]"
                                }`}
                              >
                                {msg.content && <MessageContent html={msg.content} />}
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="mt-1.5 flex flex-col gap-1.5">
                                    {msg.attachments.map((att, i) =>
                                      att.type === "IMAGE" ? (
                                        <img
                                          key={i}
                                          src={att.url ?? undefined}
                                          alt="attachment"
                                          loading="lazy"
                                          className="max-w-[220px] max-h-[220px] object-cover"
                                        />
                                      ) : (
                                        <LazyVideoAttachment key={i} attachment={att} />
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                              {msg.reactions.length > 0 && (
                                <div
                                  className={`flex flex-wrap gap-1 mt-1 ${
                                    mine ? "flex-row-reverse" : "flex-row"
                                  }`}
                                >
                                  {msg.reactions.map((r) => {
                                    const mineReacted = !!mySub && r.subs.includes(mySub);
                                    return (
                                      <button
                                        key={r.emoji}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleReaction({ messageId: msg.id, emoji: r.emoji });
                                        }}
                                        className={`text-[11px] px-1.5 py-0.5 rounded-full border cursor-pointer ${
                                          mineReacted
                                            ? "border-[var(--accent)] text-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_15%,transparent)]"
                                            : "border-[var(--border)] text-[var(--text-dim)]"
                                        }`}
                                      >
                                        {r.emoji} {r.subs.length}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                              <div
                                className={`flex items-center gap-2 overflow-hidden transition-all ${
                                  mine ? "flex-row-reverse" : "flex-row"
                                } ${
                                  isRevealed
                                    ? "h-4 opacity-100 mt-1"
                                    : "h-0 opacity-0 mt-0 group-hover:h-4 group-hover:opacity-100 group-hover:mt-1"
                                }`}
                              >
                                <Popover
                                  trigger="click"
                                  content={
                                    <div className="flex gap-2">
                                      {REACTION_EMOJIS.map((emoji) => (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleReaction({ messageId: msg.id, emoji });
                                          }}
                                          className="text-base hover:scale-110 transition-transform cursor-pointer"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  }
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => e.stopPropagation()}
                                    title="React"
                                    className="text-[var(--text-faint)] hover:text-[var(--text-dim)] cursor-pointer"
                                  >
                                    <SmileOutlined className="text-[11px]" />
                                  </button>
                                </Popover>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setThreadParentId(msg.id);
                                  }}
                                  title="Reply in thread"
                                  className="text-[var(--text-faint)] hover:text-[var(--text-dim)] cursor-pointer"
                                >
                                  <MessageOutlined className="text-[11px]" />
                                </button>
                              </div>
                              {msg.replyCount > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setThreadParentId(msg.id);
                                  }}
                                  className="text-[10px] mt-1 text-[var(--accent)] hover:underline cursor-pointer"
                                >
                                  💬 {msg.replyCount} {msg.replyCount === 1 ? "reply" : "replies"}
                                </button>
                              )}
                              {receipt && (
                                <div
                                  className={`text-[9px] overflow-hidden transition-all ${
                                    receiptRevealed
                                      ? "h-3 opacity-100 mt-0.5"
                                      : "h-0 opacity-0 mt-0 group-hover:h-3 group-hover:opacity-100 group-hover:mt-0.5"
                                  } ${receipt.read ? "text-[var(--accent)]" : "text-[var(--text-faint)]"}`}
                                >
                                  {receipt.label}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <MessageComposerAttachments
              items={pendingAttachments}
              onRemove={removePendingAttachment}
            />

            {typingLabel && (
              <div className="px-4 pt-1">
                <span className="text-[10.5px] text-[var(--text-faint)] italic">
                  {typingLabel}
                </span>
              </div>
            )}

            <div className="px-4 py-3 border-t border-[var(--border)] flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                hidden
                onChange={(e) => {
                  handleAttachFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <RichTextEditor
                key={`composer-${selectedId}-${composerResetKey}`}
                content={draft}
                onChange={(html) => {
                  setDraft(html);
                  if (!isHtmlEmpty(html)) sendTyping();
                }}
                onEnterSubmit={handleSend}
                showAttachments={false}
                showToolbar={richOpen}
                placeholder="Type a message..."
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    type="text"
                    icon={<PaperClipOutlined />}
                    onClick={() => fileInputRef.current?.click()}
                    className="!text-[var(--text-faint)]"
                  />
                  <Button
                    type={richOpen ? "primary" : "text"}
                    onClick={() => setRichOpen((o) => !o)}
                    title="Formatting"
                    className={richOpen ? "" : "!text-[var(--text-faint)]"}
                  >
                    Aa
                  </Button>
                </div>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={sending}
                  disabled={!canSend}
                >
                  Send
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Thread panel */}
      {threadParentId && (
        <div className="w-80 flex-shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)]">
            <span className="text-[14px] font-bold text-[var(--text)]">Thread</span>
            <button
              type="button"
              onClick={() => setThreadParentId(null)}
              className="text-[var(--text-faint)] hover:text-[var(--text-dim)] cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {threadParentMessage && (
              <div className="pb-3 border-b border-[var(--border)]">
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-[11px] text-[var(--text)] font-semibold">
                    {threadParentMessage.sender.name}
                  </span>
                  <span className="text-[10px] text-[var(--text-faint)]">
                    {dayjs(threadParentMessage.createdAt).format("HH:mm")}
                  </span>
                </div>
                {threadParentMessage.content && (
                  <MessageContent html={threadParentMessage.content} />
                )}
              </div>
            )}
            {loadingReplies ? (
              <div className="flex justify-center py-4">
                <Spin size="small" />
              </div>
            ) : (
              threadReplies.map((reply) => (
                <div key={reply.id} className="flex gap-2">
                  <Avatar
                    size={22}
                    src={reply.sender.avatar ?? undefined}
                    className="flex-shrink-0 !text-[9px] !font-semibold !text-white !bg-[var(--accent)]"
                  >
                    {reply.sender.name.trim().charAt(0).toUpperCase() || "?"}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[11px] text-[var(--text)] font-semibold">
                        {reply.sender.name}
                      </span>
                      <span className="text-[10px] text-[var(--text-faint)]">
                        {dayjs(reply.createdAt).format("HH:mm")}
                      </span>
                    </div>
                    {reply.content && <MessageContent html={reply.content} />}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-3 border-t border-[var(--border)] flex flex-col gap-2">
            <RichTextEditor
              key={`reply-${threadParentId}-${replyResetKey}`}
              content={threadDraft}
              onChange={(html) => {
                setThreadDraft(html);
                if (!isHtmlEmpty(html)) sendTyping();
              }}
              onEnterSubmit={handleSendReply}
              showAttachments={false}
              showToolbar={replyRichOpen}
              placeholder="Reply in thread..."
            />
            <div className="flex items-center justify-between">
              <Button
                type={replyRichOpen ? "primary" : "text"}
                onClick={() => setReplyRichOpen((o) => !o)}
                title="Formatting"
                className={replyRichOpen ? "" : "!text-[var(--text-faint)]"}
              >
                Aa
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendReply}
                loading={sending}
                disabled={isHtmlEmpty(threadDraft)}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New conversation / channel modal */}
      <Modal
        title="New"
        open={newOpen}
        onCancel={closeNewModal}
        destroyOnHidden
        footer={
          newTab === "browse"
            ? [
                <Button key="close" onClick={closeNewModal}>
                  Close
                </Button>,
              ]
            : [
                <Button key="cancel" onClick={closeNewModal}>
                  Cancel
                </Button>,
                <Button
                  key="ok"
                  type="primary"
                  loading={creating}
                  disabled={newTab === "dm" ? !picked : !channelName.trim()}
                  onClick={newTab === "dm" ? handleCreateDm : handleCreateChannel}
                >
                  {newTab === "dm" ? "Create" : "Create Channel"}
                </Button>,
              ]
        }
      >
        <Tabs
          activeKey={newTab}
          onChange={(key) => setNewTab(key as typeof newTab)}
          items={[
            {
              key: "dm",
              label: "Direct Message",
              children: (
                <AutoComplete
                  className="w-full"
                  value={search}
                  options={options.map((u) => ({ value: u.sub, label: `${u.name} (${u.email})` }))}
                  onSearch={handleSearch}
                  onSelect={(value) => {
                    const user = optionsRef.current.find((u) => u.sub === value);
                    if (user) {
                      setPicked(user);
                      setSearch(`${user.name} (${user.email})`);
                    }
                  }}
                  placeholder="Search a colleague..."
                />
              ),
            },
            {
              key: "channel",
              label: "New Channel",
              children: (
                <div className="flex flex-col gap-4">
                  <Input
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="Channel name"
                  />
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex-1 text-xs text-[var(--fg-faint)]">
                      Private (invite-only) — turn off to make it public and joinable by anyone
                    </span>
                    <Switch
                      checked={channelPrivate}
                      onChange={setChannelPrivate}
                      className="flex-shrink-0 mt-0.5"
                    />
                  </div>
                </div>
              ),
            },
            {
              key: "browse",
              label: "Browse Channels",
              children: (
                <div className="flex flex-col gap-2">
                  <Input
                    value={channelSearch}
                    onChange={(e) => setChannelSearch(e.target.value)}
                    placeholder="Search public channels..."
                  />
                  {loadingChannels ? (
                    <div className="flex justify-center py-6">
                      <Spin />
                    </div>
                  ) : publicChannels.length === 0 ? (
                    <p className="text-xs text-[var(--fg-faint)] py-2">
                      No public channels to join
                    </p>
                  ) : (
                    publicChannels.map((channel) => (
                      <div key={channel.id} className="flex items-center justify-between py-1.5">
                        <span className="text-sm">
                          # {channel.name}{" "}
                          <span className="text-xs text-[var(--fg-faint)]">
                            ({channel.memberCount})
                          </span>
                        </span>
                        <Button
                          size="small"
                          loading={joining}
                          onClick={() => handleJoinChannel(channel.id)}
                        >
                          Join
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              ),
            },
          ]}
        />
      </Modal>

      {/* Invite / manage members modal — GROUP conversations, owner only */}
      <Modal
        title={selected ? `Members — ${conversationLabel(selected, mySub, nameBySub)}` : "Members"}
        open={inviteOpen}
        onCancel={closeInviteModal}
        destroyOnHidden
        footer={[
          <Button key="close" onClick={closeInviteModal}>
            Close
          </Button>,
        ]}
      >
        <div className="flex flex-col gap-4">
          <AutoComplete
            className="w-full"
            value={inviteSearch}
            options={inviteOptions.map((u) => ({ value: u.sub, label: `${u.name} (${u.email})` }))}
            onSearch={handleInviteSearch}
            onSelect={handleInviteSelect}
            placeholder="Search a colleague to invite..."
          />
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            <span className="text-xs text-[var(--fg-faint)] tracking-wide">
              MEMBERS ({selected?.participantSubs.length ?? 0})
            </span>
            {(selected?.participantSubs ?? []).map((sub) => (
              <div key={sub} className="flex items-center justify-between py-1">
                <span className="text-sm">{nameBySub[sub] ?? sub}</span>
                {sub !== mySub && (
                  <Button size="small" danger type="text" onClick={() => handleRemoveMember(sub)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
