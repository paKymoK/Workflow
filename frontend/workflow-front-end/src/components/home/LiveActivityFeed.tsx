import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { wsBaseUrl } from "@takypok/shared";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { AuditAction } from "../../api/types";
import { fetchRecentAuditLog } from "../../api/ticketApi";

dayjs.extend(relativeTime);

interface StatusRef { name: string; color: string; }
interface UserRef  { name: string; email?: string | null; }

type EventPayload =
  | { kind: "TICKET_CREATED"; summary?: string; project?: { code: string; name: string }; priority?: { name: string }; issueType?: { name: string } }
  | { kind: "STATUS_CHANGED";   from?: StatusRef; to?: StatusRef }
  | { kind: "ASSIGNEE_CHANGED"; from?: UserRef | null; to?: UserRef | null }
  | { kind: "SLA_PAUSED" }
  | { kind: "SLA_RESUMED" };

interface LiveEvent {
  id:         string;
  ticketId:   number;
  action:     AuditAction;
  actorName:  string | null;
  rawTs:      string;
  payload:    EventPayload | null;
}

const MAX_EVENTS = 20;

const ACTION_VERB: Record<AuditAction, string> = {
  TICKET_CREATED:   "created",
  STATUS_CHANGED:   "status changed",
  ASSIGNEE_CHANGED: "reassigned",
  SLA_PAUSED:       "paused",
  SLA_RESUMED:      "resumed",
};

const DOT_CLS: Record<AuditAction, string> = {
  TICKET_CREATED:   "bg-[var(--acc-1)]",
  STATUS_CHANGED:   "bg-[var(--acc-2)]",
  ASSIGNEE_CHANGED: "bg-[var(--acc-3)]",
  SLA_PAUSED:       "bg-orange-400",
  SLA_RESUMED:      "bg-emerald-400",
};

function parsePayload(action: AuditAction, raw: Record<string, unknown>): EventPayload {
  switch (action) {
    case "TICKET_CREATED":
      return {
        kind:      "TICKET_CREATED",
        summary:   raw.summary   as string | undefined,
        project:   raw.project   as { code: string; name: string } | undefined,
        priority:  raw.priority  as { name: string } | undefined,
        issueType: raw.issueType as { name: string } | undefined,
      };
    case "STATUS_CHANGED":
      return { kind: "STATUS_CHANGED", from: raw.from as StatusRef | undefined, to: raw.to as StatusRef | undefined };
    case "ASSIGNEE_CHANGED":
      return { kind: "ASSIGNEE_CHANGED", from: raw.from as UserRef | null, to: raw.to as UserRef | null };
    case "SLA_PAUSED":
      return { kind: "SLA_PAUSED" };
    case "SLA_RESUMED":
      return { kind: "SLA_RESUMED" };
  }
}

function ActionBadge({ action, payload }: { action: AuditAction; payload: EventPayload | null }) {
  if (action === "STATUS_CHANGED" && payload?.kind === "STATUS_CHANGED" && payload.to) {
    const color = payload.to.color || "#4ade80";
    return (
      <span
        className="font-mono-tech text-[9px] tracking-[.08em] px-1.5 py-[2px] border leading-none flex-shrink-0"
        style={{ borderColor: color, color }}
      >
        {payload.to.name.toUpperCase()}
      </span>
    );
  }

  const MAP: Record<AuditAction, { label: string; cls: string }> = {
    TICKET_CREATED:   { label: "CREATED",  cls: "border-[var(--acc-1)] text-[var(--acc-1)]" },
    STATUS_CHANGED:   { label: "STATUS",   cls: "border-[var(--acc-2)] text-[var(--acc-2)]" },
    ASSIGNEE_CHANGED: { label: "ASSIGNED", cls: "border-[var(--acc-3)] text-[var(--acc-3)]" },
    SLA_PAUSED:       { label: "PENDING",  cls: "border-orange-400 text-orange-400" },
    SLA_RESUMED:      { label: "ACTIVE",   cls: "border-emerald-400 text-emerald-400" },
  };
  const { label, cls } = MAP[action];
  return (
    <span className={`font-mono-tech text-[9px] tracking-[.08em] px-1.5 py-[2px] border leading-none flex-shrink-0 ${cls}`}>
      {label}
    </span>
  );
}

