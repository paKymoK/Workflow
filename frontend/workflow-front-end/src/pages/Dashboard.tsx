import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useUrlState } from "@state";
import { Spin, Table, Tag, Button, Dropdown, message, Input, Select, Segmented } from "antd";
import { DownloadOutlined, UserOutlined, PauseCircleOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { useQueryClient } from "@tanstack/react-query";
import { fetchTicketById, exportTickets, fetchUsers, fetchUserBySub, type ExportTicketRequest, type UserSummary } from "../api/ticketApi";
import { wsBaseUrl } from "@takypok/shared";
import type { TicketSla, Priority, WorkflowStatus } from "../api/types.ts";
import {
  useTicketList,
  usePriorities,
  useStatuses,
  usePauseTicket,
  useResumeTicket,
  ticketKeys,
} from "../hooks/useTickets";
import type { FilterTicketRequest } from "../api/ticketApi";
import dayjs from "dayjs";
import SlaBar from "../components/dashboard/SlaBar";
import PriorityBars from "../components/dashboard/PriorityBars";
import InspectorDrawer from "../components/dashboard/InspectorDrawer";
import KanbanBoard from "../components/dashboard/KanbanBoard";
import SlaOverviewCard from "../components/stats/SlaOverviewCard";
import TicketDistributionCard from "../components/stats/TicketDistributionCard";
import KpiStrip from "../components/home/KpiStrip";

type Layout = "console" | "board" | "stream";

const LAYOUT_LABEL: Record<Layout, string> = {
  console: "// TICKET QUEUE",
  board:   "// MY BOARD",
  stream:  "// STREAM VIEW",
};

export default function Dashboard() {
  const navigate    = useNavigate();
  const qc          = useQueryClient();
  const token       = sessionStorage.getItem("access_token");

  const [layout, setLayout]           = useState<Layout>("console");
  const [inspectorId, setInspectorId] = useState<number | null>(null);

  // ── URL state ──────────────────────────────────────────
  const [page]        = useUrlState("page",    0);
  const [pageSize]    = useUrlState("size",    10);
  const [summary]     = useUrlState("q",       "");
  const [statusId]    = useUrlState<number | undefined>("status",   undefined);
  const [priorityId]  = useUrlState<number | undefined>("priority", undefined);
  const [assigneeSub] = useUrlState("assignee", "");
  const [sortBy]      = useUrlState<"resolutionPercent" | undefined>("sortBy",  undefined);
  const [sortDir]     = useUrlState<"asc" | "desc" | undefined>("sortDir", undefined);
  const [, setSearchParams] = useSearchParams();

  const setSearchParamsRef = useRef(setSearchParams);
  useEffect(() => { setSearchParamsRef.current = setSearchParams; });

  const [summaryInput, setSummaryInput] = useState(summary);
  useEffect(() => {
    const id = setTimeout(() => {
      setSearchParamsRef.current((prev) => {
        const p = new URLSearchParams(prev);
        const v = summaryInput.trim();
        if (v) p.set("q", JSON.stringify(v)); else p.delete("q");
        p.delete("page");
        return p;
      }, { replace: true });
    }, 1000);
    return () => clearTimeout(id);
  }, [summaryInput]);

  // ── Assignee autocomplete ────────────────────────────
  const [userQuery,        setUserQuery]        = useState("");
  const [userOptions,      setUserOptions]      = useState<{ value: string; label: string }[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  useEffect(() => {
    if (!assigneeSub) return;
    fetchUserBySub(assigneeSub).then((u: UserSummary | null) => {
      if (u) setUserOptions([{ value: u.sub, label: `${u.name} — ${u.email}` }]);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userQuery.trim()) { setUserOptions([]); return; }
    const id = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const users = await fetchUsers(userQuery);
        setUserOptions(users.map((u: UserSummary) => ({ value: u.sub, label: `${u.name} — ${u.email}` })));
      } finally {
        setIsSearchingUsers(false);
      }
    }, 400);
    return () => clearTimeout(id);
  }, [userQuery]);

  const handleAssigneeChange = (sub: string | undefined) => {
    setSearchParamsRef.current((prev) => {
      const p = new URLSearchParams(prev);
      if (sub) p.set("assignee", JSON.stringify(sub)); else p.delete("assignee");
      p.delete("page");
      return p;
    }, { replace: true });
  };

  // ── Export ───────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportParams: ExportTicketRequest = {
        ...(summary.trim()     && { summary: summary.trim() }),
        ...(statusId  != null  && { statusId }),
        ...(priorityId != null && { priorityId }),
        ...(assigneeSub.trim() && { assigneeSub: assigneeSub.trim() }),
      };
      await exportTickets(exportParams);
    } catch {
      message.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  // ── Query params ─────────────────────────────────────
  const params = useMemo<FilterTicketRequest>(() => ({
    page,
    size: pageSize,
    ...(summary.trim()     && { summary: summary.trim() }),
    ...(statusId  != null  && { statusId }),
    ...(priorityId != null && { priorityId }),
    ...(assigneeSub.trim() && { assigneeSub: assigneeSub.trim() }),
    ...(sortBy  != null && { sortBy }),
    ...(sortDir != null && { sortDir }),
  }), [page, pageSize, summary, statusId, priorityId, assigneeSub, sortBy, sortDir]);

  // ── Data ─────────────────────────────────────────────
  const { data: pageData, isFetching } = useTicketList(params);
  const { data: priorities = [] }      = usePriorities();
  const { data: statuses = [], isLoading: isStatusesLoading } = useStatuses();

  const tickets = useMemo(() => pageData?.content ?? [], [pageData]);
  const total   = pageData?.totalElements ?? 0;

  // ── Mutations ────────────────────────────────────────
  const pauseMutation  = usePauseTicket();
  const resumeMutation = useResumeTicket();

  const [actionLoadingIds, setActionLoadingIds] = useState<Set<string | number>>(new Set());

  const handlePause = useCallback(async (id: string | number) => {
    setActionLoadingIds((prev) => new Set(prev).add(id));
    try { await pauseMutation.mutateAsync(id); }
    catch { message.error("Failed to pause ticket"); }
    finally { setActionLoadingIds((prev) => { const n = new Set(prev); n.delete(id); return n; }); }
  }, [pauseMutation]);

  const handleResume = useCallback(async (id: string | number) => {
    setActionLoadingIds((prev) => new Set(prev).add(id));
    try { await resumeMutation.mutateAsync(id); }
    catch { message.error("Failed to resume ticket"); }
    finally { setActionLoadingIds((prev) => { const n = new Set(prev); n.delete(id); return n; }); }
  }, [resumeMutation]);

  // ── WebSocket ─────────────────────────────────────────
  const visibleIdsRef   = useRef<Set<string | number>>(new Set());
  const [refreshingIds, setRefreshingIds] = useState<Set<string | number>>(new Set());

  useEffect(() => { visibleIdsRef.current = new Set(tickets.map((t) => t.id)); }, [tickets]);

  const refreshRow = useCallback(async (id: string | number) => {
    if (!visibleIdsRef.current.has(id)) return;
    setRefreshingIds((prev) => new Set(prev).add(id));
    try {
      const updated = await fetchTicketById(id);
      qc.setQueryData(
        ticketKeys.list(params),
        (old: typeof pageData) => {
          if (!old) return old;
          return { ...old, content: old.content.map((t) => (t.id === id ? updated : t)) };
        },
      );
    } finally {
      setRefreshingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [qc, params]);

  useEffect(() => {
    const ws = new WebSocket(`${wsBaseUrl}/workflow-service/web-socket/sla`);
    ws.onopen    = () => { ws.send(token ?? ""); };
    ws.onmessage = (event) => { refreshRow(Number(event.data)); };
    return () => ws.close();
  }, [refreshRow, token]);

  // ── Filter handlers ───────────────────────────────────
  const handleStatusChange = (val: number | undefined) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (val == null) p.delete("status"); else p.set("status", JSON.stringify(val));
      p.delete("page");
      return p;
    }, { replace: true });
  };

  const handlePriorityChange = (val: number | undefined) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (val == null) p.delete("priority"); else p.set("priority", JSON.stringify(val));
      p.delete("page");
      return p;
    }, { replace: true });
  };

  const handleReset = () => {
    setSummaryInput("");
    setUserQuery("");
    setUserOptions([]);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      ["q","status","priority","assignee","sortBy","sortDir","page"].forEach((k) => p.delete(k));
      return p;
    }, { replace: true });
  };

  // ── Table columns ─────────────────────────────────────
  const columns: ColumnsType<TicketSla> = [
    {
      title: "ID",
      key: "code",
      width: 110,
      render: (_, record) => (
        <span className="font-mono-tech text-[11px] text-[var(--acc-1)]">
          {record.project.code}-{String(record.id).padStart(4, "0")}
        </span>
      ),
    },
    {
      title: "Summary",
      dataIndex: "summary",
      ellipsis: true,
      width: 220,
      render: (text: string, record) => (
        <span className="flex items-center gap-1.5">
          {record.sla?.isPaused && (
            <PauseCircleOutlined
              className="flex-shrink-0 text-[10px]"
              style={{ color: "var(--acc-amber)" }}
            />
          )}
          <span className="truncate">{text}</span>
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: ["status", "name"],
      width: 120,
      render: (name: string, record) => (
        <Tag color={record.status?.color} className="font-bebas! tracking-wider! text-xs!">
          {name}
        </Tag>
      ),
    },
    {
      title: "Resolution",
      key: "resolutionPercent",
      width: 130,
      responsive: ["md"] as ("xs" | "sm" | "md" | "lg" | "xl" | "xxl")[],
      sorter: true,
      sortOrder:
        sortBy === "resolutionPercent"
          ? (sortDir === "asc" ? "ascend" : "descend")
          : null,
      render: (_: unknown, record: TicketSla) => <SlaBar sla={record.sla} />,
    },
    {
      title: "Priority",
      key: "priority",
      width: 140,
      responsive: ["lg"] as ("xs" | "sm" | "md" | "lg" | "xl" | "xxl")[],
      render: (_: unknown, record: TicketSla) => <PriorityBars priority={record.priority} />,
    },
    {
      title: "Assignee",
      dataIndex: "assignee",
      width: 130,
      render: (assignee: TicketSla["assignee"]) => (
        <span className="font-mono-tech text-[11px] text-[var(--fg-dim)]">
          {assignee?.name ?? "UNASSIGNED"}
        </span>
      ),
    },
    {
      title: "Age",
      key: "age",
      width: 60,
      responsive: ["xl"] as ("xs" | "sm" | "md" | "lg" | "xl" | "xxl")[],
      render: (_: unknown, record: TicketSla) => {
        const h = dayjs().diff(dayjs(record.createdAt), "hour");
        return (
          <span className="font-mono-tech text-[10px] text-[var(--fg-faint)]">
            {h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`}
          </span>
        );
      },
    },
    {
      title: "",
      width: 80,
      render: (_, record) => {
        const isPaused  = record.sla?.isPaused ?? false;
        const isLoading = actionLoadingIds.has(record.id);
        const menuItems: MenuProps["items"] = [
          ...(!isPaused ? [{
            key: "pause", label: "Pause SLA", disabled: isLoading,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick: ({ domEvent }: any) => { domEvent.stopPropagation(); handlePause(record.id); },
          }] : []),
          ...(isPaused ? [{
            key: "resume", label: "Resume SLA", disabled: isLoading,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick: ({ domEvent }: any) => { domEvent.stopPropagation(); handleResume(record.id); },
          }] : []),
          {
            key: "open", label: "Open ticket",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick: ({ domEvent }: any) => { domEvent.stopPropagation(); navigate(`/dashboard/${record.id}`); },
          },
        ];
        return (
          <div className="flex items-center gap-1">
            {refreshingIds.has(record.id) && <Spin size="small" />}
            <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
              <Button
                type="text"
                size="small"
                loading={isLoading}
                onClick={(e) => e.stopPropagation()}
                className="font-mono-tech text-[var(--fg-faint)] hover:text-[var(--acc-1)]"
              >
                ···
              </Button>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  // ── Filter bar (shared by console + stream) ───────────
  const filterBar = (
    <div className="flex flex-wrap gap-2 mb-4">
      <Input
        placeholder="Search summary"
        value={summaryInput}
        onChange={(e) => setSummaryInput(e.target.value)}
        allowClear
        className="!w-[200px]"
      />
      <Select
        placeholder="Status"
        value={statusId}
        onChange={handleStatusChange}
        allowClear
        loading={isStatusesLoading}
        className="!w-[150px]"
        options={(statuses as WorkflowStatus[]).map((s) => ({ value: s.id, label: s.name }))}
      />
      <Select
        placeholder="Priority"
        value={priorityId}
        onChange={handlePriorityChange}
        allowClear
        className="!w-[140px]"
        options={(priorities as Priority[]).map((p) => ({ value: p.id, label: p.name }))}
      />
      <Select
        showSearch
        allowClear
        filterOption={false}
        placeholder={<span><UserOutlined className="mr-1" />Assignee</span>}
        value={assigneeSub || undefined}
        onSearch={setUserQuery}
        onChange={handleAssigneeChange}
        onClear={() => handleAssigneeChange(undefined)}
        options={userOptions}
        loading={isSearchingUsers}
        notFoundContent={isSearchingUsers ? <Spin size="small" /> : userQuery ? "No users found" : null}
        className="!w-[200px]"
      />
      <Button onClick={handleReset}>Reset</Button>
      <span className="font-mono-tech text-[11px] text-[var(--fg-faint)] self-center">
        {total} tickets
      </span>
      <Button
        icon={<DownloadOutlined />}
        loading={isExporting}
        onClick={handleExport}
        className="neon-btn font-bebas! tracking-widest! ml-auto"
      >
        <span className="neon-btn-content">Export</span>
      </Button>
    </div>
  );

  // ── Ticket table (shared by console + stream) ─────────
  const ticketTable = (
    <Table<TicketSla>
      columns={columns}
      dataSource={tickets}
      rowKey="id"
      loading={isFetching}
      size="middle"
      scroll={{ x: "max-content" }}
      sticky={{ offsetHeader: 0 }}
      onRow={(record) => ({
        onClick: () => setInspectorId(record.id),
        onMouseEnter: () => {
          qc.prefetchQuery({
            queryKey: ticketKeys.detail(record.id),
            queryFn:  () => fetchTicketById(record.id),
            staleTime: 30_000,
          });
        },
        style: { cursor: "crosshair" },
      })}
      onChange={(pagination, _, sorter, extra) => {
        setSearchParams((prev) => {
          const p = new URLSearchParams(prev);
          if (extra.action === "sort") {
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            if (s?.columnKey === "resolutionPercent" && s.order) {
              p.set("sortBy",  JSON.stringify("resolutionPercent"));
              p.set("sortDir", JSON.stringify(s.order === "ascend" ? "asc" : "desc"));
            } else {
              p.delete("sortBy");
              p.delete("sortDir");
            }
            p.delete("page");
          } else if (extra.action === "paginate") {
            const newPage = (pagination.current ?? 1) - 1;
            const newSize = pagination.pageSize ?? 10;
            if (newPage === 0) p.delete("page"); else p.set("page", JSON.stringify(newPage));
            if (newSize === 10) p.delete("size"); else p.set("size", JSON.stringify(newSize));
          }
          return p;
        }, { replace: true });
      }}
      pagination={{
        current: page + 1,
        pageSize,
        total,
        showSizeChanger: true,
        showTotal: (t) => `Total ${t} tickets`,
      }}
    />
  );

  return (
    <>
      {/* Page header */}
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2
            className="font-bebas text-3xl tracking-[0.15em] neon-text-acc m-0"
            style={{ textShadow: "0 0 calc(16px * var(--glow)) color-mix(in oklab, var(--acc-1) 60%, transparent)" }}
          >▸ TICKET QUEUE</h2>
          <span className="font-mono-tech text-xs text-[var(--fg-faint)] tracking-widest hidden sm:block">
            {LAYOUT_LABEL[layout]}
          </span>
        </div>
        <Segmented<Layout>
          options={[
            { label: "Console", value: "console" },
            { label: "Board",   value: "board" },
            { label: "Stream",  value: "stream" },
          ]}
          value={layout}
          onChange={setLayout}
        />
      </div>

      {/* Board view */}
      {layout === "board" && (
        <KanbanBoard onCardClick={setInspectorId} />
      )}

      {/* Console view — stat rail above filter + table */}
      {layout === "console" && (
        <>
          <div className="mb-4">
            <KpiStrip />
          </div>
          <div
            className="grid gap-4 mb-4 min-w-0"
            style={{ gridTemplateColumns: "1.1fr 1fr" }}
          >
            <div className="min-w-0 overflow-hidden">
              <TicketDistributionCard />
            </div>
            <div className="min-w-0 overflow-hidden">
              <SlaOverviewCard />
            </div>
          </div>
          {filterBar}
          {ticketTable}
        </>
      )}

      {/* Stream view — table + insight rail */}
      {layout === "stream" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 0.9fr", gap: 14, alignItems: "start" }}>
          <div>
            {filterBar}
            {ticketTable}
          </div>
          <div className="flex flex-col gap-4">
            <SlaOverviewCard />
            <TicketDistributionCard />
          </div>
        </div>
      )}

      {/* Inspector drawer */}
      <InspectorDrawer
        id={inspectorId}
        onClose={() => setInspectorId(null)}
      />
    </>
  );
}
