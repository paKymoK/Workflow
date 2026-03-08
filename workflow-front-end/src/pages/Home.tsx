import { useEffect, useState } from "react";
import { Card, DatePicker, Spin, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { fetchOverviewStatistic, fetchTicketByIssueType, fetchSlaByStatus, fetchSlaByPriority } from "../api/ticketApi.ts";
import { wsBaseUrl } from "../api/axios.ts";
import type { StatisticItem, TicketByIssueType, SlaStatusDistribution, SlaPriorityDistribution } from "../api/types.ts";

const { Text } = Typography;
const { RangePicker } = DatePicker;

type DateRange = [Dayjs, Dayjs];

const defaultRange = (): DateRange => [dayjs().subtract(6, "day"), dayjs()];

const DEFAULT_COLORS = [
  "#FFE500",
  "#FF2D6B",
  "#00F5FF",
  "#FF6B35",
  "#A855F7",
  "#22D3EE",
];

const EmptyPlaceholder = () => (
  <div className="text-center py-12">
    <div className="font-bebas text-4xl neon-text-yellow tracking-widest mb-2">[ EMPTY ]</div>
    <Text type="secondary" className="font-mono-tech text-xs tracking-widest">// No data available</Text>
  </div>
);

export default function Home() {
  const [stat, setStat] = useState<StatisticItem[] | null>(null);
  const [issueTypeStat, setIssueTypeStat] = useState<TicketByIssueType[] | null>(null);
  const [slaStatusStat, setSlaStatusStat] = useState<SlaStatusDistribution[] | null>(null);
  const [slaPriorityStat, setSlaPriorityStat] = useState<SlaPriorityDistribution[] | null>(null);
  const [loadingStat, setLoadingStat] = useState(true);
  const [loadingIssue, setLoadingIssue] = useState(true);
  const [loadingSlaStatus, setLoadingSlaStatus] = useState(true);
  const [loadingSlaPriority, setLoadingSlaPriority] = useState(true);
  const [statRange, setStatRange] = useState<DateRange>(defaultRange);
  const [issueRange, setIssueRange] = useState<DateRange>(defaultRange);
  const [slaStatusRange, setSlaStatusRange] = useState<DateRange>(defaultRange);
  const [slaPriorityRange, setSlaPriorityRange] = useState<DateRange>(defaultRange);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let active = true;
    fetchOverviewStatistic(
      statRange[0].startOf("day").toISOString(),
      statRange[1].endOf("day").toISOString(),
    ).then((data) => { if (active) { setStat(data); setLoadingStat(false); } });
    return () => { active = false; };
  }, [statRange, refetchKey]);

  useEffect(() => {
    let active = true;
    fetchTicketByIssueType(
      issueRange[0].startOf("day").toISOString(),
      issueRange[1].endOf("day").toISOString(),
    ).then((data) => { if (active) { setIssueTypeStat(data); setLoadingIssue(false); } });
    return () => { active = false; };
  }, [issueRange, refetchKey]);

  useEffect(() => {
    let active = true;
    fetchSlaByStatus(
      slaStatusRange[0].startOf("day").toISOString(),
      slaStatusRange[1].endOf("day").toISOString(),
    ).then((data) => { if (active) { setSlaStatusStat(data); setLoadingSlaStatus(false); } });
    return () => { active = false; };
  }, [slaStatusRange, refetchKey]);

  useEffect(() => {
    let active = true;
    fetchSlaByPriority(
      slaPriorityRange[0].startOf("day").toISOString(),
      slaPriorityRange[1].endOf("day").toISOString(),
    ).then((data) => { if (active) { setSlaPriorityStat(data); setLoadingSlaPriority(false); } });
    return () => { active = false; };
  }, [slaPriorityRange, refetchKey]);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    const ws = new WebSocket(`${wsBaseUrl}/workflow-service/web-socket/sla`);
    ws.onopen = () => { ws.send(token ?? ""); };
    ws.onmessage = () => { setRefetchKey((k) => k + 1); };
    return () => ws.close();
  }, []);

  const total = stat?.reduce((sum, s) => sum + s.value, 0) ?? 0;

  const pieData = (stat ?? []).map((s, i) => ({
    name: s.name,
    value: s.value,
    fill: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  // Extract dynamic status keys (all keys except "name")
  const statusKeys = issueTypeStat && issueTypeStat.length > 0
    ? Object.keys(issueTypeStat[0]).filter((k) => k !== "name")
    : [];

  const slaStatusDonutData = (slaStatusStat ?? []).map((s, i) => ({
    name: `${s.responseStatus} / ${s.resolutionStatus}`,
    value: s.count,
    fill: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  const SLA_PRIORITY_KEYS: { key: keyof SlaPriorityDistribution; color: string }[] = [
    { key: "Success", color: "#00F5FF" },
    { key: "Response Overdue", color: "#FFE500" },
    { key: "Resolution Overdue", color: "#FF2D6B" },
  ];

  return (
    <div className="p-2">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-bebas text-3xl tracking-[0.15em] neon-text-yellow m-0">▸ OVERVIEW</h2>
        <span className="font-mono-tech text-xs text-[rgba(240,240,240,0.3)] tracking-widest">// ANALYTICS TERMINAL</span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Pie chart — Tickets by Status */}
        <Card
          title="Tickets by Status"
          extra={
            <div className="flex items-center gap-3">
              <RangePicker
                value={statRange}
                onChange={(v) => { if (v) { setStatRange(v as DateRange); setLoadingStat(true); } }}
                allowClear={false}
              />
              {stat && <Text type="secondary">Total: {total} tickets</Text>}
            </div>
          }
          className="min-w-0"
        >
          {loadingStat ? (
            <div className="text-center py-12"><Spin /></div>
          ) : pieData.length === 0 ? (
            <EmptyPlaceholder />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  outerRadius={110}
                  dataKey="value"
                  isAnimationActive={false}
                  label={({ name, percent }) =>
                    `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                />
                <Tooltip
                  formatter={(value: number | undefined) => [
                    `${value ?? 0} tickets`,
                    "Count",
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Stacked bar chart — Tickets by Issue Type */}
        <Card
          title="Tickets by Issue Type"
          extra={
            <RangePicker
              value={issueRange}
              onChange={(v) => { if (v) { setIssueRange(v as DateRange); setLoadingIssue(true); } }}
              allowClear={false}
            />
          }
          className="min-w-0"
        >
          {loadingIssue ? (
            <div className="text-center py-12"><Spin /></div>
          ) : !issueTypeStat || issueTypeStat.length === 0 ? (
            <EmptyPlaceholder />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={issueTypeStat} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,229,0,0.1)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(240,240,240,0.5)", fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: "rgba(240,240,240,0.5)", fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {statusKeys.map((key, i) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Donut chart — SLA by Status */}
        <Card
          title="SLA by Status"
          extra={
            <RangePicker
              value={slaStatusRange}
              onChange={(v) => { if (v) { setSlaStatusRange(v as DateRange); setLoadingSlaStatus(true); } }}
              allowClear={false}
            />
          }
          className="min-w-0"
        >
          {loadingSlaStatus ? (
            <div className="text-center py-12"><Spin /></div>
          ) : slaStatusDonutData.length === 0 ? (
            <EmptyPlaceholder />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={slaStatusDonutData}
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={110}
                  dataKey="value"
                  isAnimationActive={false}
                  label={({ name, percent }) =>
                    `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {slaStatusDonutData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number | undefined) => [`${value ?? 0} tickets`, "Count"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Grouped bar chart — SLA by Priority */}
        <Card
          title="SLA by Priority"
          extra={
            <RangePicker
              value={slaPriorityRange}
              onChange={(v) => { if (v) { setSlaPriorityRange(v as DateRange); setLoadingSlaPriority(true); } }}
              allowClear={false}
            />
          }
          className="min-w-0"
        >
          {loadingSlaPriority ? (
            <div className="text-center py-12"><Spin /></div>
          ) : !slaPriorityStat || slaPriorityStat.length === 0 ? (
            <EmptyPlaceholder />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={slaPriorityStat} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,229,0,0.1)" />
                <XAxis dataKey="priorityName" tick={{ fill: "rgba(240,240,240,0.5)", fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: "rgba(240,240,240,0.5)", fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {SLA_PRIORITY_KEYS.map(({ key, color }) => (
                  <Bar key={key} dataKey={key} fill={color} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
