import { useState } from "react";
import { Table, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { fetchTickets, type TicketSla } from "../api/ticketApi";

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
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", page, pageSize],
    queryFn: () => fetchTickets(page, pageSize),
  });

  return (
    <>
      <Title level={3}>Dashboard</Title>
      <Table<TicketSla>
        columns={columns}
        dataSource={data?.content}
        rowKey="id"
        loading={isLoading}
        onRow={(record) => ({
          onClick: () => navigate(`/dashboard/${record.id}`),
          style: { cursor: "pointer" },
        })}
        pagination={{
          current: page + 1,
          pageSize,
          total: data?.totalElements ?? 0,
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
