import {useRef, useState, useEffect, useCallback} from "react";
import {Spin, Table, Tag, Typography, Button, Dropdown} from "antd";
import {PlusOutlined, MoreOutlined} from "@ant-design/icons";
import type {MenuProps} from "antd";
import {useNavigate} from "react-router-dom";
import type {ColumnsType} from "antd/es/table";
import {fetchTickets, fetchTicketById} from "../api/ticketApi";
import type {TicketSla} from "../api/types.ts";
import CreateTicketModal from "../components/CreateTicketModal";

const {Title} = Typography;

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
        title: "Response Status",
        dataIndex: ["sla", "status", "response"],
        width: 140,
        render: (_, record) => {
            if (!record.sla?.status?.response) return "-";
            return (
                <Tag color={record.sla.status.isResponseOverdue ? "red" : "green"}>
                    {record.sla.status.response}
                </Tag>
            );
        },
    },
    {
        title: "Resolution Status",
        dataIndex: ["sla", "status", "resolution"],
        width: 140,
        render: (_, record) => {
            if (!record.sla?.status?.resolution) return "-";
            return (
                <Tag color={record.sla.status.isResolutionOverdue ? "red" : "green"}>
                    {record.sla.status.resolution}
                </Tag>
            );
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
            assignee?.preferred_username ?? assignee?.name ?? "-",
    },
    {
        title: "Actions",
        width: 80,
        render: (_, record) => {
            const isPaused = record.sla?.isPaused ?? false;

            const menuItems: MenuProps['items'] = [
                // Show Pause only when ticket is NOT paused
                !isPaused && {
                    key: 'pause',
                    label: 'Pause',
                    onClick: () => {
                        console.log('Pause ticket:', record.id);
                        // Add your pause logic here
                    },
                },
                // Show Resume only when ticket IS paused
                isPaused && {
                    key: 'resume',
                    label: 'Resume',
                    onClick: () => {
                        console.log('Resume ticket:', record.id);
                        // Add your resume logic here
                    },
                },
                {
                    key: 'transition',
                    label: 'Transition',
                    onClick: () => {
                        console.log('Transition ticket:', record.id);
                        // Add your transition logic here
                    },
                },
            ].filter(Boolean);

            return (
                <Dropdown
                    menu={{ items: menuItems }}
                    trigger={['click']}
                    placement="bottomRight"
                >
                    <Button
                        type="text"
                        icon={<MoreOutlined rotate={90} />}
                        onClick={(e) => e.stopPropagation()}
                    />
                </Dropdown>
            );
        },
    }
];

export default function Dashboard() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<TicketSla[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const token = sessionStorage.getItem("access_token");

    // Keep a ref of currently visible IDs for quick lookup
    const visibleIdsRef = useRef<Set<string | number>>(new Set());

    // Track which rows are being refreshed individually
    const [refreshingIds, setRefreshingIds] = useState<Set<string | number>>(new Set());

    const loadPage = useCallback(async (p: number, size: number) => {
        setLoading(true);
        try {
            const {content, totalElements} = await fetchTickets(p, size);
            setTickets(content);
            setTotal(totalElements);
            visibleIdsRef.current = new Set(content.map((t) => t.id));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPage(page, pageSize);
    }, [page, pageSize, loadPage]);

    // Patch a single row without re-fetching the whole table
    const refreshRow = useCallback(async (id: string | number) => {
        if (!visibleIdsRef.current.has(id)) return; // not on current page, ignore

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

    // WebSocket setup
    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080/workflow-service/web-socket/sla");

        ws.onopen = () => {
            ws.send(token ?? "");
        };

        ws.onmessage = (event) => {
            const id = Number(event.data);
            refreshRow(id);
        };

        return () => ws.close();
    }, [refreshRow, token]);

    const handlePaginationChange = (p: number, size: number) => {
        setPage(p - 1);
        setPageSize(size);
    };

    const handleCreateSuccess = () => {
        setIsModalOpen(false);
        // Refresh the ticket list after successful creation
        loadPage(page, pageSize);
    };

    // Optionally show a per-row loading indicator in your columns
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
            <div className="flex justify-between items-center mb-4">
                <Title level={3} className="mb-0">Dashboard</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalOpen(true)}
                >
                    Create Ticket
                </Button>
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