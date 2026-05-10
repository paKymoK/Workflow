import { useRef, useEffect, useState, useCallback } from "react";
import { Button, Input } from "antd";
import { SendOutlined, CloseOutlined, RobotOutlined } from "@ant-design/icons";
import { useAskQuestion } from "../hooks/useChat";

interface Message {
  role: "user" | "ai";
  text: string;
}

const BUTTON_SIZE = 48;
const PANEL_WIDTH  = 360;
const PANEL_HEIGHT = 480;
const PANEL_GAP    = 8;

const dotDelays = [
  "[animation-delay:0s]",
  "[animation-delay:0.2s]",
  "[animation-delay:0.4s]",
] as const;

export default function ChatWidget() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hello! Ask me anything about your workflow." },
  ]);
  const [input,    setInput]    = useState("");
  const bottomRef               = useRef<HTMLDivElement>(null);

  // null = default CSS bottom-right; after first drag, top-left of button in viewport px
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const dragging   = useRef(false);
  const hasDragged = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const { mutate: ask, isPending: loading } = useAskQuestion();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function send() {
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    ask(question, {
      onSuccess: (answer) =>
        setMessages((prev) => [...prev, { role: "ai", text: answer }]),
      onError: () =>
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: "Error: could not reach the AI service." },
        ]),
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const clamp = useCallback((x: number, y: number) => ({
    x: Math.max(0, Math.min(x, window.innerWidth  - BUTTON_SIZE)),
    y: Math.max(0, Math.min(y, window.innerHeight - BUTTON_SIZE)),
  }), []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current   = true;
      hasDragged.current = false;

      const startX = pos ? pos.x : window.innerWidth  - BUTTON_SIZE - 24;
      const startY = pos ? pos.y : window.innerHeight - BUTTON_SIZE - 24;

      dragOffset.current = {
        x: e.clientX - startX,
        y: e.clientY - startY,
      };

      const onMove = (me: MouseEvent) => {
        if (!dragging.current) return;
        hasDragged.current = true;
        setPos(clamp(me.clientX - dragOffset.current.x, me.clientY - dragOffset.current.y));
      };

      const onUp = () => {
        dragging.current = false;
        if (!hasDragged.current) setOpen((v) => !v);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup",   onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup",   onUp);
    },
    [pos, clamp],
  );

  const buttonStyle: React.CSSProperties = pos
    ? { position: "fixed", top: pos.y, left: pos.x }
    : { position: "fixed", bottom: 24, right: 24 };

  const panelStyle: React.CSSProperties = (() => {
    if (pos === null) {
      return { position: "fixed", bottom: 80, right: 24, width: PANEL_WIDTH, height: PANEL_HEIGHT };
    }
    // Align right edge of panel to right edge of button, open above
    let px = pos.x + BUTTON_SIZE - PANEL_WIDTH;
    let py = pos.y - PANEL_HEIGHT - PANEL_GAP;

    px = Math.max(0, Math.min(px, window.innerWidth - PANEL_WIDTH));
    // If panel would go above viewport, flip below the button
    if (py < 0) py = pos.y + BUTTON_SIZE + PANEL_GAP;

    return { position: "fixed", top: py, left: px, width: PANEL_WIDTH, height: PANEL_HEIGHT };
  })();

  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────── */}
      {open && (
        <div
          style={panelStyle}
          className="z-[1000] flex flex-col bg-[var(--dark)] border border-[var(--neon-yellow)] shadow-[0_0_24px_rgba(0,207,255,0.2)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--darker)] shrink-0">
            <div className="flex items-center gap-2">
              <RobotOutlined className="text-[var(--neon-cyan)] text-sm" />
              <span className="font-bebas text-[var(--neon-yellow)] text-[15px] tracking-[0.2em]">
                AI ASSISTANT
              </span>
            </div>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => setOpen(false)}
              className="!text-[var(--text-muted)]"
            />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-[10px]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`font-mono-tech max-w-[80%] px-3 py-2 text-xs leading-[1.6] whitespace-pre-wrap break-words ${
                    msg.role === "user"
                      ? "bg-[rgba(0,207,255,0.12)] border border-[var(--neon-yellow)] text-[var(--white)]"
                      : "bg-[rgba(0,245,196,0.08)] border border-[rgba(0,245,196,0.3)] text-[var(--neon-cyan)]"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="px-[14px] py-2 border border-[rgba(0,245,196,0.3)] bg-[rgba(0,245,196,0.08)] flex gap-[5px] items-center">
                  {[0, 1, 2].map((n) => (
                    <span
                      key={n}
                      className={`w-[6px] h-[6px] rounded-full bg-[var(--neon-cyan)] inline-block [animation:chatDot_1.2s_ease-in-out_infinite] ${dotDelays[n]}`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 px-3 py-[10px] border-t border-[var(--border-subtle)] bg-[var(--darker)] shrink-0">
            <Input.TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              autoSize={{ minRows: 1, maxRows: 3 }}
              disabled={loading}
              className="font-mono-tech !flex-1 !text-xs !resize-none !bg-[var(--black)] !border-[var(--border-subtle)] !text-[var(--white)]"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={send}
              loading={loading}
              disabled={!input.trim()}
              className="!bg-[var(--neon-yellow)] !border-[var(--neon-yellow)] !text-[var(--dark)] self-end"
            />
          </div>
        </div>
      )}

      {/* ── Toggle / drag handle ────────────────────────────────── */}
      <button
        onMouseDown={onMouseDown}
        style={buttonStyle}
        className={`z-[1001] w-12 h-12 border border-[var(--neon-yellow)] cursor-grab active:cursor-grabbing flex items-center justify-center text-xl shadow-[0_0_16px_rgba(0,207,255,0.3)] transition-colors duration-200 ease-in-out select-none ${
          open
            ? "bg-[var(--neon-yellow)] text-[var(--dark)]"
            : "bg-[var(--dark)] text-[var(--neon-yellow)]"
        }`}
        title="AI Assistant — drag to move"
      >
        <RobotOutlined />
      </button>

      <style>{`
        @keyframes chatDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </>
  );
}
