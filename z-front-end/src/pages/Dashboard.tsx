import { useCallback, useEffect, useRef, useState } from "react";
import { Table, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { streamTickets, type TicketSla } from "../api/ticketApi";

const { Title } = Typography;

const columns: ColumnsType<TicketSla> = [
  {
    title: "ID",
    dataIndex: "id",
    width: 80,
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
    title: "SLA Time (min)",
    dataIndex: ["sla", "time"],
    width: 130,
    render: (time: number | undefined) => time ?? "-",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Map<number, TicketSla>>(new Map());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const initialLoadDone = useRef(false);

  const handleTicket = useCallback((ticket: TicketSla) => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      setLoading(false);
    }
    setTickets((prev) => {
      const next = new Map(prev);
      next.set(ticket.id, ticket);
      return next;
    });
  }, []);

  useEffect(() => {
    initialLoadDone.current = false;
    setLoading(true);

    const controller = streamTickets(
      handleTicket,
      (error) => {
        console.error("Ticket stream error:", error);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => controller.abort();
  }, [handleTicket]);

  const allTickets = Array.from(tickets.values()).sort((a, b) => b.id - a.id);

  return (
    <>
      <Title level={3}>Dashboard</Title>
      <Table<TicketSla>
        columns={columns}
        dataSource={allTickets}
        rowKey="id"
        loading={loading}
        onRow={(record) => ({
          onClick: () => navigate(`/dashboard/${record.id}`),
          style: { cursor: "pointer" },
        })}
        pagination={{
          current: page + 1,
          pageSize,
          total: allTickets.length,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} tickets`,
          onChange: (p, size) => {
            setPage(p - 1);
            setPageSize(size);
          },
        }}
      />
    </>
  );
}
