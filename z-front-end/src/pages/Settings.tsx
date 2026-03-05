import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, Table, Tag, Typography, Spin, Button, Modal, Form, Input, message, Drawer, Descriptions } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { ReactFlow, Background, Controls, MiniMap } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { fetchWorkflows, fetchUsers, fetchOrgChart, fetchUserBySub } from "../api/ticketApi";
import type { Workflow, WorkflowStatus, User, UserDetail } from "../api/types";
import { buildOrgChart } from "../utils/buildOrgChart";
import OrgNode from "../components/OrgNode";

const { Title } = Typography;

// ─── Workflow Tab ─────────────────────────────────────────────────────────────

function WorkflowList() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkflows()
      .then(setWorkflows)
      .finally(() => setLoading(false));
  }, []);

  const columns: ColumnsType<Workflow> = [
    {
      title: "ID",
      dataIndex: "id",
      width: 60,
    },
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Statuses",
      dataIndex: "statuses",
      render: (statuses: WorkflowStatus[]) => (
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map((s) => (
            <Tag key={s.id} color={s.color}>
              {s.name}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Transitions",
      dataIndex: "transitions",
      render: (transitions: Workflow["transitions"]) => (
        <div className="flex flex-col gap-1">
          {transitions.map((t, i) => (
            <span key={i}>
              <Tag color={t.from.color}>{t.from.name}</Tag>
              {"→"}
              <Tag color={t.to.color} className="!ml-1">{t.to.name}</Tag>
              <span className="text-gray-400 text-xs ml-1">({t.name})</span>
            </span>
          ))}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="text-center py-12">
        <Spin />
      </div>
    );
  }

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={workflows}
      pagination={false}
      onRow={(record) => ({
        onClick: () => navigate(`/settings/workflow/${record.id}`),
        style: { cursor: "pointer" },
      })}
    />
  );
}

// ─── Add User Modal ───────────────────────────────────────────────────────────

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function AddUserModal({ open, onClose, onSuccess }: AddUserModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: { name: string; email: string }) => {
    setSubmitting(true);
    try {
      // TODO: wire up POST /auth-service/v1/users when endpoint is available
      console.log("Add user payload:", values);
      message.info("Add user endpoint not implemented yet");
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Add User"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={480}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-4"
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please enter the user's name" }]}
        >
          <Input placeholder="Full name" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter an email address" },
            { type: "email", message: "Please enter a valid email address" },
          ]}
        >
          <Input placeholder="user@example.com" />
        </Form.Item>

        <Form.Item className="mb-0 flex justify-end">
          <Button onClick={handleClose} className="mr-2" disabled={submitting}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Add User
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ─── User Tab ─────────────────────────────────────────────────────────────────

function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const columns: ColumnsType<User> = [
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Add User
        </Button>
      </div>

      <Table
        rowKey="name"
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={false}
      />

      <AddUserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); setRefreshKey((k) => k + 1); }}
      />
    </>
  );
}

// ─── Org Chart Tab ────────────────────────────────────────────────────────────

const nodeTypes = { orgNode: OrgNode };

function OrgChartView() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Awaited<ReturnType<typeof fetchOrgChart>>>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchOrgChart()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const handleViewDetail = useCallback((sub: string) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    fetchUserBySub(sub)
      .then(setSelectedUser)
      .finally(() => setDetailLoading(false));
  }, []);

  const { nodes, edges } = useMemo(
    () => buildOrgChart(users ?? [], handleViewDetail),
    [users, handleViewDetail],
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <Spin />
      </div>
    );
  }

  return (
    <>
      <div className="h-[600px] border border-gray-100 rounded-lg">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      <Drawer
        title="User Detail"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ wrapper: { width: 360 } }}
      >
        {detailLoading ? (
          <div className="text-center py-12"><Spin /></div>
        ) : selectedUser ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Name">{selectedUser.name}</Descriptions.Item>
            <Descriptions.Item label="Email">{selectedUser.email}</Descriptions.Item>
            <Descriptions.Item label="Title">{selectedUser.title || "—"}</Descriptions.Item>
            <Descriptions.Item label="Department">{selectedUser.department || "—"}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

const tabs = [
  {
    key: "workflow",
    label: "Workflow",
    children: <WorkflowList />,
  },
  {
    key: "user",
    label: "User",
    children: <UserList />,
  },
  {
    key: "orgChart",
    label: "Org Chart",
    children: <OrgChartView />,
  },
];

export default function Settings() {
  return (
    <div>
      <Title level={3}>Settings</Title>
      <Tabs items={tabs} />
    </div>
  );
}
