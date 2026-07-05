import { useNavigate } from "react-router-dom";
import { dynamicStyle } from "../../utils/dynamicStyle";
import { Drawer, Tag, Button, Skeleton, App, Dropdown } from "antd";
import { StatusChip } from "../ui/StatusChip";
import {
  ArrowRightOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  CaretRightOutlined,
  DownOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTicket, usePauseTicket, useResumeTicket, useTransitionTicket } from "../../hooks/useTickets";
import SlaBar from "./SlaBar";
import PriorityBars from "./PriorityBars";

dayjs.extend(relativeTime);

interface Props {
  id: number | null;
  onClose: () => void;
}

export default function InspectorDrawer({ id, onClose }: Props) {
  const navigate = useNavigate();
  const { message } = App.useApp();

  const { data: ticket, isLoading } = useTicket(id ?? undefined);
  const pauseMutation      = usePauseTicket();
  const resumeMutation     = useResumeTicket();
  const transitionMutation = useTransitionTicket();

  const isPaused     = ticket?.sla?.isPaused ?? false;
  const resolutionPct = ticket?.sla?.status.resolutionPercent ?? 0;
  const responseOk   = ticket?.sla?.status.isResponseOverdue === false;
  const resolutionOk = ticket?.sla?.status.isResolutionOverdue === false;

  const ticketCode = ticket
    ? `${ticket.project.code}-${String(ticket.id).padStart(4, "0")}`
    : "—";

  const availableTransitions = (ticket?.workflow?.transitions ?? []).filter(
    (tr) => tr.from.id === ticket?.status.id,
  );

  const handlePause = async () => {
    if (!ticket) return;
    try {
      await (isPaused ? resumeMutation : pauseMutation).mutateAsync(ticket.id);
      message.success(isPaused ? "SLA resumed" : "SLA paused");
    } catch {
      message.error("Action failed");
    }
  };

  const handleTransition = async (name: string) => {
    if (!ticket) return;
    try {
      await transitionMutation.mutateAsync({
        ticketId: ticket.id,
        currentStatusId: ticket.status.id,
        transitionName: name,
      });
      message.success("Status advanced");
    } catch {
      message.error("Transition failed — open the full ticket for complex transitions");
    }
  };

  const advanceButton = (() => {
    if (availableTransitions.length === 0) return null;
    if (availableTransitions.length === 1) {
      return (
        <Button
          size="small"
          icon={<CaretRightOutlined />}
          loading={transitionMutation.isPending}
          onClick={() => handleTransition(availableTransitions[0].name)}
        >
          {availableTransitions[0].name}
        </Button>
      );
    }
    return (
      <Dropdown
        menu={{
          items: availableTransitions.map((tr) => ({
            key: tr.name,
            label: tr.name,
            onClick: () => handleTransition(tr.name),
          })),
        }}
        trigger={["click"]}
      >
        <Button size="small" icon={<DownOutlined />} loading={transitionMutation.isPending}>
          Advance
        </Button>
      </Dropdown>
    );
  })();

  return (
    <Drawer
      open={id !== null}
      onClose={onClose}
      width={420}
      title={null}
      closeIcon={null}
      className="inspector-drawer"
      styles={{ body: { padding: 0 }, wrapper: { boxShadow: "-8px 0 32px rgba(0,0,0,.16)" } }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
        {isLoading || !ticket ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <button
                onClick={() => { navigate(`/dashboard/${ticket.id}`); onClose(); }}
                className="text-[13px] font-semibold text-[var(--accent)] hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                {ticketCode}
              </button>
              <StatusChip color={ticket.status.color} name={ticket.status.name} />
              {isPaused && (
                <Tag color="var(--amber)" className="text-xs!">
                  Paused
                </Tag>
              )}
            </div>
            <p className="text-[13px] text-[var(--text)] leading-snug m-0 line-clamp-2">
              {ticket.summary}
            </p>
          </>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
        {isLoading || !ticket ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <>
            {/* SLA block */}
            <section>
              <p className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-faint)] mb-2">
                SLA Status
              </p>
              <div className="flex items-end gap-3 mb-2">
                <span
                  className="text-4xl font-bold leading-none"
                  style={dynamicStyle({
                    color: ticket.sla?.status.isResolutionOverdue
                      ? "var(--red)"
                      : resolutionPct >= 80
                      ? "var(--amber)"
                      : "var(--accent)",
                  })}
                >
                  {Math.min(100, Math.round(resolutionPct))}%
                </span>
                <span className="text-[11px] text-[var(--text-faint)] mb-1">
                  resolution
                </span>
              </div>
              <SlaBar sla={ticket.sla} />
              <div className="flex gap-4 mt-2">
                <span className="text-[11px] font-semibold"
                  style={dynamicStyle({ color: responseOk ? "var(--green)" : "var(--red)" })}>
                  {responseOk ? "✓" : "✗"} Response
                </span>
                <span className="text-[11px] font-semibold"
                  style={dynamicStyle({ color: resolutionOk ? "var(--green)" : "var(--red)" })}>
                  {resolutionOk ? "✓" : "✗"} Resolution
                </span>
              </div>
              {isPaused && ticket.sla?.pausedTime?.length ? (
                <div className="mt-2 px-3 py-2 rounded-md border-l-2 border-[var(--amber)] bg-[var(--hover)]">
                  <p className="text-[11px] text-[var(--amber)] m-0">
                    SLA paused — {ticket.sla.pausedTime[ticket.sla.pausedTime.length - 1].reason ?? "No reason given"}
                  </p>
                </div>
              ) : null}
            </section>

            {/* Priority */}
            <section>
              <p className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-faint)] mb-2">
                Priority
              </p>
              <PriorityBars priority={ticket.priority} />
            </section>

            {/* Meta grid */}
            <section>
              <p className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-faint)] mb-2">
                Details
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  ["Project",    ticket.project.name],
                  ["Issue Type", ticket.issueType.name],
                  ["Reporter",   ticket.reporter.name],
                  ["Created",    dayjs(ticket.createdAt).format("DD MMM YYYY")],
                  ["Assignee",   ticket.assignee?.name ?? "Unassigned"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-[.04em] m-0">{label}</p>
                    <p className="text-[12px] text-[var(--text)] m-0 truncate">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Description */}
            {ticket.detail?.description && (
              <section>
                <p className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-faint)] mb-2">
                  Description
                </p>
                <p className="text-[12.5px] text-[var(--text-dim)] leading-relaxed m-0 line-clamp-4">
                  {ticket.detail.description}
                </p>
              </section>
            )}

            {/* Pause history */}
            {(ticket.sla?.pausedTime?.length ?? 0) > 0 && (
              <section>
                <p className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-faint)] mb-2">
                  Pause History
                </p>
                <div className="flex flex-col gap-2">
                  {ticket.sla!.pausedTime.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-[var(--text-dim)] m-0">
                          {dayjs(pt.pausedTime).format("DD MMM HH:mm")}
                          {pt.resumeTime ? ` → ${dayjs(pt.resumeTime).format("HH:mm")}` : " (active)"}
                        </p>
                        {pt.reason && (
                          <p className="text-[10px] text-[var(--text-faint)] m-0">{pt.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[var(--border)] flex items-center gap-2 flex-wrap">
        <Button
          type="primary"
          size="small"
          icon={<ArrowRightOutlined />}
          onClick={() => { navigate(`/dashboard/${id}`); onClose(); }}
          className="flex-shrink-0"
        >
          Open full ticket
        </Button>
        <Button
          size="small"
          icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
          loading={pauseMutation.isPending || resumeMutation.isPending}
          onClick={handlePause}
          disabled={!ticket}
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>
        {advanceButton}
      </div>
    </Drawer>
  );
}
