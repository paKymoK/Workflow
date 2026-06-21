import { useState, useMemo } from "react";
import { Card, Table, Button, Checkbox, Popover, Progress, Spin } from "antd";
import { ArrowLeftOutlined, SettingOutlined } from "@ant-design/icons";
import { Icon } from "../ui/Icon";
import { StatusChip } from "../ui/StatusChip";
import { SquareAvatar } from "../ui/SquareAvatar";
import { DatePicker } from "antd";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend, ResponsiveContainer,
} from "recharts";
import type { ColumnsType } from "antd/es/table";
import type { AvgResolutionByPriority, TicketSla } from "../../api/types.ts";
import type { FilterTicketRequest } from "../../api/ticketApi.ts";
import { useAvgResolutionByPriority } from "../../hooks/useStatistics";
import { useTicketList } from "../../hooks/useTickets";
import DeadlineTag from "../DeadlineTag.tsx";
import { useTheme } from "@takypok/shared";
import dayjs, { type Dayjs } from "dayjs";

const COLOR_RESOLUTION = "#00F5FF";
const COLOR_RESPONSE   = "#FFE500";
const DIM_RESOLUTION   = "rgba(0,245,255,0.35)";
const DIM_RESPONSE     = "rgba(255,229,0,0.35)";

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

const summaryColumns: ColumnsType<AvgResolutionByPriority> = [
  { title: "Priority", dataIndex: "priorityName", key: "priorityName" },
  {
    title: "Avg First Response",
    dataIndex: "avgResponseHours",
    key: "avgResponseHours",
    render: (v: number | null) =>
      v != null
        ? <span className="font-semibold text-[#FFE500]">{v.toFixed(1)}h</span>
        : <span className="text-gray-400 text-xs">—</span>,
  },
  {
    title: "Avg Resolution Time",
    dataIndex: "avgHours",
    key: "avgHours",
    render: (v: number | null) =>
      v != null
        ? <span className="font-semibold text-[#00F5FF]">{v.toFixed(1)}h</span>
        : <span className="text-gray-400 text-xs">—</span>,
  },
  {
    title: "Total Tickets",
    dataIndex: "count",
    key: "count",
    render: (v: number) => <span className="font-semibold">{v}</span>,
  },
];

interface CustomTooltipProps {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  isDark: boolean;
}

function CustomTooltip({ active, payload, isDark }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as AvgResolutionByPriority;
  return (
    <div
      className={`rounded px-3 py-2 text-sm ${isDark ? "bg-[#041428] text-[#C8F0FF] [border:1px_solid_rgba(0,207,255,0.35)]" : "bg-[#E8EAED] text-[#0A2540] [border:1px_solid_rgba(0,102,187,0.35)]"}`}
    >
      <div className="font-semibold mb-1">{d.priorityName}</div>
      <div>
        Response:{" "}
        <span className="text-[#FFE500] font-semibold">
          {d.avgResponseHours != null ? `${d.avgResponseHours.toFixed(2)}h` : "—"}
        </span>
      </div>
      <div>
        Resolution:{" "}
        <span className="text-[#00F5FF] font-semibold">
          {d.avgHours != null ? `${d.avgHours.toFixed(2)}h` : "—"}
        </span>
      </div>
      <div>Total: <span className="font-semibold">{d.count}</span></div>
    </div>
  );
}

interface Props {
  refetchKey?: number;
}

