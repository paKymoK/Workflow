import { useMemo } from "react";
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
  const safe   = total > 0 ? (inTime / total) * 100 : 0;
  const active = total > 0 ? (inProgress / total) * 100 : 0;
  const bad    = total > 0 ? (missed / total) * 100 : 0;
  const pct    = total > 0 ? Math.round((inTime / total) * 100) : 0;

  const pctColor =
    pct >= 80 ? "var(--acc-3)" : pct >= 60 ? "var(--acc-warn)" : "var(--priority-critical)";

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="font-mono-tech text-[10px] tracking-widest text-[var(--fg-dim)]">
          {label}
        </span>
        <span className={`font-bebas text-xl leading-none text-[${pctColor}]`}>
          {pct}%
        </span>
      </div>
      <div className="flex h-[6px] overflow-hidden">
        <div className={`w-[${safe}%] bg-[var(--acc-3)] transition-[width] duration-[400ms] ease-linear`} />
        <div className={`w-[${active}%] bg-[var(--acc-1)] transition-[width] duration-[400ms] ease-linear`} />
        <div className={`w-[${bad}%] bg-[var(--priority-critical)] transition-[width] duration-[400ms] ease-linear`} />
        <div className="flex-1 bg-[var(--bg-3)]" />
      </div>
      <div className="flex gap-3 mt-1.5">
        <span className="font-mono-tech text-[9px] text-[var(--acc-3)]">■ {inTime} IN-TIME</span>
        <span className="font-mono-tech text-[9px] text-[var(--acc-1)]">■ {inProgress} ACTIVE</span>
        <span className="font-mono-tech text-[9px] text-[var(--priority-critical)]">■ {missed} MISSED</span>
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
        <span className="font-bebas text-sm tracking-[.15em] text-[var(--fg)]">SLA COMPLIANCE</span>
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
