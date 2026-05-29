import { useState, useMemo } from "react";
import { Card, Table, Checkbox, Button, Popover, Progress, Tag, Spin } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { ColumnsType } from "antd/es/table";
import type { TicketSla } from "../../api/types.ts";
import type { FilterTicketRequest } from "../../api/ticketApi.ts";
import { useSlaOverview } from "../../hooks/useStatistics";
import { useTicketList } from "../../hooks/useTickets";
import DeadlineTag from "../DeadlineTag.tsx";
import { useTheme } from "@takypok/shared";
import dayjs from "dayjs";

type ColKey =
  | "id" | "summary" | "status" | "issueType" | "project"
  | "priority" | "assignee" | "slaPercent" | "response" | "resolution";

type SortField = FilterTicketRequest["sortBy"];

const ALL_COL_KEYS: ColKey[] = [
  "id", "summary", "status", "issueType", "project",
  "priority", "assignee", "slaPercent", "response", "resolution",
];

const COL_LABELS: Record<ColKey, string> = {
  id: "ID", summary: "Summary", status: "Status", issueType: "Issue Type",
  project: "Project", priority: "Priority", assignee: "Assignee",
  slaPercent: "SLA %", response: "Response", resolution: "Resolution",
};

const DEFAULT_COLS: ColKey[] = ["id", "summary", "priority", "slaPercent", "response", "resolution"];

const SLA_COLORS = {
  "In Progress": "#FFE500",
  "Done": "#00F5FF",
  "Missed":       "#FF2D6B",
};

interface Props {
  refetchKey?: number;
}

const pct = (count: number, total: number) =>
  total > 0 ? Math.round((count / total) * 100) : 0;

