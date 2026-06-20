import type { TicketSla } from "../../api/types";

export default function SlaBar({ sla }: { sla: TicketSla["sla"] }) {
  if (!sla) return <span className="text-[var(--fg-faint)] text-xs">—</span>;

  const percent = sla.status.resolutionPercent ?? 0;
  const overdue = sla.status.isResolutionOverdue ?? false;
  const clamped = Math.min(100, Math.round(percent));

  const color =
    overdue || percent >= 100
      ? "var(--priority-critical)"
      : percent >= 80
      ? "var(--acc-amber)"
      : "var(--acc-1)";

  return (
    <div className="flex flex-col gap-1 min-w-[80px]">
      <div className="h-[5px] bg-[var(--bg-3)] w-full relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${clamped}%`, background: color, transition: "width 0.3s" }}
        />
      </div>
      <span className="font-mono-tech text-[10px] leading-none" style={{ color }}>
        {clamped}%{overdue ? " OVERDUE" : ""}
      </span>
    </div>
  );
}
