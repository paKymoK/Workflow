import { useState, useMemo } from "react";
import { Card, Table, Button, Tag, Checkbox, Popover, Progress, Select, Spin, DatePicker } from "antd";
import { ArrowLeftOutlined, SettingOutlined } from "@ant-design/icons";
import { Icon } from "../ui/Icon";
import { StatusChip } from "../ui/StatusChip";
import { SquareAvatar } from "../ui/SquareAvatar";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { ColumnsType } from "antd/es/table";
import type { ApplicationTicketStatistic, ApplicationTrendPoint, TicketSla } from "../../api/types.ts";
import type { FilterTicketRequest } from "../../api/ticketApi.ts";
import { useTicketByApplication, useTicketByApplicationTrend } from "../../hooks/useStatistics";
import { useTicketList } from "../../hooks/useTickets";
import DeadlineTag from "../DeadlineTag.tsx";
import { useTheme } from "@takypok/shared";
import dayjs, { type Dayjs } from "dayjs";

const LINE_COLORS = [
  "#FFE500", "#00F5FF", "#FF2D6B", "#FF6B35",
  "#A855F7", "#22D3EE", "#10B981", "#F59E0B", "#6366F1", "#EC4899",
];

const STATUS_GROUPS = ["TODO", "PROCESSING", "DONE"] as const;
type StatusGroup = typeof STATUS_GROUPS[number];

const STATUS_OPTIONS = [
  { label: "Todo",        value: "TODO"       },
  { label: "In Progress", value: "PROCESSING" },
  { label: "Done",        value: "DONE"       },
];

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

type Granularity = "daily" | "weekly";

function buildChartData(
  rawPoints: ApplicationTrendPoint[],
  selectedGroups: StatusGroup[],
  granularity: Granularity,
): { date: string; [app: string]: number | string }[] {
  if (!rawPoints.length) return [];

  const apps = [...new Set(rawPoints.map((p) => p.application))];

  const bucketKey   = (d: string) => granularity === "weekly"
    ? dayjs(d).startOf("week").toISOString()
    : d;
  const bucketLabel = (k: string) => granularity === "weekly"
    ? `W${dayjs(k).format("ww")} ${dayjs(k).format("MM/DD")}`
    : dayjs(k).format("MM/DD");

  const buckets = new Map<string, Map<string, number>>();
  for (const p of rawPoints) {
    if (!selectedGroups.includes(p.statusGroup as StatusGroup)) continue;
    const bk = bucketKey(p.date);
    if (!buckets.has(bk)) buckets.set(bk, new Map());
    const m = buckets.get(bk)!;
    m.set(p.application, (m.get(p.application) ?? 0) + p.count);
  }

  return [...buckets.keys()].sort().map((key) => {
    const row: { date: string; [app: string]: number | string } = { date: bucketLabel(key) };
    const m = buckets.get(key)!;
    for (const app of apps) row[app] = m.get(app) ?? 0;
    return row;
  });
}

interface Props {
  refetchKey?: number;
}