export default function AvgResolutionCard({ refetchKey = 0 }: Props) {
  const { isDark } = useTheme();

  const defaultRange = useMemo<[Dayjs, Dayjs]>(() => [
    dayjs().subtract(6, "day").startOf("day"),
    dayjs().endOf("day"),
  ], []);

  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(defaultRange);
  const from = dateRange[0].toISOString();
  const to   = dateRange[1].toISOString();

  const [selectedPriority, setSelectedPriority] = useState<AvgResolutionByPriority | null>(null);
  const [visibleCols,      setVisibleCols]       = useState<ColKey[]>(DEFAULT_COLS);
  const [page,             setPage]              = useState(0);
  const [pageSize,         setPageSize]          = useState(10);
  const [sortBy,           setSortBy]            = useState<SortField>("resolutionPercent");
  const [sortDir,          setSortDir]           = useState<"asc" | "desc">("desc");

  const { data: resolutionData, isLoading } = useAvgResolutionByPriority(from, to, refetchKey);

  const tableParams = useMemo<FilterTicketRequest>(() => ({
    page,
    size: pageSize,
    priorityId: selectedPriority?.priorityId,
    sortBy,
    sortDir,
  }), [page, pageSize, selectedPriority, sortBy, sortDir]);

  const { data: pageData, isFetching } = useTicketList(tableParams, { enabled: selectedPriority !== null });
  const tickets      = pageData?.content ?? [];
  const totalTickets = pageData?.totalElements ?? 0;

  const handleBarClick = (entry: AvgResolutionByPriority) => {
    setSelectedPriority((prev) => prev?.priorityId === entry.priorityId ? null : entry);
    setPage(0);
  };

  const handleBack = () => {
    setSelectedPriority(null);
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

  const cardTitle = selectedPriority !== null
    ? <span>Avg Resolve Time — <span className="text-[var(--acc-1)]">{selectedPriority.priorityName}</span></span>
    : (
      <span className="flex items-center gap-2">
        <Icon name="clock" size={14} className="text-[var(--acc-1)] opacity-80" />
        Average Ticket Resolve Time
      </span>
    );

  const cardExtra = (
    <div className="flex items-center gap-2">
      {selectedPriority !== null && (
        <Button icon={<ArrowLeftOutlined />} size="small" onClick={handleBack}>Back</Button>
      )}
      {selectedPriority !== null && colTogglePopover}
      <DatePicker.RangePicker
        size="small"
        value={dateRange}
        onChange={(v) => {
          if (v?.[0] && v?.[1]) {
            setDateRange([v[0], v[1]]);
            setSelectedPriority(null);
            setPage(0);
          }
        }}
        allowClear={false}
        format="DD/MM/YYYY"
      />
    </div>
  );

  return (
    <Card title={cardTitle} extra={cardExtra} className="min-w-0">
      <div className="flex flex-col gap-6">

        {/* Bar chart */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Spin />
          </div>
        ) : !resolutionData?.length ? (
          <div className="flex items-center justify-center min-h-[300px] text-gray-400 text-sm">
            No resolved tickets in this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={resolutionData}
              margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
              className="cursor-pointer"
            >
              <XAxis
                dataKey="priorityName"
                tick={{ fill: isDark ? "rgba(240,240,240,0.6)" : "rgba(0,0,0,0.65)", fontSize: 12 }}
              />
              <YAxis
                unit="h"
                tick={{ fill: isDark ? "rgba(240,240,240,0.5)" : "rgba(0,0,0,0.45)", fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Legend
                formatter={(value) => (
                  <span className={`text-[12px] ${isDark ? "text-[rgba(240,240,240,0.7)]" : "text-[rgba(0,0,0,0.65)]"}`}>
                    {value}
                  </span>
                )}
              />
              <Bar dataKey="avgResponseHours" name="Avg First Response (h)" fill={COLOR_RESPONSE} radius={[4, 4, 0, 0]} onClick={(data) => handleBarClick(data as unknown as AvgResolutionByPriority)}>
                {resolutionData.map((entry) => (
                  <Cell
                    key={`resp-${entry.priorityId}`}
                    fill={selectedPriority === null || selectedPriority.priorityId === entry.priorityId
                      ? COLOR_RESPONSE
                      : DIM_RESPONSE}
                  />
                ))}
              </Bar>
              <Bar dataKey="avgHours" name="Avg Resolution (h)" fill={COLOR_RESOLUTION} radius={[4, 4, 0, 0]} onClick={(data) => handleBarClick(data as unknown as AvgResolutionByPriority)}>
                {resolutionData.map((entry) => (
                  <Cell
                    key={`res-${entry.priorityId}`}
                    fill={selectedPriority === null || selectedPriority.priorityId === entry.priorityId
                      ? COLOR_RESOLUTION
                      : DIM_RESOLUTION}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Table */}
        <div className="min-w-0">
          {selectedPriority === null ? (
            <Table<AvgResolutionByPriority>
              columns={summaryColumns}
              dataSource={resolutionData ?? []}
              rowKey="priorityId"
              loading={isLoading}
              size="small"
              pagination={false}
              onRow={(row) => ({
                onClick: () => { setSelectedPriority(row); setPage(0); },
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
