import { useEffect, useState } from "react";
import { Card, Spin, Typography } from "antd";
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchOverviewStatistic } from "../api/ticketApi.ts";
import type { StatisticItem } from "../api/types.ts";

const { Title, Text } = Typography;

const DEFAULT_COLORS = [
  "#4f86c6",
  "#f5a623",
  "#7ed321",
  "#d0021b",
  "#9b59b6",
  "#1abc9c",
];

export default function Home() {
  const [stat, setStat] = useState<StatisticItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewStatistic()
      .then(setStat)
      .finally(() => {
        console.log(stat);
        setLoading(false);
      });
  }, []);

  const total = stat?.reduce((sum, s) => sum + s.value, 0) ?? 0;

  const chartData = (stat ?? []).map((s, i) => ({
    name: s.name,
    value: s.value,
    fill: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  return (
    <div style={{ padding: "24px" }}>
      <Title level={3}>Overview</Title>

      <Card
        title="Tickets by Status"
        extra={
          stat && (
            <Text type="secondary">Total: {total} tickets</Text>
          )
        }
        style={{ maxWidth: 600 }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <Spin />
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#bfbfbf" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📭</div>
            <Text type="secondary">No data available</Text>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                outerRadius={110}
                dataKey="value"
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
    </div>
  );
}
