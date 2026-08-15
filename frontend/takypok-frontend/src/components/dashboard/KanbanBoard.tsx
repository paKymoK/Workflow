import { useMemo, useState } from "react";
import { App, Spin } from "antd";
import { StatusChip } from "../ui/StatusChip";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@takypok/shared";
import { useTicketList, useTransitionTicket, ticketKeys } from "../../hooks/useTickets";
import type { FilterTicketRequest } from "../../api/ticketApi";
import type { PageResponse, TicketSla } from "../../api/types";
import SlaBar from "./SlaBar";
import PriorityBars from "./PriorityBars";
import dayjs from "dayjs";

const GROUPS = [
  { key: "TODO",        label: "To Do",        color: "var(--accent)" },
  { key: "PROCESSING",  label: "In Progress",  color: "var(--amber)"  },
  { key: "DONE",        label: "Done",         color: "var(--green)"  },
] as const;

const COL_DRAG_CLASSES: Record<string, string> = {
  "TODO":       "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_5%,transparent)]",
  "PROCESSING": "border-[var(--amber)] bg-[color-mix(in_oklab,var(--amber)_5%,transparent)]",
  "DONE":       "border-[var(--green)] bg-[color-mix(in_oklab,var(--green)_5%,transparent)]",
};
const COL_TEXT: Record<string, string> = {
  "TODO":       "text-[var(--text-dim)]",
  "PROCESSING": "text-[var(--text-dim)]",
  "DONE":       "text-[var(--text-dim)]",
};

interface Props {
  onCardClick: (id: number) => void;
}

export default function KanbanBoard({ onCardClick }: Props) {
  const { message } = App.useApp();
  const { user } = useAuth();
  const qc = useQueryClient();
  const transitionMutation = useTransitionTicket();

  const mySub = user?.sub as string | undefined;

  const kanbanParams = useMemo<FilterTicketRequest>(
    () => ({ page: 0, size: 100, ...(mySub ? { assigneeSub: mySub } : {}) }),
    [mySub],
  );

  const { data: pageData, isLoading } = useTicketList(kanbanParams, { enabled: !!mySub });
  const tickets = useMemo(() => pageData?.content ?? [], [pageData]);

  const columns = useMemo(
    () =>
      GROUPS.map((g) => ({
        ...g,
        tickets: tickets.filter((t) => t.status.group === g.key),
      })),
    [tickets],
  );

  // ── Drag state ───────────────────────────────────────────
  const [dragId, setDragId] = useState<number | null>(null);
  const [overGroup, setOverGroup] = useState<string | null>(null);

  const handleDrop = async (targetGroup: string) => {
    setOverGroup(null);
    if (!dragId) return;

    const ticket = tickets.find((t) => t.id === dragId);
    setDragId(null);
    if (!ticket || ticket.status.group === targetGroup) return;

    const transition = ticket.workflow?.transitions.find(
      (tr) => tr.from.id === ticket.status.id && tr.to.group === targetGroup,
    );

    if (!transition) {
      message.warning("No transition available for that move");
      return;
    }

    // Optimistic: patch the ticket's status in the cache immediately
    const snapshot = qc.getQueryData<PageResponse<TicketSla>>(ticketKeys.list(kanbanParams));

    qc.setQueryData<PageResponse<TicketSla>>(ticketKeys.list(kanbanParams), (old) => {
      if (!old) return old;
      return {
        ...old,
        content: old.content.map((t) =>
          t.id === ticket.id ? { ...t, status: transition.to } : t,
        ),
      };
    });

    try {
      await transitionMutation.mutateAsync({
        ticketId: ticket.id,
        currentStatusId: ticket.status.id,
        transitionName: transition.name,
      });
    } catch {
      // Revert optimistic update
      qc.setQueryData(ticketKeys.list(kanbanParams), snapshot);
      message.error("Failed to move ticket");
    }
  };

  if (!mySub) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--text-faint)] text-sm">
          No tickets assigned to you
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 h-full min-h-[500px]">
      {columns.map((col) => (
        <div
          key={col.key}
          className={`flex flex-col rounded-xl border overflow-hidden transition-colors ${overGroup === col.key ? COL_DRAG_CLASSES[col.key] : "border-[var(--border)] bg-[var(--surface)]"}`}
          onDragOver={(e) => { e.preventDefault(); setOverGroup(col.key); }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverGroup(null);
          }}
          onDrop={() => handleDrop(col.key)}
        >
          {/* Column header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--border)]">
            <span className={`text-xs font-bold uppercase tracking-[.03em] ${COL_TEXT[col.key]}`}>
              {col.label}
            </span>
            <span className="text-[11px] font-semibold text-[var(--text-faint)] bg-[var(--hover)] rounded-full px-1.5 py-0.5">
              {col.tickets.length}
            </span>
          </div>

          {/* Cards */}
          <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2">
            {col.tickets.map((ticket) => (
              <KanbanCard
                key={ticket.id}
                ticket={ticket}
                isDragging={dragId === ticket.id}
                onDragStart={() => setDragId(ticket.id)}
                onDragEnd={() => setDragId(null)}
                onClick={() => onCardClick(ticket.id)}
              />
            ))}
            {col.tickets.length === 0 && (
              <p className="text-[11px] text-[var(--text-faint)] text-center mt-4">
                No tickets
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function KanbanCard({
  ticket,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  ticket: TicketSla;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const code = `${ticket.project.code}-${String(ticket.id).padStart(4, "0")}`;
  const age  = dayjs().diff(dayjs(ticket.createdAt), "hour");
  const ageDisplay = age < 24 ? `${age}h` : `${Math.floor(age / 24)}d`;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`rounded-[9px] border border-[var(--border)] bg-[var(--bg)] p-2.5 flex flex-col gap-2 cursor-pointer select-none transition-all hover:-translate-y-0.5 hover:border-[var(--text-faint)] ${isDragging ? "opacity-40" : "opacity-100"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-[var(--accent)]">{code}</span>
        <StatusChip color={ticket.status.color} name={ticket.status.name} small />
      </div>
      <p className="text-xs text-[var(--text)] m-0 line-clamp-2 leading-snug">
        {ticket.summary}
      </p>
      <SlaBar sla={ticket.sla} />
      <div className="flex items-center justify-between">
        <PriorityBars priority={ticket.priority} />
        <span className="text-[10px] text-[var(--text-faint)]">{ageDisplay}</span>
      </div>
    </div>
  );
}
