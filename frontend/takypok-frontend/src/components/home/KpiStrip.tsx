import { useMemo } from "react";
import { dynamicStyle } from "../../utils/dynamicStyle";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import { fetchTickets } from "../../api/ticketApi";
import { usePriorities } from "../../hooks/useTickets";
import { useSlaOverview, useTicketByApplicationTrend } from "../../hooks/useStatistics";

interface Delta {
  value: number;
  unit: "%" | "count";
}

interface KpiCardProps {
  eyebrow: string;
  value: string | number;
  accent: string;
  sparkData?: { date: string; count: number }[];
  sub?: string;
  delta?: Delta | null;
  /** When true, a higher value is bad (e.g. SLA breached). Flips the color logic. */
  invertDelta?: boolean;
}

function DeltaBadge({ delta, invert }: { delta: Delta; invert?: boolean }) {
  const up = delta.value >= 0;
  const good = invert ? !up : up;
  const color = good ? "var(--green)" : "var(--red)";
  const arrow = up ? "▲" : "▼";
  const label = delta.unit === "%"
    ? `${Math.abs(delta.value)}%`
    : `${Math.abs(delta.value)}`;
  return (
    <span
      className="text-[11px] font-semibold flex-shrink-0"
      style={dynamicStyle({ color })}
    >
      {arrow} {label}
    </span>
  );
}

function KpiCard({ eyebrow, value, accent, sparkData, sub, delta, invertDelta }: KpiCardProps) {
  return (
    <div className="relative flex flex-col justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-[3px]"
        style={dynamicStyle({ background: accent })}
      />
      <div>
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-[10.5px] font-semibold tracking-[.05em] text-[var(--text-faint)] uppercase m-0">{eyebrow}</p>
          {delta != null && <DeltaBadge delta={delta} invert={invertDelta} />}
        </div>
        <p className="text-[28px] font-bold leading-none m-0 mt-0.5" style={dynamicStyle({ color: accent })}>
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-[var(--text-faint)] m-0 mt-1.5">{sub}</p>
        )}
      </div>
      {sparkData && sparkData.length > 1 && (
        <div className="h-8 mt-2 opacity-70 min-w-0 overflow-hidden">
          <ResponsiveContainer width="99%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="count"
                stroke={accent}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function pctDelta(cur: number, prev: number): Delta | null {
  if (prev === 0) return cur > 0 ? { value: 100, unit: "%" } : null;
  return { value: Math.round(((cur - prev) / prev) * 100), unit: "%" };
}

function countDelta(cur: number, prev: number): Delta | null {
  const diff = cur - prev;
  return diff !== 0 ? { value: diff, unit: "count" } : null;
}

interface Props {
  refetchKey?: number;
}

export default function KpiStrip({ refetchKey = 0 }: Props) {
  // Current period: last 7 days
  const todayStr  = useMemo(() => dayjs().endOf("day").toISOString(), []);
  const weekAgo   = useMemo(() => dayjs().subtract(6, "day").startOf("day").toISOString(), []);
  // Previous period: 7–14 days ago
  const twoWeeksAgo = useMemo(() => dayjs().subtract(13, "day").startOf("day").toISOString(), []);
  const weekAgoEnd  = useMemo(() => dayjs().subtract(7, "day").endOf("day").toISOString(), []);

  const { data: allTickets } = useQuery({
    queryKey: ["kpi", "open", refetchKey],
    queryFn:  () => fetchTickets({ page: 0, size: 1 }),
    staleTime: 30_000,
  });

  const { data: priorities = [] } = usePriorities();

  const criticalPriority = useMemo(
    () => [...priorities].sort((a, b) => b.level - a.level)[0],
    [priorities],
  );

  const { data: criticalTickets } = useQuery({
    queryKey: ["kpi", "critical", criticalPriority?.id, refetchKey],
    queryFn:  () => fetchTickets({ page: 0, size: 1, priorityId: criticalPriority!.id }),
    enabled:  !!criticalPriority,
    staleTime: 30_000,
  });

  // Current-period data
  const { data: sla }      = useSlaOverview(weekAgo, todayStr, refetchKey);
  const { data: trendRaw = [] } = useTicketByApplicationTrend(weekAgo, todayStr, refetchKey);

  // Previous-period data (for deltas)
  const { data: slaPrev }       = useSlaOverview(twoWeeksAgo, weekAgoEnd, refetchKey);
  const { data: trendRawPrev = [] } = useTicketByApplicationTrend(twoWeeksAgo, weekAgoEnd, refetchKey);

  const trend = useMemo(() => {
    const byDate = new Map<string, number>();
    trendRaw.forEach((pt) => {
      const d = pt.date.slice(0, 10);
      byDate.set(d, (byDate.get(d) ?? 0) + pt.count);
    });
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [trendRaw]);

  // Current metrics
  const totalQueue    = allTickets?.totalElements ?? 0;
  const criticalCount = criticalTickets?.totalElements ?? 0;
  const breached      = (sla?.resolutionMissed ?? 0) + (sla?.responseMissed ?? 0);
  const total         = sla?.total ?? 0;
  const compliancePct = total > 0
    ? Math.round(((sla?.resolutionDoneInTime ?? 0) + (sla?.responseDoneInTime ?? 0)) / (total * 2) * 100)
    : 0;

  // Previous-period metrics
  const trendCurTotal  = trendRaw.reduce((s, pt) => s + pt.count, 0);
  const trendPrevTotal = trendRawPrev.reduce((s, pt) => s + pt.count, 0);

  const breachedPrev      = (slaPrev?.resolutionMissed ?? 0) + (slaPrev?.responseMissed ?? 0);
  const totalPrev         = slaPrev?.total ?? 0;
  const compliancePrevPct = totalPrev > 0
    ? Math.round(((slaPrev?.resolutionDoneInTime ?? 0) + (slaPrev?.responseDoneInTime ?? 0)) / (totalPrev * 2) * 100)
    : 0;

  // Deltas
  const queueDelta      = pctDelta(trendCurTotal, trendPrevTotal);
  const breachedDelta   = countDelta(breached, breachedPrev);
  const complianceDelta = compliancePrevPct > 0
    ? { value: compliancePct - compliancePrevPct, unit: "%" as const }
    : null;

  const complianceAccent = compliancePct >= 80
    ? "var(--acc-3)"
    : compliancePct >= 60
      ? "var(--acc-warn)"
      : "var(--priority-critical)";

  return (
    <div className="grid grid-cols-4 gap-[14px]">
      <KpiCard
        eyebrow="TOTAL QUEUE"
        value={totalQueue}
        accent="var(--acc-1)"
        sparkData={trend}
        delta={queueDelta}
      />
      <KpiCard
        eyebrow="CRITICAL NOW"
        value={criticalCount}
        accent="var(--priority-critical)"
        sub={criticalPriority ? `≤ ${criticalPriority.responseTime}h SLA` : undefined}
      />
      <KpiCard
        eyebrow="SLA BREACHED"
        value={breached}
        accent="var(--acc-hot)"
        sparkData={trend}
        delta={breachedDelta}
        invertDelta
      />
      <KpiCard
        eyebrow="COMPLIANCE"
        value={`${compliancePct}%`}
        accent={complianceAccent}
        sub={total > 0 ? `${total} tickets in range` : undefined}
        delta={complianceDelta}
      />
    </div>
  );
}
