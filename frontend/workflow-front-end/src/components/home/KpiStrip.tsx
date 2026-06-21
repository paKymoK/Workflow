import { useMemo } from "react";
import { dynamicStyle } from "../../utils/dynamicStyle";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import { fetchTickets } from "../../api/ticketApi";
import { usePriorities } from "../../hooks/useTickets";
import { useSlaOverview, useTicketByApplicationTrend } from "../../hooks/useStatistics";

interface KpiCardProps {
  eyebrow: string;
  value: string | number;
  accent: string;
  sparkData?: { date: string; count: number }[];
  sub?: string;
}

function KpiCard({ eyebrow, value, accent, sparkData, sub }: KpiCardProps) {
  return (
    <div
      className="relative flex flex-col justify-between p-4 border border-[var(--line)] bg-[var(--bg-1)] overflow-hidden"
      style={dynamicStyle({ borderTop: `3px solid ${accent}` })}
    >
      <div>
        <p className="font-mono-tech text-[9px] tracking-[.25em] text-[var(--fg-faint)] m-0 mb-1">{eyebrow}</p>
        <p className="font-bebas text-4xl leading-none m-0" style={dynamicStyle({ color: accent })}>
          {value}
        </p>
        {sub && (
          <p className="font-mono-tech text-[9px] text-[var(--fg-faint)] m-0 mt-1">{sub}</p>
        )}
      </div>
      {sparkData && sparkData.length > 1 && (
        <div className="h-8 mt-2 opacity-60 min-w-0 overflow-hidden">
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

interface Props {
  refetchKey?: number;
}

export default function KpiStrip({ refetchKey = 0 }: Props) {
  const todayStr  = useMemo(() => dayjs().endOf("day").toISOString(), []);
  const weekAgo   = useMemo(() => dayjs().subtract(6, "day").startOf("day").toISOString(), []);

  const { data: allTickets } = useQuery({
    queryKey: ["kpi", "open", refetchKey],
    queryFn:  () => fetchTickets({ page: 0, size: 1 }),
    staleTime: 30_000,
  });

  const { data: priorities = [] } = usePriorities();

  const criticalPriority = useMemo(
    () => [...priorities].sort((a, b) => a.responseTime - b.responseTime)[0],
    [priorities],
  );

  const { data: criticalTickets } = useQuery({
    queryKey: ["kpi", "critical", criticalPriority?.id, refetchKey],
    queryFn:  () => fetchTickets({ page: 0, size: 1, priorityId: criticalPriority!.id }),
    enabled:  !!criticalPriority,
    staleTime: 30_000,
  });

  const { data: sla } = useSlaOverview(weekAgo, todayStr, refetchKey);
  const { data: trendRaw = [] } = useTicketByApplicationTrend(weekAgo, todayStr, refetchKey);

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

  const totalQueue    = allTickets?.totalElements ?? 0;
  const criticalCount = criticalTickets?.totalElements ?? 0;
  const breached      = (sla?.resolutionMissed ?? 0) + (sla?.responseMissed ?? 0);
  const total         = sla?.total ?? 0;
  const compliancePct = total > 0
    ? Math.round(((sla?.resolutionDoneInTime ?? 0) + (sla?.responseDoneInTime ?? 0)) / (total * 2) * 100)
    : 0;

  return (
    <div className="grid grid-cols-4 gap-[14px]">
      <KpiCard eyebrow="TOTAL QUEUE"  value={totalQueue}            accent="var(--acc-1)"             sparkData={trend} />
      <KpiCard eyebrow="CRITICAL NOW" value={criticalCount}         accent="var(--priority-critical)" sub={criticalPriority ? `≤ ${criticalPriority.responseTime}h SLA` : undefined} />
      <KpiCard eyebrow="SLA BREACHED" value={breached}              accent="var(--acc-hot)"           sparkData={trend} />
      <KpiCard
        eyebrow="COMPLIANCE"
        value={`${compliancePct}%`}
        accent={compliancePct >= 80 ? "var(--acc-3)" : compliancePct >= 60 ? "var(--acc-warn)" : "var(--priority-critical)"}
        sub={total > 0 ? `${total} tickets in range` : undefined}
      />
    </div>
  );
}