export default function ApplicationHealthCard({ refetchKey = 0 }: Props) {
  const { isDark } = useTheme();

  const [granularity, setGranularity] = useState<Granularity>("daily");
  const defaultRange = useMemo<[Dayjs, Dayjs]>(() => [
    dayjs().subtract(6, "day").startOf("day"),
    dayjs().endOf("day"),
  ], []);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(defaultRange);
  const from = dateRange[0].toISOString();
  const to   = dateRange[1].toISOString();

  const [selectedGroups, setSelectedGroups] = useState<StatusGroup[]>([...STATUS_GROUPS]);
  const [selectedApp,    setSelectedApp]    = useState<string | null>(null);
  const [visibleCols,    setVisibleCols]    = useState<ColKey[]>(DEFAULT_COLS);
  const [page,           setPage]           = useState(0);
  const [pageSize,       setPageSize]       = useState(10);
  const [sortBy,         setSortBy]         = useState<SortField>("resolutionPercent");
  const [sortDir,        setSortDir]        = useState<"asc" | "desc">("desc");

  const { data: trendData, isLoading: trendLoading } = useTicketByApplicationTrend(from, to, refetchKey);
  const { data: appData,   isLoading: appLoading    } = useTicketByApplication(from, to, refetchKey);

  const apps = useMemo(
    () => [...new Set((trendData ?? []).map((p) => p.application))],
    [trendData],
  );

  const chartData = useMemo(
    () => buildChartData(trendData ?? [], selectedGroups, granularity),
    [trendData, selectedGroups, granularity],
  );

  const tableParams = useMemo<FilterTicketRequest>(() => ({
    page, size: pageSize,
    application: selectedApp ?? undefined,
    sortBy,
    sortDir,
  }), [page, pageSize, selectedApp, sortBy, sortDir]);

  const { data: pageData, isFetching } = useTicketList(tableParams, { enabled: selectedApp !== null });
  const tickets     = pageData?.content ?? [];
  const totalTickets = pageData?.totalElements ?? 0;

  const handleLegendClick = (e: { value?: string }) => {
    const app = e?.value;
    if (typeof app === "string") {
      setSelectedApp((prev) => prev === app ? null : app);
      setPage(0);
    }
  };

  const handleBack = () => {
    setSelectedApp(null);
    setPage(0);
  };

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
      title: "Summary", key: "summary", ellipsis: true, width: 200,
      sorter: true, sortOrder: sortOrderFor("summary"),
      render: (_, r) => (
        <div className="flex items-center gap-1.5">
          {r.sla?.isPaused && <Icon name="pause" size={11} className="shrink-0 text-[var(--acc-amber)]" />}
          {r.summary}
        </div>
      ),
    },
    status: {
      title: "Status", key: "status", width: 130,
      sorter: true, sortOrder: sortOrderFor("status"),
      render: (_, r) => r.status ? <StatusChip color={r.status.color} name={r.status.name} small /> : "-",
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
      title: "Assignee", key: "assignee", width: 160,
      sorter: true, sortOrder: sortOrderFor("assignee"),
      render: (_, r) => r.assignee?.name
        ? <div className="flex items-center gap-2"><SquareAvatar name={r.assignee.name} size={22} /><span>{r.assignee.name}</span></div>
        : "-",
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
          onClick={() => { setSelectedApp(v); setPage(0); }}
        >
          {v}
        </span>
      ),
    },
    { title: "Open",         dataIndex: "open",        key: "open",        width: 70,  render: (v: number) => <span className="text-[#FF2D6B] font-semibold">{v}</span> },
    { title: "In Progress",  dataIndex: "inProgress",  key: "inProgress",  width: 90,  render: (v: number) => <span className="text-[#FFE500] font-semibold">{v}</span> },
    { title: "Done",         dataIndex: "done",        key: "done",        width: 70,  render: (v: number) => <span className="text-[#00F5FF] font-semibold">{v}</span> },
    { title: "Total",        dataIndex: "total",       key: "total",       width: 70  },
    { title: "SLA Breached", dataIndex: "slaBreached", key: "slaBreached", width: 100, render: (v: number) => v > 0 ? <Tag color="red">{v}</Tag> : <span className="text-gray-400">0</span> },
  ];

  const cardTitle = selectedApp !== null
    ? <span>Application Health — <span className="text-[var(--acc-1)]">{selectedApp}</span></span>
    : (
      <span className="flex items-center gap-2">
        <Icon name="pin" size={14} className="text-[var(--acc-2)] opacity-80" />
        Application Health
      </span>
    );

  const cardExtra = (
    <div className="flex items-center gap-2">
      {selectedApp !== null && (
        <Button icon={<ArrowLeftOutlined />} size="small" onClick={handleBack}>Back</Button>
      )}
      {selectedApp !== null && colTogglePopover}
      <Select
        mode="multiple"
        size="small"
        maxTagCount={1}
        placeholder="Status"
        value={selectedGroups}
        onChange={(v) => setSelectedGroups(v.length ? v as StatusGroup[] : [...STATUS_GROUPS])}
        options={STATUS_OPTIONS}
        className="!min-w-[130px]"
        allowClear={false}
      />
      <Select
        size="small"
        value={granularity}
        onChange={(v: Granularity) => {
          setGranularity(v);
          setDateRange(v === "weekly"
            ? [dayjs().subtract(3, "week").startOf("week"), dayjs().endOf("week")]
            : [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")],
          );
          setSelectedApp(null);
          setPage(0);
        }}
        options={[
          { label: "Daily",  value: "daily"  },
          { label: "Weekly", value: "weekly" },
        ]}
        className="!min-w-[90px]"
      />
      <DatePicker.RangePicker
        size="small"
        picker={granularity === "weekly" ? "week" : "date"}
        value={dateRange}
        onChange={(v) => {
          if (v?.[0] && v?.[1]) {
            setDateRange([
              v[0].startOf(granularity === "weekly" ? "week" : "day"),
              v[1].endOf(granularity === "weekly" ? "week" : "day"),
            ]);
            setSelectedApp(null);
            setPage(0);
          }
        }}
        allowClear={false}
        format={granularity === "weekly" ? undefined : "DD/MM/YYYY"}
      />
    </div>
  );

  return (
    <Card title={cardTitle} extra={cardExtra} className="min-w-0">
      <div className="flex flex-col gap-6">

        {/* Line chart — full width */}
        {trendLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Spin />
          </div>
        ) : !chartData.length ? (
          <div className="flex items-center justify-center min-h-[300px] text-gray-400 text-sm">
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: isDark ? "rgba(240,240,240,0.6)" : "rgba(0,0,0,0.65)", fontSize: 12 }}
              />
              <YAxis
                tick={{ fill: isDark ? "rgba(240,240,240,0.5)" : "rgba(0,0,0,0.45)", fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                onClick={handleLegendClick}
                formatter={(value) => (
                  <span
                    className={`cursor-pointer ${selectedApp === null || selectedApp === value ? "opacity-100" : "opacity-40"}`}
                  >
                    {value}
                  </span>
                )}
              />
              {apps.map((app, i) => (
                <Line
                  key={app}
                  type="natural"
                  dataKey={app}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={selectedApp === null || selectedApp === app ? 2 : 1}
                  dot={false}
                  opacity={selectedApp === null || selectedApp === app ? 1 : 0.25}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* Table — summary or drill-down */}
        <div className="min-w-0">
          {selectedApp === null ? (
            <Table<ApplicationTicketStatistic>
              columns={summaryColumns}
              dataSource={appData ?? []}
              rowKey="application"
              loading={appLoading}
              size="small"
              scroll={{ x: "max-content" }}
              pagination={false}
              onRow={(row) => ({
                onClick: () => { setSelectedApp(row.application); setPage(0); },
                className: "cursor-pointer",
              })}
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