export default function SlaOverviewCard({ refetchKey = 0 }: Props) {
  const { isDark } = useTheme();

  // Global date range will be wired here later; defaulting to last 7 days for now
  const { from, to } = useMemo(() => ({
    from: dayjs().subtract(6, "day").startOf("day").toISOString(),
    to:   dayjs().endOf("day").toISOString(),
  }), []);

  const [visibleCols, setVisibleCols] = useState<ColKey[]>(DEFAULT_COLS);
  const [page,        setPage]        = useState(0);
  const [pageSize,    setPageSize]    = useState(10);
  const [sortBy,      setSortBy]      = useState<SortField>("resolutionPercent");
  const [sortDir,     setSortDir]     = useState<"asc" | "desc">("desc");

  const { data, isLoading } = useSlaOverview(from, to, refetchKey);

  const chartData = useMemo(() => {
    if (!data) return [];
    const total = data.total ?? 0;
    return [
      {
        name: "Response",
        "In Progress": pct(data.responseInProgress, total),
        "Done": pct(data.responseDoneInTime, total),
        "Missed":       pct(data.responseMissed, total),
      },
      {
        name: "Resolution",
        "In Progress": pct(data.resolutionInProgress, total),
        "Done": pct(data.resolutionDoneInTime, total),
        "Missed":       pct(data.resolutionMissed, total),
      },
    ];
  }, [data]);

  const tableParams = useMemo<FilterTicketRequest>(() => ({
    page, size: pageSize,
    sortBy,
    sortDir,
  }), [page, pageSize, sortBy, sortDir]);

  const { data: pageData, isFetching } = useTicketList(tableParams);
  const tickets = pageData?.content ?? [];
  const total   = pageData?.totalElements ?? 0;

  const handleColToggle = (key: ColKey, checked: boolean) => {
    setVisibleCols(
      checked
        ? ALL_COL_KEYS.filter((k) => visibleCols.includes(k) || k === key)
        : visibleCols.filter((k) => k !== key),
    );
  };

  const colKeyToSortBy = (key: ColKey): SortField =>
    key === "slaPercent" ? "resolutionPercent" : key as SortField;

  const sortOrderFor = (key: ColKey) => {
    if (sortBy !== colKeyToSortBy(key)) return null;
    return sortDir === "asc" ? ("ascend" as const) : ("descend" as const);
  };

  const tooltipStyle = {
    backgroundColor: isDark ? "#041428" : "#E8EAED",
    border: `1px solid ${isDark ? "rgba(0,207,255,0.35)" : "rgba(0,102,187,0.35)"}`,
    color: isDark ? "#C8F0FF" : "#0A2540",
  };

  const colDefs: Record<ColKey, ColumnsType<TicketSla>[0]> = {
    id: {
      title: "ID", dataIndex: "id", key: "id", width: 80,
      sorter: true, sortOrder: sortOrderFor("id"),
    },
    summary: {
      title: "Summary", dataIndex: "summary", key: "summary", ellipsis: true, width: 200,
      sorter: true, sortOrder: sortOrderFor("summary"),
    },
    status: {
      title: "Status", key: "status", width: 120,
      sorter: true, sortOrder: sortOrderFor("status"),
      render: (_, r) => <Tag color={r.status?.color}>{r.status?.name}</Tag>,
    },
    issueType: {
      title: "Issue Type", key: "issueType", width: 130,
      sorter: true, sortOrder: sortOrderFor("issueType"),
      render: (_, r) => r.issueType?.name ?? "-",
    },
    project: {
      title: "Project", key: "project", width: 130,
      sorter: true, sortOrder: sortOrderFor("project"),
      render: (_, r) => r.project?.name ?? "-",
    },
    priority: {
      title: "Priority", key: "priority", width: 100,
      sorter: true, sortOrder: sortOrderFor("priority"),
      render: (_, r) => r.priority?.name ?? "-",
    },
    assignee: {
      title: "Assignee", key: "assignee", width: 130,
      sorter: true, sortOrder: sortOrderFor("assignee"),
      render: (_, r) => r.assignee?.name ?? "-",
    },
    slaPercent: {
      title: "SLA %", key: "slaPercent", width: 150,
      sorter: true, sortOrder: sortOrderFor("slaPercent"),
      render: (_, r) => {
        const p = r.sla?.status?.resolutionPercent;
        if (p == null) return <span className="text-gray-400 text-xs">—</span>;
        const overdue = r.sla?.status?.isResolutionOverdue ?? false;
        const clamped = Math.min(Math.round(p), 100);
        const stroke  = overdue || p >= 100 ? "#ff4d4f" : p >= 80 ? "#faad14" : "#52c41a";
        return (
          <Progress
            percent={clamped} size="small" strokeColor={stroke}
            format={(v) => <span className="text-[11px]">{v}%</span>}
          />
        );
      },
    },
    response: {
      title: "Response", key: "response", width: 200,
      render: (_, r) => r.sla ? <DeadlineTag createdAt={r.createdAt} sla={r.sla} type="response" /> : "-",
    },
    resolution: {
      title: "Resolution", key: "resolution", width: 200,
      render: (_, r) => r.sla ? <DeadlineTag createdAt={r.createdAt} sla={r.sla} type="resolution" /> : "-",
    },
  };

  const columns = visibleCols.map((k) => colDefs[k]);

  const colTogglePopover = (
    <Popover
      trigger="click"
      content={
        <div className="flex flex-col gap-2 min-w-[140px] py-1">
          {ALL_COL_KEYS.map((k) => (
            <Checkbox
              key={k}
              checked={visibleCols.includes(k)}
              onChange={(e) => handleColToggle(k, e.target.checked)}
            >
              {COL_LABELS[k]}
            </Checkbox>
          ))}
        </div>
      }
    >
      <Button icon={<SettingOutlined />} size="small">Columns</Button>
    </Popover>
  );

  return (
    <Card
      title="SLA Overview"
      extra={colTogglePopover}
      className="min-w-0"
    >
      <div className="flex gap-4 min-h-[420px]">

        {/* Left — stacked bar chart */}
        <div className="w-[32%] shrink-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[380px]">
              <Spin />
            </div>
          ) : !data || data.total === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[380px] text-gray-400 text-sm">
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                barSize={64}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fill: isDark ? "rgba(240,240,240,0.6)" : "rgba(0,0,0,0.65)", fontSize: 13 }}
                />
                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fill: isDark ? "rgba(240,240,240,0.5)" : "rgba(0,0,0,0.45)", fontSize: 11 }}
                />
                <Tooltip
                  formatter={(v, name) => [`${v}%`, name]}
                  contentStyle={tooltipStyle}
                />
                <Legend />
                {(Object.keys(SLA_COLORS) as (keyof typeof SLA_COLORS)[]).map((key) => (
                  <Bar key={key} dataKey={key} stackId="sla" fill={SLA_COLORS[key]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right — ticket table */}
        <div className="flex-1 min-w-0">
          <Table<TicketSla>
            columns={columns}
            dataSource={tickets}
            rowKey="id"
            loading={isFetching}
            size="small"
            scroll={{ x: "max-content" }}
            onChange={(pagination, _, sorter) => {
              const s = Array.isArray(sorter) ? sorter[0] : sorter;
              if (s?.columnKey && s.order) {
                setSortBy(colKeyToSortBy(s.columnKey as ColKey));
                setSortDir(s.order === "ascend" ? "asc" : "desc");
              } else {
                setSortBy("resolutionPercent");
                setSortDir("desc");
              }
              setPage((pagination.current ?? 1) - 1);
              setPageSize(pagination.pageSize ?? 10);
            }}
            pagination={{
              current:         page + 1,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal:       (t) => `${t} tickets`,
              size:            "small",
            }}
          />
        </div>

      </div>
    </Card>
  );
}
