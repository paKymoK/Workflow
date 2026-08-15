import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Typography, Select, Input, Button, Table, Modal, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckOutlined, CloseOutlined, CheckSquareOutlined, SearchOutlined } from "@ant-design/icons";
import StatusTag from "../components/admin/StatusTag";
import InitialsAvatar from "../components/admin/InitialsAvatar";
import { fetchMyTeamLeaveRequests, approveLeave, rejectLeave, type LeaveTicket } from "../api/leaveApi";

const { Title, Text } = Typography;
const { TextArea } = Input;

type StatusKey = "pending" | "approved" | "rejected";

function statusKey(statusName: string | undefined): StatusKey {
  if (statusName === "Leave Approved") return "approved";
  if (statusName === "Rejected") return "rejected";
  return "pending";
}

function leaveTypeLabel(type: string | undefined) {
  if (!type) return "";
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export default function LeaveApprovals() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusKey | "all">("all");
  const [search, setSearch] = useState("");
  const [rejecting, setRejecting] = useState<LeaveTicket | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["leave-approvals"],
    queryFn: () => fetchMyTeamLeaveRequests(),
  });
  const requests = data?.content ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["leave-approvals"] });

  const approveMutation = useMutation({
    mutationFn: (ticket: LeaveTicket) => approveLeave(ticket.id, ticket.status.id),
    onSuccess: () => {
      message.success("Leave request approved");
      invalidate();
    },
    onError: () => message.error("Failed to approve leave request"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ ticket, note }: { ticket: LeaveTicket; note: string }) =>
      rejectLeave(ticket.id, ticket.status.id, note),
    onSuccess: () => {
      message.success("Leave request rejected");
      setRejecting(null);
      setRejectionNote("");
      invalidate();
    },
    onError: () => message.error("Failed to reject leave request"),
  });

  const filtered = useMemo(
    () =>
      requests.filter((r) => {
        if (statusFilter !== "all" && statusKey(r.status?.name) !== statusFilter) return false;
        if (search.trim() && !r.reporter?.name?.toLowerCase().includes(search.trim().toLowerCase())) return false;
        return true;
      }),
    [requests, statusFilter, search],
  );

  const pending = requests.filter((r) => statusKey(r.status?.name) === "pending").length;

  const columns: ColumnsType<LeaveTicket> = [
    {
      title: "Employee",
      key: "employee",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <InitialsAvatar name={record.reporter?.name ?? ""} size={28} />
          <span className="font-medium text-[var(--text)] whitespace-nowrap">{record.reporter?.name}</span>
        </div>
      ),
    },
    {
      title: "Type",
      key: "type",
      render: (_, record) => (
        <span className="px-2 py-0.5 bg-[var(--hover)] text-[var(--text-dim)] rounded text-xs font-medium">
          {leaveTypeLabel(record.detail?.leaveType)}
        </span>
      ),
    },
    { title: "From", key: "from", render: (_, r) => <span className="font-mono text-xs text-[var(--text-dim)]">{r.detail?.startDate}</span> },
    { title: "To", key: "to", render: (_, r) => <span className="font-mono text-xs text-[var(--text-dim)]">{r.detail?.endDate}</span> },
    { title: "Days", key: "days", render: (_, r) => <span className="font-semibold text-[var(--text)]">{r.detail?.days}d</span> },
    {
      title: "Submitted",
      key: "submitted",
      render: (_, r) => (
        <span className="text-xs text-[var(--text-dim)]">{new Date(r.createdAt).toLocaleDateString()}</span>
      ),
    },
    { title: "Status", key: "status", render: (_, r) => <StatusTag status={statusKey(r.status?.name)} /> },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) =>
        statusKey(record.status?.name) === "pending" ? (
          <div className="flex items-center gap-1.5">
            <Button
              size="small"
              icon={<CheckOutlined />}
              loading={approveMutation.isPending && approveMutation.variables?.id === record.id}
              onClick={() => approveMutation.mutate(record)}
            >
              Approve
            </Button>
            <Button size="small" danger icon={<CloseOutlined />} onClick={() => setRejecting(record)}>
              Reject
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <Title level={4} className="!mb-0.5">
            My Team's Leave Requests
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

      <Table<LeaveTicket>
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        size="middle"
        loading={isLoading}
        scroll={{ x: "max-content" }}
        pagination={{ pageSize: 10, showTotal: (t) => `Total ${t} requests` }}
        locale={{
          emptyText: (
            <div className="py-10 text-[var(--text-faint)]">
              <CheckSquareOutlined className="text-3xl mb-2 opacity-30" />
              <p>No leave requests from your direct reports</p>
            </div>
          ),
        }}
      />

      <Modal
        title="Reject leave request"
        open={!!rejecting}
        onCancel={() => {
          setRejecting(null);
          setRejectionNote("");
        }}
        onOk={() => rejecting && rejectMutation.mutate({ ticket: rejecting, note: rejectionNote })}
        okText="Reject"
        okButtonProps={{ danger: true, disabled: !rejectionNote.trim(), loading: rejectMutation.isPending }}
      >
        <p className="text-sm text-[var(--text-dim)] mb-2">
          Rejecting {rejecting?.reporter?.name}'s {leaveTypeLabel(rejecting?.detail?.leaveType)} leave request. A
          note is required.
        </p>
        <TextArea
          rows={3}
          value={rejectionNote}
          onChange={(e) => setRejectionNote(e.target.value)}
          placeholder="Reason for rejection..."
        />
      </Modal>
    </div>
  );
}
