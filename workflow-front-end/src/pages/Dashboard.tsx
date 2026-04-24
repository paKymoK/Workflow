import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Spin, Table, Tag, Button, Dropdown, message, Input, Select } from "antd";
import { PlusOutlined, MoreOutlined, SearchOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { useQueryClient } from "@tanstack/react-query";
import { fetchTicketById } from "../api/ticketApi";
import { wsBaseUrl } from "../api/axios.ts";
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
import CreateTicketModal from "../components/CreateTicketModal";
import DeadlineTag from "../components/DeadlineTag.tsx";

export default function Dashboard() {
  const navigate    = useNavigate();
  const qc          = useQueryClient();
  const token       = sessionStorage.getItem("access_token");

  // ── Pagination ───────────────────────────────────────────────────────────
  const [page,     setPage]     = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // ── Filter state ─────────────────────────────────────────────────────────
  const [summary,       setSummary]       = useState("");
  const [statusId,      setStatusId]      = useState<number | undefined>();
  const [priorityId,    setPriorityId]    = useState<number | undefined>();
  const [assigneeEmail, setAssigneeEmail] = useState("");

  // ── Modal ────────────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Build query params memo ───────────────────────────────────────────────
  // Changing any of these values changes the queryKey → automatic refetch.
  const params = useMemo<FilterTicketRequest>(() => ({
    page,
    size: pageSize,
    ...(summary.trim()       && { summary: summary.trim() }),
    ...(statusId  != null    && { statusId }),
    ...(priorityId != null   && { priorityId }),
    ...(assigneeEmail.trim() && { assigneeEmail: assigneeEmail.trim() }),
  }), [page, pageSize, summary, statusId, priorityId, assigneeEmail]);

  // ── Data queries ──────────────────────────────────────────────────────────
  const { data: pageData, isFetching } = useTicketList(params);
  const { data: priorities = [] }      = usePriorities();
  const { data: statuses = [], isLoading: isStatusesLoading } = useStatuses();

  const tickets = pageData?.content       ?? [];
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
  }, [qc, params, pageData]);

  useEffect(() => {
    const ws = new WebSocket(`${wsBaseUrl}/workflow-service/web-socket/sla`);
    ws.onopen    = () => { ws.send(token ?? ""); };
    ws.onmessage = (event) => { refreshRow(Number(event.data)); };
    return () => ws.close();
  }, [refreshRow, token]);

  // ── Filter handlers ───────────────────────────────────────────────────────
  // setPage(0) changes the queryKey → automatic refetch via useTicketList
  const handleSearch = () => setPage(0);

  const handleReset = () => {
    setSummary("");
    setStatusId(undefined);
    setPriorityId(undefined);
    setAssigneeEmail("");
    setPage(0);
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns: ColumnsType<TicketSla> = [
    { title: "ID", dataIndex: "id", width: 120 },
    { title: "Summary", dataIndex: "summary", ellipsis: true },
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
          className="neon-btn font-bebas! tracking-widest!"
        >
          <span className="neon-btn-content">Create Ticket</span>
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Input
          placeholder="Search summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          className="!w-[200px]"
        />
        <Select
          placeholder="Status"
          value={statusId}
          onChange={setStatusId}
          allowClear
          loading={isStatusesLoading}
          className="!w-[160px]"
          options={(statuses as WorkflowStatus[]).map((status) => ({ value: status.id, label: status.name }))}
        />
        <Select
          placeholder="Priority"
          value={priorityId}
          onChange={setPriorityId}
          allowClear
          className="!w-[160px]"
          options={(priorities as Priority[]).map((p) => ({ value: p.id, label: p.name }))}
        />
        <Input
          placeholder="Assignee email"
          value={assigneeEmail}
          onChange={(e) => setAssigneeEmail(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          className="!w-[200px]"
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          Search
        </Button>
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
        pagination={{
          current: page + 1,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `Total ${t} tickets`,
          onChange: (p, size) => { setPage(p - 1); setPageSize(size); },
        }}
      />

      <CreateTicketModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setIsModalOpen(false)}
      />
    </>
  );
}
