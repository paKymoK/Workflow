import { useMemo } from "react";
import { dynamicStyle } from "../../utils/dynamicStyle";
import { useSlaOverview } from "../../hooks/useStatistics";
import dayjs from "dayjs";

interface GaugeProps {
  label: string;
  inTime: number;
  inProgress: number;
  missed: number;
  total: number;
}

function SlaGauge({ label, inTime, inProgress, missed, total }: GaugeProps) {
  const pct = total > 0 ? Math.round((inTime / total) * 100) : 0;
  const segs = [
    { v: inTime,     c: "var(--green)" },
    { v: inProgress, c: "var(--accent)" },
    { v: missed,     c: "var(--red)"   },
  ] as const;

  return (
    <div className="mb-3.5 last:mb-0">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[11.5px] font-semibold text-[var(--text-dim)]">
          {label}
        </span>
        <span className="text-[15px] font-bold leading-none text-[var(--green)]">
          {pct}%
        </span>
      </div>
      <div className="flex h-2 gap-[2px] rounded-[5px] overflow-hidden bg-[var(--hover)]">
        {segs.map((s, i) =>
          s.v > 0 ? (
            <div
              key={i}
              style={dynamicStyle({ flex: s.v, background: s.c })}
            />
          ) : null,
        )}
      </div>
      <div className="flex gap-3.5 mt-1.5">
        <span className="text-[10.5px] text-[var(--text-faint)]"><span className="text-[var(--green)]">●</span> {inTime} in-time</span>
        <span className="text-[10.5px] text-[var(--text-faint)]"><span className="text-[var(--accent)]">●</span> {inProgress} active</span>
        <span className="text-[10.5px] text-[var(--text-faint)]"><span className="text-[var(--red)]">●</span> {missed} missed</span>
      </div>
    </div>
  );
}

interface Props {
  refetchKey?: number;
}

export default function SlaComplianceCard({ refetchKey = 0 }: Props) {
  const today   = useMemo(() => dayjs().endOf("day").toISOString(), []);
  const weekAgo = useMemo(() => dayjs().subtract(6, "day").startOf("day").toISOString(), []);

  const { data: sla, isLoading } = useSlaOverview(weekAgo, today, refetchKey);

  return (
    <div className="h-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col">
      <div className="flex items-baseline justify-between mb-3.5">
        <span className="flex items-center gap-2 text-[13.5px] font-semibold text-[var(--text)]">
          SLA Compliance
        </span>
        <span className="text-[11px] text-[var(--text-faint)]">Last 7 days</span>
      </div>

      {isLoading || !sla ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[12px] text-[var(--text-faint)]">Loading…</span>
        </div>
      ) : (
        <div className="flex-1">
          <SlaGauge
            label="Response"
            inTime={sla.responseDoneInTime}
            inProgress={sla.responseInProgress}
            missed={sla.responseMissed}
            total={sla.total}
          />
          <SlaGauge
            label="Resolution"
            inTime={sla.resolutionDoneInTime}
            inProgress={sla.resolutionInProgress}
            missed={sla.resolutionMissed}
            total={sla.total}
          />

          <div className="mt-3.5 pt-3 border-t border-[var(--border)]">
            <div className="flex justify-between">
              <span className="text-[11px] text-[var(--text-faint)]">Total tickets</span>
              <span className="text-[13.5px] font-semibold text-[var(--text)]">{sla.total}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
