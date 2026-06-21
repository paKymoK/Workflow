import { useMemo } from "react";
import { dynamicStyle } from "../../utils/dynamicStyle";
import { useSlaOverview } from "../../hooks/useStatistics";
import { Icon } from "../ui/Icon";
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
    { v: inTime,     c: "var(--acc-3)"   },
    { v: inProgress, c: "var(--acc-1)"   },
    { v: missed,     c: "var(--acc-hot)" },
  ] as const;

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="font-mono-tech text-[10px] tracking-widest text-[var(--fg-dim)]">
          {label}
        </span>
        <span className="font-bebas text-xl leading-none text-[var(--acc-3)]">
          {pct}%
        </span>
      </div>
      <div className="flex h-[9px] gap-[2px] bg-[var(--bg-3)]">
        {segs.map((s, i) =>
          s.v > 0 ? (
            <div
              key={i}
              style={dynamicStyle({
                flex: s.v,
                background: s.c,
                boxShadow: `0 0 calc(7px * var(--glow)) ${s.c}`,
              })}
            />
          ) : null,
        )}
      </div>
      <div className="flex gap-3 mt-1.5">
        <span className="font-mono-tech text-[9px] text-[var(--acc-3)]">■ {inTime} IN-TIME</span>
        <span className="font-mono-tech text-[9px] text-[var(--acc-1)]">■ {inProgress} ACTIVE</span>
        <span className="font-mono-tech text-[9px] text-[var(--acc-hot)]">■ {missed} MISSED</span>
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
    <div className="h-full border border-[var(--line)] bg-[var(--bg-1)] p-4 flex flex-col">
      <div className="flex items-baseline justify-between mb-4">
        <span className="flex items-center gap-2 font-bebas text-sm tracking-[.15em] text-[var(--fg)]">
          <Icon name="bolt" size={13} className="text-[var(--acc-3)] opacity-80" />
          SLA COMPLIANCE
        </span>
        <span className="font-mono-tech text-[9px] text-[var(--fg-faint)]">LAST 7 DAYS</span>
      </div>

      {isLoading || !sla ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="font-mono-tech text-[10px] text-[var(--fg-faint)]">LOADING...</span>
        </div>
      ) : (
        <div className="flex-1">
          <SlaGauge
            label="RESPONSE"
            inTime={sla.responseDoneInTime}
            inProgress={sla.responseInProgress}
            missed={sla.responseMissed}
            total={sla.total}
          />
          <SlaGauge
            label="RESOLUTION"
            inTime={sla.resolutionDoneInTime}
            inProgress={sla.resolutionInProgress}
            missed={sla.resolutionMissed}
            total={sla.total}
          />

          <div className="mt-4 pt-3 border-t border-[var(--line)]">
            <div className="flex justify-between">
              <span className="font-mono-tech text-[9px] text-[var(--fg-faint)]">TOTAL TICKETS</span>
              <span className="font-bebas text-sm text-[var(--acc-1)]">{sla.total}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
