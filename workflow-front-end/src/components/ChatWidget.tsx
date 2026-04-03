import { useState, useRef, useEffect } from "react";
import { Button, Input } from "antd";
import { SendOutlined, CloseOutlined, RobotOutlined } from "@ant-design/icons";
import { askQuestion } from "../api/chatApi";

interface Message {
  role: "user" | "ai";
  text: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hello! Ask me anything about your workflow." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);

    try {
      const answer = await askQuestion(question);
      setMessages((prev) => [...prev, { role: "ai", text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Error: could not reach the AI service." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* ── Chat panel ────────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            right: "24px",
            width: "360px",
            height: "480px",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            background: "var(--dark)",
            border: "1px solid var(--neon-yellow)",
            boxShadow: "0 0 24px rgba(0,207,255,0.2)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--darker)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <RobotOutlined style={{ color: "var(--neon-cyan)", fontSize: 14 }} />
              <span
                className="font-bebas"
                style={{
                  color: "var(--neon-yellow)",
                  fontSize: 15,
                  letterSpacing: "0.2em",
                }}
              >
                AI ASSISTANT
              </span>
            </div>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => setOpen(false)}
              style={{ color: "var(--text-muted)" }}
            />
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  className="font-mono-tech"
                  style={{
                    maxWidth: "80%",
                    padding: "8px 12px",
                    fontSize: 12,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    ...(msg.role === "user"
                      ? {
                          background: "rgba(0,207,255,0.12)",
                          border: "1px solid var(--neon-yellow)",
                          color: "var(--white)",
                        }
                      : {
                          background: "rgba(0,245,196,0.08)",
                          border: "1px solid rgba(0,245,196,0.3)",
                          color: "var(--neon-cyan)",
                        }),
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "8px 14px",
                    border: "1px solid rgba(0,245,196,0.3)",
                    background: "rgba(0,245,196,0.08)",
                    display: "flex",
                    gap: 5,
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((n) => (
                    <span
                      key={n}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--neon-cyan)",
                        display: "inline-block",
                        animation: `chatDot 1.2s ${n * 0.2}s ease-in-out infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "10px 12px",
              borderTop: "1px solid var(--border-subtle)",
              background: "var(--darker)",
              flexShrink: 0,
            }}
          >
            <Input.TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              autoSize={{ minRows: 1, maxRows: 3 }}
              disabled={loading}
              className="font-mono-tech"
              style={{
                flex: 1,
                fontSize: 12,
                resize: "none",
                background: "var(--black)",
                border: "1px solid var(--border-subtle)",
                color: "var(--white)",
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={send}
              loading={loading}
              disabled={!input.trim()}
              style={{
                background: "var(--neon-yellow)",
                borderColor: "var(--neon-yellow)",
                color: "var(--dark)",
                alignSelf: "flex-end",
              }}
            />
          </div>
        </div>
      )}

      {/* ── Toggle button ─────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 1001,
          width: 48,
          height: 48,
          border: "1px solid var(--neon-yellow)",
          background: open ? "var(--neon-yellow)" : "var(--dark)",
          color: open ? "var(--dark)" : "var(--neon-yellow)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          boxShadow: "0 0 16px rgba(0,207,255,0.3)",
          transition: "all 0.2s ease",
        }}
        title="AI Assistant"
      >
        <RobotOutlined />
      </button>

      {/* Loading dot keyframes */}
      <style>{`
        @keyframes chatDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </>
  );
}
