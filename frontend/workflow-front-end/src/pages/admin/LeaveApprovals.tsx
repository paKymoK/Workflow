import { useMemo, useState } from "react";
import { Typography, Select, Input, Button, Table, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckOutlined, CloseOutlined, CheckSquareOutlined, SearchOutlined } from "@ant-design/icons";
import StatusTag from "../../components/admin/StatusTag";
import InitialsAvatar from "../../components/admin/InitialsAvatar";
import { leaveRequestsInit } from "../../data/admin/mockData";

const { Title, Text } = Typography;

type LeaveRequest = (typeof leaveRequestsInit)[number];

export default function LeaveApprovals() {
  const [data, setData] = useState(leaveRequestsInit);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const departments = useMemo(
    () => Array.from(new Set(leaveRequestsInit.map((r) => r.dept))).sort(),
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

  const columns: ColumnsType<LeaveRequest> = [
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
    {
      title: "Type",
      dataIndex: "type",
      render: (v: string) => (
        <span className="px-2 py-0.5 bg-[var(--hover)] text-[var(--text-dim)] rounded text-xs font-medium">{v}</span>
      ),
    },
    { title: "From", dataIndex: "from", render: (v: string) => <span className="font-mono text-xs text-[var(--text-dim)]">{v}</span> },
    { title: "To", dataIndex: "to", render: (v: string) => <span className="font-mono text-xs text-[var(--text-dim)]">{v}</span> },
    { title: "Days", dataIndex: "days", render: (v: number) => <span className="font-semibold text-[var(--text)]">{v}d</span> },
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
            <Popconfirm title="Reject this leave request?" onConfirm={() => act(record.id, "rejected")} okText="Reject" cancelText="Cancel">
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
            Leave Request Approvals
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

      <Table<LeaveRequest>
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        size="middle"
        scroll={{ x: "max-content" }}
        pagination={{ pageSize: 10, showTotal: (t) => `Total ${t} requests` }}
        locale={{ emptyText: <div className="py-10 text-[var(--text-faint)]"><CheckSquareOutlined className="text-3xl mb-2 opacity-30" /><p>No leave requests in this category</p></div> }}
      />
    </div>
  );
}
