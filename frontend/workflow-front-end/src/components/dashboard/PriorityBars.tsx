import { usePriorities } from "../../hooks/useTickets";
import type { Priority } from "../../api/types";
import { dynamicStyle } from "../../utils/dynamicStyle";

const PRI_COLORS: Record<string, string> = {
  Critical: "var(--acc-hot)",
  High:     "var(--acc-amber)",
  Medium:   "var(--acc-warn)",
  Low:      "var(--acc-3)",
};

export default function PriorityBars({ priority }: { priority: Priority | undefined }) {
  const { data: priorities = [] } = usePriorities();

  if (!priority) return <span className="text-[var(--fg-faint)] text-xs">—</span>;

  const sorted = [...priorities].sort((a, b) => a.responseTime - b.responseTime);
  const idx = sorted.findIndex((p) => p.id === priority.id);
  // shortest responseTime = highest urgency = rank 4
  const rank = idx === -1 ? 1 : Math.min(4, Math.max(1, sorted.length - idx));
  const color = PRI_COLORS[priority.name] ?? "var(--acc-1)";

  return (
    <div className="flex items-end gap-[3px]" title={priority.name}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[3px] shrink-0"
          style={dynamicStyle({
            height: 4 + i * 2.2,
            background: i <= rank ? color : "var(--bg-3)",
          })}
        />
      ))}
      <span className="font-mono-tech text-[10px] ml-1.5" style={dynamicStyle({ color })}>
        {priority.name.toUpperCase()}
      </span>
    </div>
  );
}
