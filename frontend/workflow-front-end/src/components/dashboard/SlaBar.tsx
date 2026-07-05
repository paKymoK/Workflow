import type { TicketSla } from "../../api/types";
import { dynamicStyle } from "../../utils/dynamicStyle";

export default function SlaBar({ sla }: { sla: TicketSla["sla"] }) {
  if (!sla) return <span className="text-[var(--text-faint)] text-xs">—</span>;

  const percent = sla.status.resolutionPercent ?? 0;
  const overdue = sla.status.isResolutionOverdue ?? false;
  const clamped = Math.min(100, Math.round(percent));

  const color =
    overdue || percent >= 100
      ? "var(--red)"
      : percent >= 80
      ? "var(--amber)"
      : "var(--accent)";

  return (
    <div className="flex flex-col gap-1 min-w-[80px]">
      <div className="h-1.5 rounded-full bg-[var(--hover)] w-full relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
          style={dynamicStyle({ width: `${clamped}%`, background: color })}
        />
      </div>
      <span className="text-[10px] leading-none font-medium" style={dynamicStyle({ color })}>
        {clamped}%{overdue ? " overdue" : ""}
      </span>
    </div>
  );
}
