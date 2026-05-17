import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useUrlState } from "@state";
import { Spin, Table, Tag, Button, Dropdown, message, Input, Select, Progress } from "antd";
import { MoreOutlined, DownloadOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { useQueryClient } from "@tanstack/react-query";
import { fetchTicketById, exportTickets, type ExportTicketRequest } from "../api/ticketApi";
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
import DeadlineTag from "../components/DeadlineTag.tsx";

export default function Dashboard() {
  const navigate    = useNavigate();
  const qc          = useQueryClient();
  const token       = sessionStorage.getItem("access_token");

  // ── URL state (reads only — all writes go through setSearchParams) ─────────
  const [page]          = useUrlState("page",    0);
  const [pageSize]      = useUrlState("size",    10);
  const [summary]       = useUrlState("q",       "");
  const [statusId]      = useUrlState<number | undefined>("status",   undefined);
  const [priorityId]    = useUrlState<number | undefined>("priority", undefined);
  const [assigneeEmail] = useUrlState("assignee", "");
  const [sortBy]        = useUrlState<"resolutionPercent" | undefined>("sortBy",  undefined);
  const [sortDir]       = useUrlState<"asc" | "desc" | undefined>("sortDir", undefined);
  const [, setSearchParams] = useSearchParams();

  // Keep a ref so debounce callbacks always use the latest setSearchParams
  // without having it as a dep (React Router recreates it on every URL change)
  const setSearchParamsRef = useRef(setSearchParams);
  useEffect(() => { setSearchParamsRef.current = setSearchParams; });

  // ── Local input values — update immediately for responsive typing ─────────
  const [summaryInput,  setSummaryInput]  = useState(summary);
  const [assigneeInput, setAssigneeInput] = useState(assigneeEmail);

  // ── Debounce text inputs → URL (1 s) + reset page ────────────────────────
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

  useEffect(() => {
    const id = setTimeout(() => {
      setSearchParamsRef.current((prev) => {
        const p = new URLSearchParams(prev);
        const v = assigneeInput.trim().toLowerCase();
        if (v) p.set("assignee", JSON.stringify(v)); else p.delete("assignee");
        p.delete("page");
        return p;
      }, { replace: true });
    }, 1000);
    return () => clearTimeout(id);
  }, [assigneeInput]);

  // ── Modal ────────────────────────────────────────────────────────────────
const [isExporting,  setIsExporting]  = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportParams: ExportTicketRequest = {
        ...(summary.trim()       && { summary: summary.trim() }),
        ...(statusId  != null    && { statusId }),
        ...(priorityId != null   && { priorityId }),
        ...(assigneeEmail.trim() && { assigneeEmail: assigneeEmail.trim() }),
      };
      await exportTickets(exportParams);
    } catch {
      message.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  // ── Build query params memo ───────────────────────────────────────────────
  // Changing any of these values changes the queryKey → automatic refetch.
  const params = useMemo<FilterTicketRequest>(() => ({
    page,
    size: pageSize,
    ...(summary.trim()       && { summary: summary.trim() }),
    ...(statusId  != null    && { statusId }),
    ...(priorityId != null   && { priorityId }),
    ...(assigneeEmail.trim() && { assigneeEmail: assigneeEmail.trim() }),
    ...(sortBy  != null && { sortBy }),
    ...(sortDir != null && { sortDir }),
  }), [page, pageSize, summary, statusId, priorityId, assigneeEmail, sortBy, sortDir]);

  // ── Data queries ──────────────────────────────────────────────────────────
  const { data: pageData, isFetching } = useTicketList(params);
  const { data: priorities = [] }      = usePriorities();
  const { data: statuses = [], isLoading: isStatusesLoading } = useStatuses();

  const tickets = useMemo(() => pageData?.content ?? [], [pageData]);
  const total   = pageData?.totalElements ?? 0;

  // ── Mutations ────────────────────────────────────────────────────────────
  const pauseMutation  = usePauseTicket();
  const resumeMutation = useResumeTicket();

  // Track which row is in an action-loading state for the dropdown button
  const [actionLoadingIds, setActionLoadingIds] = useState<Set<string | number>>(new Set());

  const handlePause = useCallback(async (id: string | number) => {
    setActionLoadingIds((prev) => new Set(prev).add(id));
    try {
      await pauseMutation.mutateAsync(id);
    } catch {
      message.error("Failed to pause ticket");
    } finally {
      setActionLoadingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [pauseMutation]);

  const handleResume = useCallback(async (id: string | number) => {
    setActionLoadingIds((prev) => new Set(prev).add(id));
    try {
      await resumeMutation.mutateAsync(id);
    } catch {
      message.error("Failed to resume ticket");
    } finally {
      setActionLoadingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [resumeMutation]);

  // ── WebSocket — keep untouched; update cache on push ─────────────────────
  const visibleIdsRef  = useRef<Set<string | number>>(new Set());
  const [refreshingIds, setRefreshingIds] = useState<Set<string | number>>(new Set());

  // Track which ids are currently on screen so the WS handler can ignore others
  useEffect(() => {
    visibleIdsRef.current = new Set(tickets.map((t) => t.id));
  }, [tickets]);

  const refreshRow = useCallback(async (id: string | number) => {
    if (!visibleIdsRef.current.has(id)) return;
    setRefreshingIds((prev) => new Set(prev).add(id));
    try {
      const updated = await fetchTicketById(id);
      // Patch the single item inside the cached page without triggering a full refetch
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

  // ── Filter handlers ───────────────────────────────────────────────────────
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
    setAssigneeInput("");
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete("q");
      p.delete("status");
      p.delete("priority");
      p.delete("assignee");
      p.delete("sortBy");
      p.delete("sortDir");
      p.delete("page");
      return p;
    }, { replace: true });
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns: ColumnsType<TicketSla> = [
    { title: "ID", dataIndex: "id", width: 120 },
    { title: "Summary", dataIndex: "summary", ellipsis: true, width: 220 },
    {
      title: "Resolution %",
      key: "resolutionPercent",
      width: 160,
      responsive: ["md"] as ("xs" | "sm" | "md" | "lg" | "xl" | "xxl")[],
      sorter: true,
      sortOrder: sortBy === "resolutionPercent"
        ? (sortDir === "asc" ? "ascend" : "descend")
        : null,
      render: (_: unknown, record: TicketSla) => {
        const percent = record.sla?.status?.resolutionPercent;
        const overdue = record.sla?.status?.isResolutionOverdue ?? false;
        if (percent == null) return <span className="text-gray-400 text-xs">—</span>;
        const clamped = Math.min(Math.round(percent), 100);
        const strokeColor = overdue || percent >= 100 ? "#ff4d4f" : percent >= 80 ? "#faad14" : "#52c41a";
        return (
          <Progress
            percent={clamped}
            size="small"
            strokeColor={strokeColor}
            format={(p) => <span className="text-[11px]">{p}%</span>}
          />
        );
      },
    },
    {
      title: "Status",
      dataIndex: ["status", "name"],
      width: 120,
      render: (name: string, record) => <Tag color={record.status?.color}>{name}</Tag>,
    },
    {
      title: "Response",
      width: 200,
      render: (_, record) => record.sla
        ? <DeadlineTag createdAt={record.createdAt} sla={record.sla} type="response" />
        : "-",
    },
    {
      title: "Resolution",
      width: 200,
      render: (_, record) => record.sla
        ? <DeadlineTag createdAt={record.createdAt} sla={record.sla} type="resolution" />
        : "-",
    },
    { title: "Priority", dataIndex: ["priority", "name"], width: 100 },
    {
      title: "Assignee",
      dataIndex: "assignee",
      width: 140,
      render: (assignee: TicketSla["assignee"]) => assignee?.name ?? "-",
    },
    {
      title: "Actions",
      width: 100,
      render: (_, record) => {
        const isPaused  = record.sla?.isPaused ?? false;
        const isLoading = actionLoadingIds.has(record.id);
        const menuItems: MenuProps["items"] = [
          ...(!isPaused ? [{
            key: "pause", label: "Pause", disabled: isLoading,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick: ({ domEvent }: any) => { domEvent.stopPropagation(); handlePause(record.id); },
          }] : []),
          ...(isPaused ? [{
            key: "resume", label: "Resume", disabled: isLoading,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick: ({ domEvent }: any) => { domEvent.stopPropagation(); handleResume(record.id); },
          }] : []),
        ];
        return (
          <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
            <Button
              type="text"
              icon={<MoreOutlined rotate={90} />}
              loading={isLoading}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        );
      },
    },
    {
      title: "", width: 40,
      render: (_, record) => refreshingIds.has(record.id) ? <Spin size="small" /> : null,
    },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <h2 className="font-bebas text-3xl tracking-[0.15em] neon-text-yellow m-0">▸ DASHBOARD</h2>
          <span className="font-mono-tech text-xs text-[rgba(240,240,240,0.3)] tracking-widest hidden sm:block">
            // TICKET QUEUE
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            icon={<DownloadOutlined />}
            loading={isExporting}
            onClick={handleExport}
            className="neon-btn font-bebas! tracking-widest!"
          >
            <span className="neon-btn-content">Export</span>
          </Button>
        </div>
      </div>

      {/* Filter bar */}
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
          className="!w-[160px]"
          options={(statuses as WorkflowStatus[]).map((status) => ({ value: status.id, label: status.name }))}
        />
        <Select
          placeholder="Priority"
          value={priorityId}
          onChange={handlePriorityChange}
          allowClear
          className="!w-[160px]"
          options={(priorities as Priority[]).map((p) => ({ value: p.id, label: p.name }))}
        />
        <Input
          placeholder="Assignee email"
          value={assigneeInput}
          onChange={(e) => setAssigneeInput(e.target.value)}
          allowClear
          className="!w-[200px]"
        />
        <Button onClick={handleReset}>Reset</Button>
      </div>

      <Table<TicketSla>
        columns={columns}
        dataSource={tickets}
        rowKey="id"
        loading={isFetching}
        onRow={(record) => ({
          onClick: () => navigate(`/dashboard/${record.id}`),
          style: { cursor: "pointer" },
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

    </>
  );
}
