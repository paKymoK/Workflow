import { useState } from "react";
import {
  Button, Drawer, Form, Input, Popconfirm, Radio,
  Select, Space, Table, Tag,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { ClientRoleAssignment } from "../../api/types";
import { useClientRoles, useAssignClientRole, useRemoveClientRole } from "../../hooks/useClientRoles";
import { useUsers } from "../../hooks/useUsers";
import { useGroups } from "../../hooks/useGroups";

interface Props {
  clientId: string;
  clientLabel: string;
  open: boolean;
  onClose: () => void;
}

export default function ClientRolePanel({ clientId, clientLabel, open, onClose }: Props) {
  const { data: assignments = [], isLoading } = useClientRoles(clientId);
  const assignMutation = useAssignClientRole(clientId);
  const removeMutation = useRemoveClientRole(clientId);

  const { data: usersPage } = useUsers(0, 100);
  const allUsers = usersPage?.content ?? [];
  const { data: groups = [] } = useGroups();

  const [form] = Form.useForm();
  const [formOpen, setFormOpen] = useState(false);
  const [subjectType, setSubjectType] = useState<"USER" | "GROUP">("USER");

  const onAdd = () => {
    form.resetFields();
    setSubjectType("USER");
    setFormOpen(true);
  };

  const onSubmit = async () => {
    const { subjectId, role } = await form.validateFields();
    await assignMutation.mutateAsync(
      subjectType === "USER"
        ? { userSub: subjectId, role }
        : { groupId: subjectId, role },
    );
    setFormOpen(false);
  };

  const assignedUserSubs  = assignments.filter((a) => a.type === "USER").map((a) => a.subjectId);
  const assignedGroupIds  = assignments.filter((a) => a.type === "GROUP").map((a) => a.subjectId);

  const userOptions  = allUsers
    .filter((u) => !assignedUserSubs.includes(u.sub))
    .map((u) => ({ value: u.sub, label: `${u.name} (${u.email})` }));

  const groupOptions = groups
    .filter((g) => !assignedGroupIds.includes(g.id))
    .map((g) => ({ value: g.id, label: g.name }));

  const columns: ColumnsType<ClientRoleAssignment> = [
    {
      title: "Type",
      dataIndex: "type",
      width: 80,
      render: (t: string) => (
        <Tag color={t === "USER" ? "blue" : "purple"}>{t}</Tag>
      ),
    },
    { title: "Name",  dataIndex: "subjectName" },
    { title: "Role",  dataIndex: "role", render: (r) => <Tag color="green">{r}</Tag> },
    {
      title: "",
      width: 60,
      render: (_, record) => (
        <Popconfirm
          title="Remove this assignment?"
          onConfirm={() => removeMutation.mutate(record.id)}
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Drawer
      title={`Roles — ${clientLabel}`}
      open={open}
      onClose={onClose}
      width={520}
    >
      <div className="mb-3">
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Assign Role
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={assignments}
        loading={isLoading}
        pagination={false}
        size="small"
      />

      <Drawer
        title="Assign Role"
        open={formOpen}
        onClose={() => setFormOpen(false)}
        width={400}
        footer={
          <Space className="flex justify-end">
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="primary" loading={assignMutation.isPending} onClick={onSubmit}>
              Assign
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Assign to">
            <Radio.Group
              value={subjectType}
              onChange={(e) => {
                setSubjectType(e.target.value);
                form.resetFields(["subjectId"]);
              }}
            >
              <Radio.Button value="USER">User</Radio.Button>
              <Radio.Button value="GROUP">Group</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="subjectId" label={subjectType === "USER" ? "User" : "Group"} rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder={subjectType === "USER" ? "Select user…" : "Select group…"}
              options={subjectType === "USER" ? userOptions : groupOptions}
              filterOption={(input, opt) =>
                (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Input placeholder="e.g. ADMIN, VIEWER, EDITOR" />
          </Form.Item>
        </Form>
      </Drawer>
    </Drawer>
  );
}
