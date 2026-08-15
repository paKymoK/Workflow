import { useMemo, useState } from "react";
import { Typography, Select, Table, Drawer, Input, Button, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EyeOutlined, SendOutlined } from "@ant-design/icons";
import StatusTag from "../../components/admin/StatusTag";
import InitialsAvatar from "../../components/admin/InitialsAvatar";
import { ticketsInit } from "../../data/admin/mockData";

const { Title, Text } = Typography;
const { TextArea } = Input;

type Ticket = (typeof ticketsInit)[number];

const ASSIGNEE_OPTIONS = ["Unassigned", "Tran Van Minh", "IT Team", "Mai Van Phuc"];

export default function Helpdesk() {
  const [tickets, setTickets] = useState(ticketsInit);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newAssignee, setNewAssignee] = useState("");

  const filtered = useMemo(
    () => (statusFilter === "all" ? tickets : tickets.filter((t) => t.status === statusFilter)),
    [tickets, statusFilter],
  );

  const openTicket = (t: Ticket) => {
    setSelected(t);
    setNewStatus(t.status);
    setNewAssignee(t.assignedTo);
    setReply("");
  };

  const sendReply = () => {
    if (!selected) return;
    setTickets((prev) =>
      prev.map((t) => (t.id === selected.id ? { ...t, status: newStatus, assignedTo: newAssignee } : t)),
    );
    setSelected((prev) => (prev ? { ...prev, status: newStatus, assignedTo: newAssignee } : prev));
    setReply("");
    message.success("Reply sent and ticket updated");
  };

  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in-progress").length;

  const columns: ColumnsType<Ticket> = [
    { title: "Ticket ID", dataIndex: "id", render: (v: string) => <span className="font-mono text-xs font-semibold text-[var(--accent)]">{v}</span> },
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
    {
      title: "Category",
      dataIndex: "category",
      render: (v: string) => <span className="px-2 py-0.5 bg-[var(--hover)] text-[var(--text-dim)] rounded text-xs">{v}</span>,
    },
    { title: "Priority", dataIndex: "priority", render: (v: string) => <StatusTag status={v} /> },
    { title: "Created", dataIndex: "created", render: (v: string) => <span className="text-xs text-[var(--text-faint)]">{v}</span> },
    { title: "Assigned To", dataIndex: "assignedTo", render: (v: string) => <span className="text-sm text-[var(--text-dim)]">{v}</span> },
    { title: "Status", dataIndex: "status", render: (v: string) => <StatusTag status={v} /> },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            openTicket(record);
          }}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <Title level={4} className="!mb-0.5">
            IT Helpdesk
          </Title>
          <Text className="text-xs text-[var(--text-faint)]">
            {openCount} open · {inProgressCount} in progress
          </Text>
        </div>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          className="!w-[150px]"
          options={[
            { value: "all", label: "All" },
            { value: "open", label: "Open" },
            { value: "in-progress", label: "In Progress" },
            { value: "closed", label: "Closed" },
          ]}
        />
      </div>

      <Table<Ticket>
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        size="middle"
        scroll={{ x: "max-content" }}
        onRow={(record) => ({ onClick: () => openTicket(record), style: { cursor: "pointer" } })}
        pagination={{ pageSize: 10, showTotal: (t) => `Total ${t} tickets` }}
      />

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.id} — Ticket Detail` : ""}
        size={420}
      >
        {selected && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusTag status={selected.priority} />
              <StatusTag status={selected.status} />
              <span className="px-2 py-0.5 bg-[var(--hover)] text-[var(--text-dim)] rounded text-xs">{selected.category}</span>
            </div>

            <div className="bg-[var(--hover)] rounded-lg p-3.5 border border-[var(--border)]">
              <p className="text-sm text-[var(--text)] leading-relaxed m-0">{selected.desc}</p>
            </div>

            <section>
              <h4 className="text-xs font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-3">Details</h4>
              <div className="flex flex-col gap-2">
                {[
                  ["Raised by", selected.employee],
                  ["Category", selected.category],
                  ["Priority", selected.priority],
                  ["Created", selected.created],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center text-sm">
                    <span className="text-[var(--text-faint)] w-24 flex-shrink-0">{k}</span>
                    <span className="text-[var(--text)] font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h4 className="text-xs font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-3">Update</h4>
              <div className="flex flex-col gap-2">
                <Select
                  value={newStatus}
                  onChange={setNewStatus}
                  className="w-full"
                  options={[
                    { value: "open", label: "Open" },
                    { value: "in-progress", label: "In Progress" },
                    { value: "closed", label: "Closed" },
                  ]}
                />
                <Select
                  value={newAssignee}
                  onChange={setNewAssignee}
                  className="w-full"
                  options={ASSIGNEE_OPTIONS.map((a) => ({ value: a, label: a }))}
                />
              </div>
            </section>

            <section>
              <h4 className="text-xs font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-3">Reply</h4>
              <TextArea
                rows={4}
                placeholder="Type your response to the employee..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <Button type="primary" icon={<SendOutlined />} onClick={sendReply} className="mt-2">
                Send Reply &amp; Update
              </Button>
            </section>
          </div>
        )}
      </Drawer>
    </div>
  );
}
