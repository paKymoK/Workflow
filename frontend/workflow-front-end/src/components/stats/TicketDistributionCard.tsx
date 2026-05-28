import { useState, useMemo } from "react";
import { Card, Table, Checkbox, Button, Popover, Progress, Tag, Spin } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { ColumnsType } from "antd/es/table";
import type { TicketSla } from "../../api/types.ts";
import type { FilterTicketRequest } from "../../api/ticketApi.ts";
import { useOverviewStatistic, useTicketByIssueType, useTicketByProject } from "../../hooks/useStatistics";
import { useTicketList, useStatuses, useProjects, useAllIssueTypes } from "../../hooks/useTickets";
import DeadlineTag from "../DeadlineTag.tsx";
import { useTheme } from "@takypok/shared";
import dayjs from "dayjs";

const COLORS = ["#FFE500", "#FF2D6B", "#00F5FF", "#FF6B35", "#A855F7", "#22D3EE"];

type Tab = "status" | "issueType" | "project";
type SortField = FilterTicketRequest["sortBy"];
type ColKey =
  | "id" | "summary" | "status" | "issueType" | "project"
  | "priority" | "assignee" | "slaPercent" | "response" | "resolution";

const ALL_COL_KEYS: ColKey[] = [
  "id", "summary", "status", "issueType", "project",
  "priority", "assignee", "slaPercent", "response", "resolution",
];

const COL_LABELS: Record<ColKey, string> = {
  id: "ID", summary: "Summary", status: "Status", issueType: "Issue Type",
  project: "Project", priority: "Priority", assignee: "Assignee",
  slaPercent: "SLA %", response: "Response", resolution: "Resolution",
};

const DEFAULT_COLS: Record<Tab, ColKey[]> = {
  status:    ["id", "summary", "status",    "slaPercent"],
  issueType: ["id", "summary", "issueType", "slaPercent"],
  project:   ["id", "summary", "project",   "slaPercent"],
};

const TAB_ITEMS = [
  { key: "status",    tab: "Status" },
  { key: "issueType", tab: "Issue Type" },
  { key: "project",   tab: "Project" },
];

interface Props {
  refetchKey?: number;
}

