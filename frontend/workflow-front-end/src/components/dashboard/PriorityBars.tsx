import type { Priority } from "../../api/types";
import { dynamicStyle } from "../../utils/dynamicStyle";

const PRI_COLORS: Record<string, string> = {
  Critical: "var(--red)",
  High:     "var(--amber)",
  Medium:   "var(--accent)",
  Low:      "var(--green)",
};

const BAR_HEIGHTS = [6, 10, 14, 18];

export default function PriorityBars({ priority }: { priority: Priority | undefined }) {
  if (!priority) return <span className="text-[var(--text-faint)] text-xs">—</span>;

  const rank = Math.min(4, Math.max(1, priority.level));
  const color = PRI_COLORS[priority.name] ?? "var(--accent)";

  return (
    <div className="flex items-end gap-[3px]" title={priority.name}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1 shrink-0 rounded-[1px]"
          style={dynamicStyle({
            height: BAR_HEIGHTS[i - 1],
            background: i <= rank ? color : "var(--border)",
          })}
        />
      ))}
      <span className="text-[12.5px] font-semibold ml-2" style={dynamicStyle({ color })}>
        {priority.name}
      </span>
    </div>
  );
}
