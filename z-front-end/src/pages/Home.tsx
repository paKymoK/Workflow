import { useCallback, useEffect, useState } from "react";
import { Card, Spin, Typography } from "antd";
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { fetchOverviewStatistic, fetchTicketByIssueType } from "../api/ticketApi.ts";
import { wsBaseUrl } from "../api/axios.ts";
import type { StatisticItem, TicketByIssueType } from "../api/types.ts";

const { Title, Text } = Typography;

const DEFAULT_COLORS = [
  "#4f86c6",
  "#f5a623",
  "#7ed321",
  "#d0021b",
  "#9b59b6",
  "#1abc9c",
];

const EmptyPlaceholder = () => (
  <div style={{ textAlign: "center", padding: "48px 0" }}>
    <div style={{ fontSize: 48, marginBottom: 8 }}>📭</div>
    <Text type="secondary">No data available</Text>
  </div>
);

export default function Home() {
  const [stat, setStat] = useState<StatisticItem[] | null>(null);
  const [issueTypeStat, setIssueTypeStat] = useState<TicketByIssueType[] | null>(null);
  const [loadingStat, setLoadingStat] = useState(true);
  const [loadingIssue, setLoadingIssue] = useState(true);

  const loadStat = useCallback(() => {
    fetchOverviewStatistic().then(setStat).finally(() => setLoadingStat(false));
  }, []);

  const loadIssueTypeStat = useCallback(() => {
    fetchTicketByIssueType().then(setIssueTypeStat).finally(() => setLoadingIssue(false));
  }, []);

  useEffect(() => {
    loadStat();
    loadIssueTypeStat();
  }, [loadStat, loadIssueTypeStat]);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    const ws = new WebSocket(`${wsBaseUrl}/workflow-service/web-socket/sla`);
    ws.onopen = () => { ws.send(token ?? ""); };
    ws.onmessage = () => {
      loadStat();
      loadIssueTypeStat();
    };
    return () => ws.close();
  }, [loadStat, loadIssueTypeStat]);

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

  return (
    <div style={{ padding: "24px" }}>
      <Title level={3}>Overview</Title>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Pie chart — Tickets by Status */}
        <Card
          title="Tickets by Status"
          extra={stat && <Text type="secondary">Total: {total} tickets</Text>}
          style={{ flex: 1, minWidth: 320 }}
        >
          {loadingStat ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}><Spin /></div>
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
          style={{ flex: 1, minWidth: 320 }}
        >
          {loadingIssue ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}><Spin /></div>
          ) : !issueTypeStat || issueTypeStat.length === 0 ? (
            <EmptyPlaceholder />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={issueTypeStat} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
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
      </div>
    </div>
  );
}