export default function TicketDistributionCard({ refetchKey = 0 }: Props) {
  const { isDark } = useTheme();

  // Global date range will be wired here later; defaulting to last 7 days for now
  const { from, to } = useMemo(() => ({
    from: dayjs().subtract(6, "day").startOf("day").toISOString(),
    to:   dayjs().endOf("day").toISOString(),
  }), []);

  const [activeTab,     setActiveTab]     = useState<Tab>("status");
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null);
  const [visibleCols,   setVisibleCols]   = useState<ColKey[]>(DEFAULT_COLS.status);
  const [page,          setPage]          = useState(0);
  const [pageSize,      setPageSize]      = useState(10);
  const [sortBy,        setSortBy]        = useState<SortField | undefined>(undefined);
  const [sortDir,       setSortDir]       = useState<"asc" | "desc" | undefined>(undefined);

  // Reference data for name → id mapping when a slice is clicked
  const { data: statuses      = [] } = useStatuses();
  const { data: projects      = [] } = useProjects();
  const { data: allIssueTypes = [] } = useAllIssueTypes();

  // Aggregate stat data for each tab's donut
  const { data: statusStat,    isLoading: loadingStatus    } = useOverviewStatistic(from, to, refetchKey);
  const { data: issueTypeStat, isLoading: loadingIssueType } = useTicketByIssueType(from, to, refetchKey);
  const { data: projectStat,   isLoading: loadingProject   } = useTicketByProject(from, to, refetchKey);

  const donutData = useMemo(() => {
    if (activeTab === "status") {
      return (statusStat ?? []).map((s, i) => ({
        name: s.name, value: s.value, fill: COLORS[i % COLORS.length],
      }));
    }
    if (activeTab === "issueType") {
      return (issueTypeStat ?? []).map((row, i) => {
        const total = Object.entries(row)
          .filter(([k]) => k !== "name")
          .reduce((sum, [, v]) => sum + (typeof v === "number" ? v : 0), 0);
        return { name: row.name as string, value: total, fill: COLORS[i % COLORS.length] };
      });
    }
    return (projectStat ?? []).map((s, i) => ({
      name: s.name, value: s.value, fill: COLORS[i % COLORS.length],
    }));
  }, [activeTab, statusStat, issueTypeStat, projectStat]);

  const donutLoading =
    activeTab === "status"    ? loadingStatus :
    activeTab === "issueType" ? loadingIssueType :
    loadingProject;

  // Build table query params from current state
  const tableParams = useMemo<FilterTicketRequest>(() => {
    const p: FilterTicketRequest = {
      page, size: pageSize,
      ...(sortBy  && { sortBy }),
      ...(sortDir && { sortDir }),
    };
    if (selectedSlice) {
      if (activeTab === "status") {
        const match = statuses.find((s) => s.name === selectedSlice);
        if (match) p.statusId = match.id;
      } else if (activeTab === "issueType") {
        const match = allIssueTypes.find((t) => t.name === selectedSlice);
        if (match) p.issueTypeId = match.id;
      } else {
        const match = projects.find((pr) => pr.name === selectedSlice);
        if (match) p.projectId = match.id;
      }
    }
    return p;
  }, [page, pageSize, sortBy, sortDir, selectedSlice, activeTab, statuses, allIssueTypes, projects]);

  const { data: pageData, isFetching } = useTicketList(tableParams);
  const tickets = pageData?.content ?? [];
  const total   = pageData?.totalElements ?? 0;

  const handleTabChange = (key: string) => {
    setActiveTab(key as Tab);
    setSelectedSlice(null);
    setVisibleCols(DEFAULT_COLS[key as Tab]);
    setPage(0);
    setSortBy(undefined);
    setSortDir(undefined);
  };

  const handleSliceClick = (entry: { name?: string }) => {
    if (!entry.name) return;
    setSelectedSlice((prev) => (prev === entry.name ? null : entry.name!));
    setPage(0);
  };

  const handleColToggle = (key: ColKey, checked: boolean) => {
    setVisibleCols(
      checked
        ? ALL_COL_KEYS.filter((k) => visibleCols.includes(k) || k === key)
        : visibleCols.filter((k) => k !== key),
    );
  };

  const tooltipStyle = {
    backgroundColor: isDark ? "#041428" : "#E8EAED",
    border: `1px solid ${isDark ? "rgba(0,207,255,0.35)" : "rgba(0,102,187,0.35)"}`,
    color: isDark ? "#C8F0FF" : "#0A2540",
  };

  // Map column key → API sortBy value
  const colKeyToSortBy = (key: ColKey): SortField =>
    key === "slaPercent" ? "resolutionPercent" : key as SortField;

  const sortOrderFor = (key: ColKey) => {
    const apiKey = colKeyToSortBy(key);
    if (sortBy !== apiKey) return null;
    return sortDir === "asc" ? ("ascend" as const) : ("descend" as const);
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
        const pct = r.sla?.status?.resolutionPercent;
        if (pct == null) return <span className="text-gray-400 text-xs">—</span>;
        const overdue  = r.sla?.status?.isResolutionOverdue ?? false;
        const clamped  = Math.min(Math.round(pct), 100);
        const stroke   = overdue || pct >= 100 ? "#ff4d4f" : pct >= 80 ? "#faad14" : "#52c41a";
        return (
          <Progress
            percent={clamped} size="small" strokeColor={stroke}
            format={(p) => <span className="text-[11px]">{p}%</span>}
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
      tabList={TAB_ITEMS}
      activeTabKey={activeTab}
      onTabChange={handleTabChange}
      extra={colTogglePopover}
      className="min-w-0"
    >
      <div className="flex gap-4 min-h-[420px]">

        {/* Left — donut chart */}
        <div className="w-[32%] shrink-0">
          {donutLoading ? (
            <div className="flex items-center justify-center h-full min-h-[380px]">
              <Spin />
            </div>
          ) : donutData.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[380px] text-gray-400 text-sm">
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%" cy="45%"
                  innerRadius={65} outerRadius={105}
                  dataKey="value"
                  isAnimationActive={false}
                  onClick={handleSliceClick}
                  className="cursor-pointer"
                >
                  {donutData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.fill}
                      opacity={selectedSlice === null || selectedSlice === entry.name ? 1 : 0.25}
                      stroke={selectedSlice === entry.name ? "#fff" : "none"}
                      strokeWidth={selectedSlice === entry.name ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`${v} tickets`, "Count"]}
                  contentStyle={tooltipStyle}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right — ticket table */}
        <div className="flex-1 min-w-0">
          {selectedSlice && (
            <div className="mb-2 flex items-center gap-2 text-xs">
              <span className="opacity-60">Filtered by:</span>
              <Tag
                closable
                onClose={() => setSelectedSlice(null)}
                color="blue"
              >
                {selectedSlice}
              </Tag>
            </div>
          )}
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
                setSortBy(undefined);
                setSortDir(undefined);
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
