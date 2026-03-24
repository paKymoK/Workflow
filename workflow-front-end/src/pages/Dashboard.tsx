import {useRef, useState, useEffect, useCallback} from "react";
import {Spin, Table, Tag, Button, Dropdown, message, Input, Select} from "antd";
import {PlusOutlined, MoreOutlined, SearchOutlined} from "@ant-design/icons";
import type {MenuProps} from "antd";
import {useNavigate} from "react-router-dom";
import type {ColumnsType} from "antd/es/table";
import {fetchTickets, fetchTicketById, pauseTicket, resumeTicket, fetchPriorities} from "../api/ticketApi";
import type {FilterTicketRequest} from "../api/ticketApi";
import { wsBaseUrl } from "../api/axios.ts";
import type {TicketSla, Priority} from "../api/types.ts";
import CreateTicketModal from "../components/CreateTicketModal";
import DeadlineTag from "../components/DeadlineTag.tsx";

export default function Dashboard() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<TicketSla[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const token = sessionStorage.getItem("access_token");
    const [actionLoadingIds, setActionLoadingIds] = useState<Set<string | number>>(new Set());

    // Filter state
    const [summary, setSummary] = useState("");
    const [statusId, setStatusId] = useState<number | undefined>();
    const [priorityId, setPriorityId] = useState<number | undefined>();
    const [assigneeEmail, setAssigneeEmail] = useState("");
    const [priorities, setPriorities] = useState<Priority[]>([]);

    // Collect all unique statuses from loaded tickets for the status filter
    const [knownStatuses, setKnownStatuses] = useState<{ id: number; name: string; color: string }[]>([]);

    useEffect(() => {
        fetchPriorities().then(setPriorities);
    }, []);

    const handlePause = useCallback(async (id: string | number) => {
        setActionLoadingIds((prev) => new Set(prev).add(id));
        try {
            await pauseTicket(id);
            const updated = await fetchTicketById(id);
            setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
        } catch {
            message.error("Failed to pause ticket");
        } finally {
            setActionLoadingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        }
    }, []);

    const handleResume = useCallback(async (id: string | number) => {
        setActionLoadingIds((prev) => new Set(prev).add(id));
        try {
            await resumeTicket(id);
            const updated = await fetchTicketById(id);
            setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
        } catch {
            message.error("Failed to resume ticket");
        } finally {
            setActionLoadingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        }
    }, []);

    const columns: ColumnsType<TicketSla> = [
        {
            title: "ID",
            dataIndex: "id",
            width: 120,
        },
        {
            title: "Summary",
            dataIndex: "summary",
            ellipsis: true,
        },
        {
            title: "Status",
            dataIndex: ["status", "name"],
            width: 120,
            render: (name: string, record) => (
                <Tag color={record.status?.color}>{name}</Tag>
            ),
        },
        {
            title: "Response",
            width: 200,
            render: (_, record) => {
                if (!record.sla) return "-";
                return <DeadlineTag createdAt={record.createdAt} sla={record.sla} type="response" />;
            },
        },
        {
            title: "Resolution",
            width: 200,
            render: (_, record) => {
                if (!record.sla) return "-";
                return <DeadlineTag createdAt={record.createdAt} sla={record.sla} type="resolution" />;
            },
        },
        {
            title: "Priority",
            dataIndex: ["priority", "name"],
            width: 100,
        },
        {
            title: "Assignee",
            dataIndex: "assignee",
            width: 140,
            render: (assignee: TicketSla["assignee"]) =>
                assignee?.name ?? "-",
        },
        {
            title: "Actions",
            width: 100,
            render: (_, record) => {
                const isPaused = record.sla?.isPaused ?? false;
                const isLoading = actionLoadingIds.has(record.id);

                const menuItems: MenuProps['items'] = [
                    ...(!isPaused ? [{
                        key: 'pause',
                        label: 'Pause',
                        disabled: isLoading,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClick: ({ domEvent }: any) => { domEvent.stopPropagation(); handlePause(record.id); },
                    }] : []),
                    ...(isPaused ? [{
                        key: 'resume',
                        label: 'Resume',
                        disabled: isLoading,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClick: ({ domEvent }: any) => { domEvent.stopPropagation(); handleResume(record.id); },
                    }] : []),
                ];

                return (
                    <Dropdown
                        menu={{ items: menuItems }}
                        trigger={['click']}
                        placement="bottomRight"
                    >
                        <Button
                            type="text"
                            icon={<MoreOutlined rotate={90} />}
                            loading={isLoading}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </Dropdown>
                );
            },
        }
    ];

    const visibleIdsRef = useRef<Set<string | number>>(new Set());
    const [refreshingIds, setRefreshingIds] = useState<Set<string | number>>(new Set());

    const buildParams = useCallback((p: number, size: number): FilterTicketRequest => ({
        page: p,
        size,
        ...(summary.trim()    && { summary: summary.trim() }),
        ...(statusId != null  && { statusId }),
        ...(priorityId != null && { priorityId }),
        ...(assigneeEmail.trim() && { assigneeEmail: assigneeEmail.trim() }),
    }), [summary, statusId, priorityId, assigneeEmail]);

    const loadPage = useCallback(async (p: number, size: number) => {
        setLoading(true);
        try {
            const {content, totalElements} = await fetchTickets(buildParams(p, size));
            setTickets(content);
            setTotal(totalElements);
            visibleIdsRef.current = new Set(content.map((t) => t.id));
            // Collect statuses for the filter dropdown
            setKnownStatuses((prev) => {
                const map = new Map(prev.map((s) => [s.id, s]));
                content.forEach((t) => { if (t.status) map.set(t.status.id, t.status); });
                return Array.from(map.values());
            });
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    useEffect(() => {
        loadPage(page, pageSize);
    }, [page, pageSize, loadPage]);

    const refreshRow = useCallback(async (id: string | number) => {
        if (!visibleIdsRef.current.has(id)) return;

        setRefreshingIds((prev) => new Set(prev).add(id));
        try {
            const updated = await fetchTicketById(id);
            setTickets((prev) =>
                prev.map((t) => (t.id === id ? updated : t))
            );
        } finally {
            setRefreshingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    }, []);

    useEffect(() => {
        const ws = new WebSocket(`${wsBaseUrl}/workflow-service/web-socket/sla`);
        ws.onopen = () => { ws.send(token ?? ""); };
        ws.onmessage = (event) => { refreshRow(Number(event.data)); };
        return () => ws.close();
    }, [refreshRow, token]);

    const handleSearch = () => {
        setPage(0);
        loadPage(0, pageSize);
    };

    const handleReset = () => {
        setSummary("");
        setStatusId(undefined);
        setPriorityId(undefined);
        setAssigneeEmail("");
    };

    const handlePaginationChange = (p: number, size: number) => {
        setPage(p - 1);
        setPageSize(size);
    };

    const handleCreateSuccess = () => {
        setIsModalOpen(false);
        loadPage(page, pageSize);
    };

    const columnsWithLoading: ColumnsType<TicketSla> = [
        ...columns,
        {
            title: "",
            width: 40,
            render: (_, record) =>
                refreshingIds.has(record.id) ? <Spin size="small"/> : null,
        },
    ];

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <h2 className="font-bebas text-3xl tracking-[0.15em] neon-text-yellow m-0">▸ DASHBOARD</h2>
                  <span className="font-mono-tech text-xs text-[rgba(240,240,240,0.3)] tracking-widest hidden sm:block">// TICKET QUEUE</span>
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
                    className="!w-[160px]"
                    options={knownStatuses.map((s) => ({ value: s.id, label: s.name }))}
                />
                <Select
                    placeholder="Priority"
                    value={priorityId}
                    onChange={setPriorityId}
                    allowClear
                    className="!w-[160px]"
                    options={priorities.map((p) => ({ value: p.id, label: p.name }))}
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
                columns={columnsWithLoading}
                dataSource={tickets}
                rowKey="id"
                loading={loading}
                onRow={(record) => ({
                    onClick: () => navigate(`/dashboard/${record.id}`),
                    style: {cursor: "pointer"},
                })}
                pagination={{
                    current: page + 1,
                    pageSize,
                    total,
                    showSizeChanger: true,
                    showTotal: (t) => `Total ${t} tickets`,
                    onChange: handlePaginationChange,
                }}
            />

            <CreateTicketModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />
        </>
    );
}
