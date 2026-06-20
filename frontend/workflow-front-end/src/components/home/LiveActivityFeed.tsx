import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { wsBaseUrl } from "@takypok/shared";
import dayjs from "dayjs";

interface LiveEvent {
  id: string;
  ticketId: number;
  label: string;
  ts: string;
}

const MAX_EVENTS = 20;

export default function LiveActivityFeed() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (connectedRef.current) return;
    connectedRef.current = true;

    const token = sessionStorage.getItem("access_token");
    const ws = new WebSocket(`${wsBaseUrl}/workflow-service/web-socket/sla`);
    ws.onopen    = () => { ws.send(token ?? ""); };
    ws.onmessage = (e) => {
      const raw = e.data;
      const ticketId = Number(raw);
      if (!ticketId || isNaN(ticketId)) return;
      const evt: LiveEvent = {
        id:       `${ticketId}-${Date.now()}`,
        ticketId,
        label:    `Ticket #${ticketId} SLA updated`,
        ts:       dayjs().format("HH:mm:ss"),
      };
      setEvents((prev) => [evt, ...prev].slice(0, MAX_EVENTS));
    };

    return () => {
      connectedRef.current = false;
      ws.close();
    };
  }, []);

  return (
    <div className="h-full border border-[var(--line)] bg-[var(--bg-1)] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)]">
        <span className="font-bebas text-sm tracking-[.15em] text-[var(--fg)]">LIVE ACTIVITY</span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[var(--acc-3)]"
            style={{ boxShadow: "0 0 6px var(--acc-3)", animation: "blink 2s infinite" }}
          />
          <span className="font-mono-tech text-[9px] text-[var(--acc-3)]">LIVE</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full py-8">
            <p className="font-mono-tech text-[10px] text-[var(--fg-faint)]">Waiting for events...</p>
          </div>
        ) : (
          events.map((evt, i) => (
            <button
              key={evt.id}
              onClick={() => navigate(`/dashboard/${evt.ticketId}`)}
              className="w-full flex items-center justify-between px-4 py-2.5 border-b border-[var(--line)] hover:bg-[var(--bg-2)] text-left cursor-crosshair transition-colors fade-up"
              style={{ animationDelay: `${i * 0.02}s` }}
            >
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[var(--acc-1)] flex-shrink-0" />
                <span className="font-mono-tech text-[11px] text-[var(--fg)]">{evt.label}</span>
              </div>
              <span className="font-mono-tech text-[9px] text-[var(--fg-faint)] flex-shrink-0 ml-2">
                {evt.ts}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
