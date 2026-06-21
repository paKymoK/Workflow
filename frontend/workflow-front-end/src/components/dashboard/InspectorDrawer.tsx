import { useNavigate } from "react-router-dom";
import { dynamicStyle } from "../../utils/dynamicStyle";
import { Drawer, Tag, Button, Skeleton, App, Dropdown } from "antd";
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
          className="font-bebas! tracking-wider!"
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
        <Button
          size="small"
          icon={<DownOutlined />}
          loading={transitionMutation.isPending}
          className="font-bebas! tracking-wider!"
        >
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
      styles={{ body: { padding: 0 }, wrapper: { boxShadow: "-8px 0 32px rgba(0,0,0,.5)" } }}
    >
      {/* Corner brackets */}
      <span className="content-corner content-corner-tl absolute top-0 left-0" />
      <span className="content-corner content-corner-tr absolute top-0 right-0" />
      <span className="content-corner content-corner-bl absolute bottom-0 left-0" />
      <span className="content-corner content-corner-br absolute bottom-0 right-0" />

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--line)]">
        {isLoading || !ticket ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <button
                onClick={() => { navigate(`/dashboard/${ticket.id}`); onClose(); }}
                className="font-mono-tech text-[13px] text-[var(--acc-1)] hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                {ticketCode}
              </button>
              <Tag color={ticket.status.color} className="font-bebas! tracking-wider! text-xs!">
                {ticket.status.name}
              </Tag>
              {isPaused && (
                <Tag color="var(--acc-amber)" className="font-bebas! tracking-wider! text-xs!">
                  PAUSED
                </Tag>
              )}
            </div>
            <p className="font-mono-tech text-[12px] text-[var(--fg)] leading-snug m-0 line-clamp-2">
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
              <p className="font-bebas text-[11px] tracking-[.2em] text-[var(--acc-1)] mb-2">
                // SLA STATUS
              </p>
              <div className="flex items-end gap-3 mb-2">
                <span
                  className="font-bebas text-4xl leading-none"
                  style={dynamicStyle({
                    color: ticket.sla?.status.isResolutionOverdue
                      ? "var(--priority-critical)"
                      : resolutionPct >= 80
                      ? "var(--acc-amber)"
                      : "var(--acc-1)",
                  })}
                >
                  {Math.min(100, Math.round(resolutionPct))}%
                </span>
                <span className="font-mono-tech text-[10px] text-[var(--fg-faint)] mb-1">
                  resolution
                </span>
              </div>
              <SlaBar sla={ticket.sla} />
              <div className="flex gap-4 mt-2">
                <span className="font-mono-tech text-[10px]"
                  style={dynamicStyle({ color: responseOk ? "var(--acc-3)" : "var(--priority-critical)" })}>
                  {responseOk ? "✓" : "✗"} Response
                </span>
                <span className="font-mono-tech text-[10px]"
                  style={dynamicStyle({ color: resolutionOk ? "var(--acc-3)" : "var(--priority-critical)" })}>
                  {resolutionOk ? "✓" : "✗"} Resolution
                </span>
              </div>
              {isPaused && ticket.sla?.pausedTime?.length ? (
                <div className="mt-2 px-3 py-2 border-l-2 border-[var(--acc-amber)] bg-[var(--bg-2)]">
                  <p className="font-mono-tech text-[10px] text-[var(--acc-amber)] m-0">
                    SLA PAUSED — {ticket.sla.pausedTime[ticket.sla.pausedTime.length - 1].reason ?? "No reason given"}
                  </p>
                </div>
              ) : null}
            </section>

            {/* Priority */}
            <section>
              <p className="font-bebas text-[11px] tracking-[.2em] text-[var(--acc-1)] mb-2">
                // PRIORITY
              </p>
              <PriorityBars priority={ticket.priority} />
            </section>

            {/* Meta grid */}
            <section>
              <p className="font-bebas text-[11px] tracking-[.2em] text-[var(--acc-1)] mb-2">
                // DETAILS
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  ["Project",    ticket.project.name],
                  ["Issue Type", ticket.issueType.name],
                  ["Reporter",   ticket.reporter.name],
                  ["Created",    dayjs(ticket.createdAt).format("DD MMM YYYY")],
                  ["Assignee",   ticket.assignee?.name ?? "UNASSIGNED"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="font-mono-tech text-[9px] text-[var(--fg-faint)] tracking-widest uppercase m-0">{label}</p>
                    <p className="font-mono-tech text-[11px] text-[var(--fg)] m-0 truncate">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Description */}
            {ticket.detail?.description && (
              <section>
                <p className="font-bebas text-[11px] tracking-[.2em] text-[var(--acc-1)] mb-2">
                  // DESCRIPTION
                </p>
                <p className="font-mono-tech text-[11px] text-[var(--fg-dim)] leading-relaxed m-0 line-clamp-4">
                  {ticket.detail.description}
                </p>
              </section>
            )}

            {/* Pause history */}
            {(ticket.sla?.pausedTime?.length ?? 0) > 0 && (
              <section>
                <p className="font-bebas text-[11px] tracking-[.2em] text-[var(--acc-1)] mb-2">
                  // PAUSE HISTORY
                </p>
                <div className="flex flex-col gap-2">
                  {ticket.sla!.pausedTime.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--acc-amber)] mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="font-mono-tech text-[10px] text-[var(--fg-dim)] m-0">
                          {dayjs(pt.pausedTime).format("DD MMM HH:mm")}
                          {pt.resumeTime ? ` → ${dayjs(pt.resumeTime).format("HH:mm")}` : " (active)"}
                        </p>
                        {pt.reason && (
                          <p className="font-mono-tech text-[9px] text-[var(--fg-faint)] m-0">{pt.reason}</p>
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
      <div className="px-5 py-3 border-t border-[var(--line)] flex items-center gap-2 flex-wrap">
        <Button
          type="primary"
          size="small"
          icon={<ArrowRightOutlined />}
          onClick={() => { navigate(`/dashboard/${id}`); onClose(); }}
          className="font-bebas! tracking-wider! flex-shrink-0"
        >
          Open full ticket
        </Button>
        <Button
          size="small"
          icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
          loading={pauseMutation.isPending || resumeMutation.isPending}
          onClick={handlePause}
          disabled={!ticket}
          className="font-bebas! tracking-wider!"
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>
        {advanceButton}
      </div>
    </Drawer>
  );
}
