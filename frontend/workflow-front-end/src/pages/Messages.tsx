import { useEffect, useRef, useState } from "react";
import { Avatar, AutoComplete, Badge, Button, Empty, Input, message as antMessage, Modal, Spin } from "antd";
import {
  PaperClipOutlined,
  PlusOutlined,
  SendOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuth } from "@takypok/shared";
import { fetchUsers, getFileUrl, uploadFile, uploadVideo, type UserSummary } from "../api/ticketApi";
import type { ConversationSummary, MessageAttachment, MessageType } from "../api/types";
import { resizeImageForUpload } from "../utils/imageResize";
import { waitForVideoReady } from "../utils/videoJob";
import LazyVideoAttachment from "../components/LazyVideoAttachment";
import MessageComposerAttachments, {
  type PendingAttachment,
} from "../components/MessageComposerAttachments";
import {
  useConversationMessages,
  useConversations,
  useCreateConversation,
  useMarkConversationRead,
  useSendMessage,
} from "../hooks/useMessages";

function conversationLabel(conversation: ConversationSummary, mySub?: string) {
  if (conversation.type === "GROUP") return conversation.name ?? "Group";
  const other = conversation.participantSubs.find((sub) => sub !== mySub);
  return other ?? "Direct message";
}

function deriveMessageType(hasContent: boolean, attachments: MessageAttachment[]): MessageType {
  if (attachments.length === 0) return "TEXT";
  const hasImage = attachments.some((a) => a.type === "IMAGE");
  const hasVideo = attachments.some((a) => a.type === "VIDEO");
  if (hasContent || (hasImage && hasVideo)) return "MIXED";
  return hasImage ? "IMAGE" : "VIDEO";
}

export default function Messages() {
  const { user } = useAuth();
  const mySub = user?.sub as string | undefined;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newOpen, setNewOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<UserSummary[]>([]);
  const [picked, setPicked] = useState<UserSummary | null>(null);
  const optionsRef = useRef<UserSummary[]>([]);

  const { data: conversations = [], isLoading } = useConversations();
  const { mutate: createConversation, isPending: creating } = useCreateConversation();
  const { mutate: markRead } = useMarkConversationRead();
  const { data: messages = [], isLoading: loadingMessages } =
    useConversationMessages(selectedId);
  const { mutate: send, isPending: sending } = useSendMessage(selectedId ?? "");

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  function handleCreate() {
    if (!picked) return;
    createConversation(
      { type: "DIRECT", participantSubs: [picked.sub] },
      {
        onSuccess: (conversation) => {
          setNewOpen(false);
          setPicked(null);
          setSearch("");
          setOptions([]);
          setSelectedId(conversation.id);
        },
      },
    );
  }

  const hasPendingUploads = pendingAttachments.some(
    (p) => p.status === "uploading" || p.status === "processing",
  );
  const readyAttachments = pendingAttachments
    .filter((p) => p.status === "ready" && p.attachment)
    .map((p) => p.attachment as MessageAttachment);
  const canSend =
    !hasPendingUploads && (draft.trim().length > 0 || readyAttachments.length > 0);

  function handleSend() {
    if (!selectedId || !canSend) return;
    const content = draft.trim();
    setDraft("");
    setPendingAttachments([]);
    send({
      content,
      messageType: deriveMessageType(content.length > 0, readyAttachments),
      attachments: readyAttachments.length > 0 ? readyAttachments : undefined,
    });
  }

  return (
    <div className="h-full flex gap-3">
      {/* Conversation list */}
      <div className="w-80 flex-shrink-0 border border-[var(--line)] bg-[var(--bg-1)] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)]">
          <span className="font-bebas text-sm tracking-[.15em] text-[var(--fg)]">MESSAGES</span>
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setNewOpen(true)}
            className="!text-[var(--acc-1)]"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spin />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full py-8">
              <p className="font-mono-tech text-[10px] text-[var(--fg-faint)]">
                No conversations yet
              </p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => openConversation(conversation.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 border-b border-[var(--line)] hover:bg-[var(--bg-2)] text-left cursor-crosshair transition-colors ${
                  conversation.id === selectedId ? "bg-[var(--bg-2)]" : ""
                }`}
              >
                <Avatar
                  icon={conversation.type === "GROUP" ? <TeamOutlined /> : <UserOutlined />}
                  className="!bg-[var(--acc-1)] !text-[var(--bg-0)] flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-tech text-[11px] text-[var(--fg)] truncate">
                      {conversationLabel(conversation, mySub)}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <Badge count={conversation.unreadCount} size="small" />
                    )}
                  </div>
                  <span className="block font-mono-tech text-[9px] text-[var(--fg-faint)] truncate">
                    {conversation.lastMessage?.content ?? "No messages yet"}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 border border-[var(--line)] bg-[var(--bg-1)] flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <Empty
              description={
                <span className="font-mono-tech text-[10px] text-[var(--fg-faint)]">
                  Select a conversation
                </span>
              }
            />
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-[var(--line)]">
              <span className="font-bebas text-sm tracking-[.15em] text-[var(--fg)]">
                {conversationLabel(selected, mySub)}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Spin />
                </div>
              ) : (
                [...messages].reverse().map((msg) => {
                  const mine = msg.sender.sub === mySub;
                  return (
                    <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] px-3 py-2 font-mono-tech text-xs ${
                          mine
                            ? "bg-[var(--acc-1)] text-[var(--bg-0)]"
                            : "bg-[var(--bg-2)] text-[var(--fg)]"
                        }`}
                      >
                        {!mine && (
                          <div className="text-[9px] opacity-70 mb-0.5">{msg.sender.name}</div>
                        )}
                        {msg.content && (
                          <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                        )}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-1.5 flex flex-col gap-1.5">
                            {msg.attachments.map((att, i) =>
                              att.type === "IMAGE" ? (
                                <img
                                  key={i}
                                  src={att.url ?? undefined}
                                  alt="attachment"
                                  loading="lazy"
                                  className="max-w-[220px] max-h-[220px] rounded object-cover"
                                />
                              ) : (
                                <LazyVideoAttachment key={i} attachment={att} />
                              ),
                            )}
                          </div>
                        )}
                        <div className="text-[8px] opacity-60 mt-1 text-right">
                          {dayjs(msg.createdAt).format("HH:mm")}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <MessageComposerAttachments
              items={pendingAttachments}
              onRemove={removePendingAttachment}
            />

            <div className="flex gap-2 px-4 py-3 border-t border-[var(--line)]">
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
              <Button
                type="text"
                icon={<PaperClipOutlined />}
                onClick={() => fileInputRef.current?.click()}
                className="!text-[var(--fg-faint)] self-end"
              />
              <Input.TextArea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                autoSize={{ minRows: 1, maxRows: 4 }}
                placeholder="Type a message..."
                className="font-mono-tech !flex-1 !text-xs !resize-none"
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={sending}
                disabled={!canSend}
                className="self-end"
              />
            </div>
          </>
        )}
      </div>

      {/* New conversation modal */}
      <Modal
        title="New message"
        open={newOpen}
        onCancel={() => { setNewOpen(false); setPicked(null); setSearch(""); setOptions([]); optionsRef.current = []; }}
        onOk={handleCreate}
        okButtonProps={{ disabled: !picked, loading: creating }}
        destroyOnClose
      >
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
      </Modal>
    </div>
  );
}
