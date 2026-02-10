import { useEffect, useRef, useState } from "react";
import { Table, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { streamTickets, type PageResponse, type TicketSla } from "../api/ticketApi";

const { Title } = Typography;

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
    title: "SLA Time (seconds)",
    dataIndex: ["sla", "time"],
    width: 130,
    render: (time: number | undefined) => time ?? "-",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketSla[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const loadingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const wrappedHandleTicket = (pageResponse: PageResponse<TicketSla>) => {
      if (isMounted) {
        setTickets(pageResponse.content);
        setTotal(pageResponse.totalElements);
        setLoading(false);
        loadingRef.current = false;
      }
    };

    const controller = streamTickets(
      page,
      pageSize,
      wrappedHandleTicket,
      (error) => {
        console.error("Ticket stream error:", error);
        if (isMounted) {
          setLoading(false);
          loadingRef.current = false;
        }
      },
      () => {
        if (isMounted) {
          setLoading(false);
          loadingRef.current = false;
        }
      },
    );

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [page, pageSize]);

  const handlePaginationChange = (p: number, size: number) => {
    setLoading(true);
    loadingRef.current = true;
    setPage(p - 1);
    setPageSize(size);
  };

  return (
    <>
      <Title level={3}>Dashboard</Title>
      <Table<TicketSla>
        columns={columns}
        dataSource={tickets}
        rowKey="id"
        loading={loading}
        onRow={(record) => ({
          onClick: () => navigate(`/dashboard/${record.id}`),
          style: { cursor: "pointer" },
        })}
        pagination={{
          current: page + 1,
          pageSize,
          total: total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} tickets`,
          onChange: handlePaginationChange,
        }}
      />
    </>
  );
}