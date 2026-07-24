import { useMemo, useState } from "react";
import { Typography, Select, Input, Button, Table, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckOutlined, CloseOutlined, ClockCircleOutlined, SearchOutlined } from "@ant-design/icons";
import StatusTag from "../../components/admin/StatusTag";
import InitialsAvatar from "../../components/admin/InitialsAvatar";
import { overtimeInit } from "../../data/admin/mockData";

const { Title, Text } = Typography;

type OvertimeRequest = (typeof overtimeInit)[number];

export default function Overtime() {
  const [data, setData] = useState(overtimeInit);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const departments = useMemo(
    () => Array.from(new Set(overtimeInit.map((r) => r.dept))).sort(),
    [],
  );

  const act = (id: number, status: "approved" | "rejected") =>
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

  const filtered = useMemo(
    () =>
      data.filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (deptFilter !== "all" && r.dept !== deptFilter) return false;
        if (search.trim() && !r.employee.toLowerCase().includes(search.trim().toLowerCase())) return false;
        return true;
      }),
    [data, statusFilter, deptFilter, search],
  );

  const pending = data.filter((r) => r.status === "pending").length;

  const columns: ColumnsType<OvertimeRequest> = [
    {
      title: "Employee",
      dataIndex: "employee",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <InitialsAvatar name={record.employee} size={28} />
          <span className="font-medium text-[var(--text)] whitespace-nowrap">{record.employee}</span>
        </div>
      ),
    },
    { title: "Department", dataIndex: "dept", render: (v: string) => <span className="text-xs text-[var(--text-dim)]">{v}</span> },
    { title: "Date", dataIndex: "date", render: (v: string) => <span className="font-mono text-xs text-[var(--text-dim)]">{v}</span> },
    { title: "Hours", dataIndex: "hours", render: (v: number) => <span className="font-semibold text-[var(--text)]">{v}h</span> },
    {
      title: "Reason",
      dataIndex: "reason",
      ellipsis: true,
      render: (v: string) => <span className="text-xs text-[var(--text-dim)]">{v}</span>,
    },
    { title: "Submitted", dataIndex: "submitted", render: (v: string) => <span className="text-xs text-[var(--text-dim)]">{v}</span> },
    { title: "Status", dataIndex: "status", render: (v: string) => <StatusTag status={v} /> },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) =>
        record.status === "pending" ? (
          <div className="flex items-center gap-1.5">
            <Button size="small" icon={<CheckOutlined />} onClick={() => act(record.id, "approved")}>
              Approve
            </Button>
            <Popconfirm title="Reject this overtime request?" onConfirm={() => act(record.id, "rejected")} okText="Reject" cancelText="Cancel">
              <Button size="small" danger icon={<CloseOutlined />}>
                Reject
              </Button>
            </Popconfirm>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <Title level={4} className="!mb-0.5">
            Overtime Request Approvals
          </Title>
          <Text className="text-xs text-[var(--text-faint)]">
            {pending} pending approval{pending !== 1 ? "s" : ""}
          </Text>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Search employee..."
            prefix={<SearchOutlined className="text-[var(--text-faint)]" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            className="!w-[200px]"
          />
          <Select
            value={deptFilter}
            onChange={setDeptFilter}
            className="!w-[150px]"
            options={[{ value: "all", label: "All Departments" }, ...departments.map((d) => ({ value: d, label: d }))]}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="!w-[150px]"
            options={[
              { value: "all", label: "All Status" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ]}
          />
        </div>
      </div>

      <Table<OvertimeRequest>
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        size="middle"
        scroll={{ x: "max-content" }}
        pagination={{ pageSize: 10, showTotal: (t) => `Total ${t} requests` }}
        locale={{ emptyText: <div className="py-10 text-[var(--text-faint)]"><ClockCircleOutlined className="text-3xl mb-2 opacity-30" /><p>No overtime requests found</p></div> }}
      />
    </div>
  );
}
