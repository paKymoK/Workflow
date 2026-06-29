import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { wsBaseUrl } from "@takypok/shared";
import dayjs from "dayjs";
import type { AuditAction } from "../../api/types";
import { fetchRecentAuditLog } from "../../api/ticketApi";

interface LiveEvent {
  id: string;
  ticketId: number;
  action: AuditAction;
  actorName: string | null;
  ts: string;
}

const MAX_EVENTS = 20;

const ACTION_LABEL: Record<AuditAction, string> = {
  TICKET_CREATED:   "Ticket created",
  STATUS_CHANGED:   "Status changed",
  ASSIGNEE_CHANGED: "Assignee changed",
  SLA_PAUSED:       "SLA paused",
  SLA_RESUMED:      "SLA resumed",
};

const DOT_COLOR: Record<AuditAction, string> = {
  TICKET_CREATED:   "bg-[var(--acc-1)]",
  STATUS_CHANGED:   "bg-[var(--acc-2)]",
  ASSIGNEE_CHANGED: "bg-[var(--acc-3)]",
  SLA_PAUSED:       "bg-orange-400",
  SLA_RESUMED:      "bg-emerald-400",
};

export default function LiveActivityFeed() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const connectedRef = useRef(false);

  useEffect(() => {
    fetchRecentAuditLog().then((logs) => {
      const initial = logs.map((log) => ({
        id:        `init-${log.id}`,
        ticketId:  log.ticketId,
        action:    log.action,
        actorName: log.actor?.name ?? null,
        ts:        dayjs(log.createdAt).format("HH:mm:ss"),
      }));
      setEvents(initial);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (connectedRef.current) return;
    connectedRef.current = true;

    const token = sessionStorage.getItem("access_token");
    const ws = new WebSocket(`${wsBaseUrl}/workflow-service/web-socket/sla`);
    ws.onopen    = () => { ws.send(token ?? ""); };
    ws.onmessage = (e) => {
      console.debug("[LiveActivityFeed] WS message:", e.data);
      try {
        const parsed = JSON.parse(e.data);
        if (!parsed.action || !parsed.ticketId) {
          console.debug("[LiveActivityFeed] dropped — missing action/ticketId:", parsed);
          return;
        }
        const evt: LiveEvent = {
          id:        `${parsed.ticketId}-${Date.now()}`,
          ticketId:  parsed.ticketId,
          action:    parsed.action as AuditAction,
          actorName: parsed.actorName ?? null,
          ts:        dayjs().format("HH:mm:ss"),
        };
        setEvents((prev) => [evt, ...prev].slice(0, MAX_EVENTS));
      } catch {
        console.debug("[LiveActivityFeed] not JSON (SLA calc event), skipping:", e.data);
      }
    };

    return () => {
      connectedRef.current = false;
      ws.close();
    };
  }, []);

  return (
    <div className="h-full border border-[var(--line)] bg-[var(--bg-1)] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)]">
        <span className="font-bebas text-sm tracking-[.15em] text-[var(--fg)]">LIVE ACTIVITY</span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[var(--acc-3)] [box-shadow:0_0_6px_var(--acc-3)] [animation:blink_2s_infinite]"
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
              className={`w-full flex items-center justify-between px-4 py-2.5 border-b border-[var(--line)] hover:bg-[var(--bg-2)] text-left cursor-crosshair transition-colors fade-up [animation-delay:${i * 0.02}s]`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-1 h-1 rounded-full flex-shrink-0 ${DOT_COLOR[evt.action]}`} />
                <div className="min-w-0">
                  <span className="block font-mono-tech text-[11px] text-[var(--fg)] truncate">
                    #{evt.ticketId} — {ACTION_LABEL[evt.action]}
                  </span>
                  {evt.actorName && (
                    <span className="block font-mono-tech text-[9px] text-[var(--fg-faint)] truncate">
                      by {evt.actorName}
                    </span>
                  )}
                </div>
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