function ContextDetail({ payload }: { payload: EventPayload | null }) {
  if (!payload) return null;

  if (payload.kind === "TICKET_CREATED") {
    return (
      <p className="font-mono-tech text-[10px] text-[var(--fg)] leading-snug truncate m-0">
        {payload.summary ?? "—"}
        {payload.priority?.name && (
          <span className="text-[var(--fg-faint)]"> · {payload.priority.name}</span>
        )}
        {payload.issueType?.name && (
          <span className="text-[var(--fg-faint)]"> · {payload.issueType.name}</span>
        )}
      </p>
    );
  }

  if (payload.kind === "STATUS_CHANGED") {
    return (
      <p className="flex items-center gap-1.5 font-mono-tech text-[10px] m-0">
        <span className="text-[var(--fg-faint)]">{payload.from?.name ?? "?"}</span>
        <span className="text-[var(--fg-faint)] opacity-50">→</span>
        <span style={{ color: payload.to?.color ?? "var(--acc-2)" }}>
          {payload.to?.name ?? "?"}
        </span>
      </p>
    );
  }

  if (payload.kind === "ASSIGNEE_CHANGED") {
    return (
      <p className="flex items-center gap-1.5 font-mono-tech text-[10px] m-0">
        <span className="text-[var(--fg-faint)]">{payload.from?.name ?? "Unassigned"}</span>
        <span className="text-[var(--fg-faint)] opacity-50">→</span>
        <span className="text-[var(--acc-3)]">{payload.to?.name ?? "Unassigned"}</span>
      </p>
    );
  }

  if (payload.kind === "SLA_PAUSED") {
    return <p className="font-mono-tech text-[10px] text-orange-400 m-0">SLA clock paused</p>;
  }

  if (payload.kind === "SLA_RESUMED") {
    return <p className="font-mono-tech text-[10px] text-emerald-400 m-0">SLA clock resumed</p>;
  }

  return null;
}

export default function LiveActivityFeed() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const connectedRef = useRef(false);

  useEffect(() => {
    fetchRecentAuditLog().then((logs) => {
      const initial: LiveEvent[] = logs.map((log) => ({
        id:        `init-${log.id}`,
        ticketId:  log.ticketId,
        action:    log.action,
        actorName: log.actor?.name ?? null,
        rawTs:     log.createdAt,
        payload:   parsePayload(log.action, (log.payload as Record<string, unknown>) ?? {}),
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
        if (!parsed.action || !parsed.ticketId) return;
        const evt: LiveEvent = {
          id:        `ws-${parsed.ticketId}-${Date.now()}`,
          ticketId:  parsed.ticketId,
          action:    parsed.action as AuditAction,
          actorName: parsed.actorName ?? null,
          rawTs:     new Date().toISOString(),
          payload:   null,
        };
        setEvents((prev) => [evt, ...prev].slice(0, MAX_EVENTS));
      } catch {
        console.debug("[LiveActivityFeed] non-JSON (SLA calc), skipping:", e.data);
      }
    };

    return () => {
      connectedRef.current = false;
      ws.close();
    };
  }, []);

  return (
    <div className="h-full border border-[var(--line)] bg-[var(--bg-1)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="font-bebas text-sm tracking-[.15em] text-[var(--fg)]">⚡ LIVE ACTIVITY</span>
          {events.length > 0 && (
            <span className="font-mono-tech text-[9px] text-[var(--fg-faint)] border border-[var(--line)] px-1.5 py-[2px] leading-none">
              {events.length}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--acc-3)] [box-shadow:0_0_6px_var(--acc-3)] [animation:blink_2s_infinite]" />
          <span className="font-mono-tech text-[9px] text-[var(--acc-3)] tracking-[.08em]">STREAMING</span>
        </span>
      </div>

      {/* Feed */}
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
              className={`w-full flex items-start gap-2.5 px-3 py-3 border-b border-[var(--line)] hover:bg-[var(--bg-2)] text-left cursor-crosshair transition-colors fade-up [animation-delay:${i * 0.02}s]`}
            >
              {/* Square dot */}
              <span className={`w-2 h-2 rounded-[1px] flex-shrink-0 mt-[3px] ${DOT_CLS[evt.action]}`} />

              {/* Body */}
              <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
                {/* Row 1: ticket + verb + badge */}
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono-tech text-[11px] leading-tight">
                    <span className="text-[var(--acc-1)] font-semibold">#{evt.ticketId}</span>
                    <span className="text-[var(--fg-faint)]"> {ACTION_VERB[evt.action]}</span>
                  </span>
                  <ActionBadge action={evt.action} payload={evt.payload} />
                </div>

                {/* Row 2: context detail */}
                <ContextDetail payload={evt.payload} />

                {/* Row 3: actor + time */}
                <div className="flex items-center gap-1 font-mono-tech text-[9px] text-[var(--fg-faint)]">
                  <span className="truncate">{evt.actorName ?? "system"}</span>
                  <span className="opacity-50 flex-shrink-0">·</span>
                  <span
                    className="opacity-60 flex-shrink-0"
                    title={dayjs(evt.rawTs).format("YYYY-MM-DD HH:mm:ss")}
                  >
                    {dayjs(evt.rawTs).fromNow()}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
