import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input } from "antd";
import {
  SendOutlined,
  PlusOutlined,
  DeleteOutlined,
  RobotOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { AssistantImageRef, AssistantTurn } from "../api/chatApi";
import {
  useAskInSession,
  useAssistantApplications,
  useAssistantMessages,
  useAssistantSessions,
  useCreateAssistantSession,
  useDeleteAssistantSession,
} from "../hooks/useChat";

interface Message {
  role: "user" | "ai";
  text: string;
  images?: AssistantImageRef[] | null;
}

// Shared with ChatWidget.tsx — picking up (or continuing) the same active session lets the
// floating widget's "expand to full screen" button hand off seamlessly.
const ACTIVE_SESSION_KEY = "assistant.activeSessionId";

function greetingFor(application: string | null): Message {
  return {
    role: "ai",
    text: application
      ? `Hello! Ask me anything about ${application}.`
      : "Hello! Ask me anything.",
  };
}

function turnToMessage(turn: AssistantTurn): Message {
  return { role: turn.role === "USER" ? "user" : "ai", text: turn.content, images: turn.images };
}

const dotDelays = [
  "[animation-delay:0s]",
  "[animation-delay:0.2s]",
  "[animation-delay:0.4s]",
] as const;

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([greetingFor(null)]);
  const [input, setInput] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_SESSION_KEY),
  );
  const [activeApplication, setActiveApplication] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sessionsQuery = useAssistantSessions(true);
  const applicationsQuery = useAssistantApplications(true);
  const messagesQuery = useAssistantMessages(activeSessionId);
  const createSession = useCreateAssistantSession();
  const deleteSession = useDeleteAssistantSession();
  const { mutate: ask, isPending: loading } = useAskInSession();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // See ChatWidget.tsx for why these are guarded render-time state adjustments rather than
  // useEffect — https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  /* eslint-disable react-hooks/refs -- intentional render-time ref reconciliation per the doc above */

  const prevMessagesErrorRef = useRef(false);
  if (messagesQuery.isError !== prevMessagesErrorRef.current) {
    prevMessagesErrorRef.current = messagesQuery.isError;
    if (messagesQuery.isError && activeSessionId) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      setActiveSessionId(null);
      setActiveApplication(null);
    }
  }

  const prevMessagesDataRef = useRef<AssistantTurn[] | undefined>(undefined);
  if (messagesQuery.data !== prevMessagesDataRef.current) {
    prevMessagesDataRef.current = messagesQuery.data;
    if (messagesQuery.data) {
      setMessages(
        messagesQuery.data.length > 0
          ? messagesQuery.data.map(turnToMessage)
          : [greetingFor(activeApplication)],
      );
    }
  }
  /* eslint-enable react-hooks/refs */

  function selectSession(id: string, application: string) {
    setActiveSessionId(id);
    setActiveApplication(application);
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
  }

  function startNewChat() {
    setActiveSessionId(null);
    setActiveApplication(null);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }

  function chooseApplication(application: string) {
    createSession.mutate(application, {
      onSuccess: (session) => selectSession(session.id, session.application),
    });
  }

  function removeSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    deleteSession.mutate(id, {
      onSuccess: () => {
        if (id === activeSessionId) {
          localStorage.removeItem(ACTIVE_SESSION_KEY);
          setActiveSessionId(null);
          setActiveApplication(null);
        }
      },
    });
  }

  function send() {
    const question = input.trim();
    if (!question || loading || !activeSessionId) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    ask(
      { sessionId: activeSessionId, question },
      {
        onSuccess: (result) =>
          setMessages((prev) => [
            ...prev,
            { role: "ai", text: result.answer, images: result.images },
          ]),
        onError: () =>
          setMessages((prev) => [
            ...prev,
            { role: "ai", text: "Error: could not reach the AI service." },
          ]),
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="h-full flex gap-3.5">
      {/* Session list */}
      <div className="w-72 flex-shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)]">
          <span className="text-[14px] font-bold text-[var(--text)]">AI Assistant</span>
          <div className="flex items-center gap-1">
            <Link to="/assistant/code-review" title="Code Review">
              <Button type="text" size="small" icon={<CodeOutlined />} className="!text-[var(--accent)]" />
            </Link>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={startNewChat}
              title="New chat"
              className="!text-[var(--accent)]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {sessionsQuery.data?.length === 0 && (
            <div className="text-xs text-[var(--text-faint)] text-center py-6">No chats yet</div>
          )}
          {sessionsQuery.data?.map((s) => (
            <div
              key={s.id}
              onClick={() => selectSession(s.id, s.application)}
              className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg cursor-pointer ${
                s.id === activeSessionId ? "bg-[var(--hover)]" : "hover:bg-[var(--hover)]"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="truncate text-xs font-medium text-[var(--text)]">{s.title}</div>
                <div className="text-[10.5px] text-[var(--text-faint)]">
                  {s.application} · {dayjs(s.updatedAt).format("MMM D, HH:mm")}
                </div>
              </div>
              <button
                onClick={(e) => removeSession(s.id, e)}
                title="Delete chat"
                className="opacity-0 group-hover:opacity-100 text-[var(--text-faint)] hover:text-red-500 transition-opacity"
              >
                <DeleteOutlined />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden">
        {!activeSessionId ? (
          /* ── Application picker — required before a session can be created ──── */
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center gap-4">
            <RobotOutlined className="text-3xl text-[var(--accent)]" />
            <div className="text-sm font-medium text-[var(--text)]">
              Choose an application to ask about
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {applicationsQuery.isLoading && (
                <div className="text-xs text-[var(--text-faint)]">Loading…</div>
              )}
              {applicationsQuery.data?.length === 0 && (
                <div className="text-xs text-[var(--text-faint)]">No applications available</div>
              )}
              {applicationsQuery.data?.map((app) => (
                <button
                  key={app}
                  onClick={() => chooseApplication(app)}
                  disabled={createSession.isPending}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--text)] bg-[var(--hover)] hover:bg-[var(--accent)] hover:text-white transition-colors disabled:opacity-50"
                >
                  {app}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[65%] px-4 py-2.5 rounded-2xl text-[13px] leading-[1.6] whitespace-pre-wrap break-words ${
                      msg.role === "user"
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--hover)] text-[var(--text)]"
                    }`}
                  >
                    {msg.text}
                  </div>
                  {!!msg.images?.length && (
                    <div className="max-w-[65%] flex flex-col gap-1.5">
                      {msg.images.map((img) => (
                        <img
                          key={img.url}
                          src={img.url}
                          alt={img.alt}
                          loading="lazy"
                          className="max-w-full max-h-64 rounded-2xl border border-[var(--border)] object-contain"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="px-[18px] py-2.5 rounded-2xl bg-[var(--hover)] flex gap-[5px] items-center">
                    {[0, 1, 2].map((n) => (
                      <span
                        key={n}
                        className={`w-[6px] h-[6px] rounded-full bg-[var(--text-faint)] inline-block [animation:chatDot_1.2s_ease-in-out_infinite] ${dotDelays[n]}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 px-4 py-3 border-t border-[var(--border)]">
              <Input.TextArea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                autoSize={{ minRows: 1, maxRows: 6 }}
                disabled={loading}
                className="!flex-1 !text-[13px] !resize-none"
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={send}
                loading={loading}
                disabled={!input.trim()}
                className="self-end"
              />
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes chatDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
