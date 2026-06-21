import { usePriorities } from "../../hooks/useTickets";
import type { Priority } from "../../api/types";
import { dynamicStyle } from "../../utils/dynamicStyle";

const RANK_COLORS = [
  "var(--priority-low)",
  "var(--priority-medium)",
  "var(--priority-high)",
  "var(--priority-critical)",
];

export default function PriorityBars({ priority }: { priority: Priority | undefined }) {
  const { data: priorities = [] } = usePriorities();

  if (!priority) return <span className="text-[var(--fg-faint)] text-xs">—</span>;

  const sorted = [...priorities].sort((a, b) => a.responseTime - b.responseTime);
  const idx = sorted.findIndex((p) => p.id === priority.id);
  // shortest responseTime = highest urgency = rank 4
  const rank = idx === -1 ? 1 : Math.min(4, Math.max(1, sorted.length - idx));
  const color = RANK_COLORS[rank - 1];

  return (
    <div className="flex items-end gap-[3px]" title={priority.name}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[4px] shrink-0"
          style={dynamicStyle({
            height: 4 + i * 3,
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
