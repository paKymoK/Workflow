import { useState, useMemo } from "react";
import { Card, Table, Button, Tag, Checkbox, Popover, Progress, Spin } from "antd";
import { ArrowLeftOutlined, SettingOutlined } from "@ant-design/icons";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import type { ColumnsType } from "antd/es/table";
import type { ApplicationTicketStatistic, TicketSla } from "../../api/types.ts";
import type { FilterTicketRequest } from "../../api/ticketApi.ts";
import { useTicketByApplication } from "../../hooks/useStatistics";
import { useTicketList } from "../../hooks/useTickets";
import DeadlineTag from "../DeadlineTag.tsx";
import { useTheme } from "@takypok/shared";
import dayjs from "dayjs";

const APP_COLORS = {
  Open:        "#FF2D6B",
  "In Progress": "#FFE500",
  Done:        "#00F5FF",
};

type ColKey =
  | "id" | "summary" | "status" | "issueType" | "priority"
  | "assignee" | "slaPercent" | "response" | "resolution";

type SortField = FilterTicketRequest["sortBy"];

const ALL_COL_KEYS: ColKey[] = [
  "id", "summary", "status", "issueType", "priority",
  "assignee", "slaPercent", "response", "resolution",
];

const COL_LABELS: Record<ColKey, string> = {
  id: "ID", summary: "Summary", status: "Status", issueType: "Issue Type",
  priority: "Priority", assignee: "Assignee",
  slaPercent: "SLA %", response: "Response", resolution: "Resolution",
};

const DEFAULT_COLS: ColKey[] = ["id", "summary", "priority", "slaPercent", "response", "resolution"];

interface Props {
  refetchKey?: number;
}

export default function ApplicationHealthCard({ refetchKey = 0 }: Props) {
  const { isDark } = useTheme();

  const { from, to } = useMemo(() => ({
    from: dayjs().subtract(6, "day").startOf("day").toISOString(),
    to:   dayjs().endOf("day").toISOString(),
  }), []);

  const [selectedApp,  setSelectedApp]  = useState<string | null>(null);
  const [visibleCols,  setVisibleCols]  = useState<ColKey[]>(DEFAULT_COLS);
  const [page,         setPage]         = useState(0);
  const [pageSize,     setPageSize]     = useState(10);
  const [sortBy,       setSortBy]       = useState<SortField>("resolutionPercent");
  const [sortDir,      setSortDir]      = useState<"asc" | "desc">("desc");

  const { data: appData, isLoading } = useTicketByApplication(from, to, refetchKey);

  const chartData = useMemo(() => {
    if (!appData) return [];
    return appData.map((row) => ({
      name:          row.application,
      Open:          row.open,
      "In Progress": row.inProgress,
      Done:          row.done,
      _raw:          row,
    }));
  }, [appData]);

  const handleBarClick = (data: { name?: string }) => {
    if (data?.name) {
      setSelectedApp(data.name);
      setPage(0);
    }
  };

  const handleRowClick = (row: ApplicationTicketStatistic) => {
    setSelectedApp(row.application);
    setPage(0);
  };

  const handleBack = () => {
    setSelectedApp(null);
    setPage(0);
  };

  // Drill-down ticket table params
  const tableParams = useMemo<FilterTicketRequest>(() => ({
    page, size: pageSize,
    application: selectedApp ?? undefined,
    sortBy,
    sortDir,
  }), [page, pageSize, selectedApp, sortBy, sortDir]);

  const { data: pageData, isFetching } = useTicketList(tableParams, { enabled: selectedApp !== null });
  const tickets = pageData?.content ?? [];
  const totalTickets = pageData?.totalElements ?? 0;

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

  const drillColumns = visibleCols.map((k) => colDefs[k]);

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

  const summaryColumns: ColumnsType<ApplicationTicketStatistic> = [
    {
      title: "Application", dataIndex: "application", key: "application", ellipsis: true,
      render: (v: string) => (
        <span
          className="cursor-pointer font-medium hover:underline"
          onClick={() => handleRowClick({ application: v } as ApplicationTicketStatistic)}
        >
          {v}
        </span>
      ),
    },
    { title: "Open",        dataIndex: "open",        key: "open",        width: 70,  render: (v: number) => <span className="text-[#FF2D6B] font-semibold">{v}</span> },
    { title: "In Progress", dataIndex: "inProgress",  key: "inProgress",  width: 90,  render: (v: number) => <span className="text-[#FFE500] font-semibold">{v}</span> },
    { title: "Done",        dataIndex: "done",        key: "done",        width: 70,  render: (v: number) => <span className="text-[#00F5FF] font-semibold">{v}</span> },
    { title: "Total",       dataIndex: "total",       key: "total",       width: 70  },
    { title: "SLA Breached",dataIndex: "slaBreached", key: "slaBreached", width: 100, render: (v: number) => v > 0 ? <Tag color="red">{v}</Tag> : <span className="text-gray-400">0</span> },
  ];

  const cardExtra = selectedApp !== null ? (
    <div className="flex items-center gap-2">
      <Button icon={<ArrowLeftOutlined />} size="small" onClick={handleBack}>Back</Button>
      {colTogglePopover}
    </div>
  ) : null;

  const cardTitle = selectedApp !== null
    ? <span>Application Health — <span className="text-[#00F5FF]">{selectedApp}</span></span>
    : "Application Health";

  return (
    <Card title={cardTitle} extra={cardExtra} className="min-w-0">
      <div className="flex flex-col gap-6">

        {/* Top — full-width horizontal stacked bar chart */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Spin />
          </div>
        ) : !chartData.length ? (
          <div className="flex items-center justify-center min-h-[300px] text-gray-400 text-sm">
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 36 + 60)}>
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              barSize={20}
              onClick={(e) => {
                const name = e?.activeLabel;
                if (typeof name === "string") handleBarClick({ name });
              }}
            >
              <XAxis
                type="number"
                tick={{ fill: isDark ? "rgba(240,240,240,0.5)" : "rgba(0,0,0,0.45)", fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fill: isDark ? "rgba(240,240,240,0.6)" : "rgba(0,0,0,0.65)", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
              />
              <Legend />
              {(Object.keys(APP_COLORS) as (keyof typeof APP_COLORS)[]).map((key) => (
                <Bar key={key} dataKey={key} stackId="app" fill={APP_COLORS[key]} className="cursor-pointer">
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={APP_COLORS[key]}
                      opacity={selectedApp === null || selectedApp === entry.name ? 1 : 0.35}
                    />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Bottom — summary or drill-down table */}
        <div className="min-w-0">
          {selectedApp === null ? (
            <Table<ApplicationTicketStatistic>
              columns={summaryColumns}
              dataSource={appData ?? []}
              rowKey="application"
              loading={isLoading}
              size="small"
              scroll={{ x: "max-content" }}
              pagination={false}
              onRow={(row) => ({ onClick: () => handleRowClick(row), className: "cursor-pointer" })}
            />
          ) : (
            <Table<TicketSla>
              columns={drillColumns}
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
                total:           totalTickets,
                showSizeChanger: true,
                showTotal:       (t) => `${t} tickets`,
                size:            "small",
              }}
            />
          )}
        </div>

      </div>
    </Card>
  );
}
