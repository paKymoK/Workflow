import { useState } from "react";
import {
  Button, Form, Input, Popconfirm, Radio,
  Select, Table, Tag,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { ClientRoleAssignment } from "../../api/types";
import { useClients } from "../../hooks/useClients";
import { useClientRoles, useAssignClientRole, useRemoveClientRole } from "../../hooks/useClientRoles";
import { useUsers } from "../../hooks/useUsers";
import { useGroups } from "../../hooks/useGroups";

function AssignForm({ clientId, onDone }: { clientId: string; onDone: () => void }) {
  const [form] = Form.useForm();
  const [subjectType, setSubjectType] = useState<"USER" | "GROUP">("USER");

  const { data: assignments = [] } = useClientRoles(clientId);
  const { data: usersPage } = useUsers(0, 100);
  const { data: groups = [] } = useGroups();
  const assignMutation = useAssignClientRole(clientId);

  const assignedUserSubs = assignments.filter((a) => a.type === "USER").map((a) => a.subjectId);
  const assignedGroupIds = assignments.filter((a) => a.type === "GROUP").map((a) => a.subjectId);

  const userOptions = (usersPage?.content ?? [])
    .filter((u) => !assignedUserSubs.includes(u.sub))
    .map((u) => ({ value: u.sub, label: `${u.name} (${u.email})` }));

  const groupOptions = groups
    .filter((g) => !assignedGroupIds.includes(g.id))
    .map((g) => ({ value: g.id, label: g.name }));

  const onSubmit = async () => {
    const { subjectId, role } = await form.validateFields();
    await assignMutation.mutateAsync(
      subjectType === "USER" ? { userSub: subjectId, role } : { groupId: subjectId, role },
    );
    form.resetFields();
    onDone();
  };

  return (
    <Form form={form} layout="inline" className="mb-4 flex flex-wrap gap-2">
      <Form.Item style={{ marginBottom: 0 }}>
        <Radio.Group
          value={subjectType}
          onChange={(e) => { setSubjectType(e.target.value); form.resetFields(["subjectId"]); }}
        >
          <Radio.Button value="USER">User</Radio.Button>
          <Radio.Button value="GROUP">Group</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item name="subjectId" rules={[{ required: true, message: "" }]} style={{ marginBottom: 0, minWidth: 220 }}>
        <Select
          showSearch
          placeholder={subjectType === "USER" ? "Select user…" : "Select group…"}
          options={subjectType === "USER" ? userOptions : groupOptions}
          filterOption={(input, opt) =>
            (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
        />
      </Form.Item>

      <Form.Item name="role" rules={[{ required: true, message: "" }]} style={{ marginBottom: 0 }}>
        <Input placeholder="Role  e.g. ADMIN" style={{ width: 160 }} />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          loading={assignMutation.isPending}
          onClick={onSubmit}
        >
          Assign
        </Button>
      </Form.Item>
    </Form>
  );
}

export default function RoleList() {
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);

  const activeClient = clients.find((c) => c.id === selectedClientId);
  const { data: assignments = [], isLoading: rolesLoading } = useClientRoles(selectedClientId ?? "");
  const removeMutation = useRemoveClientRole(selectedClientId ?? "");

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.clientId,
  }));

  const columns: ColumnsType<ClientRoleAssignment> = [
    {
      title: "Type",
      dataIndex: "type",
      width: 90,
      render: (t: string) => <Tag color={t === "USER" ? "blue" : "purple"}>{t}</Tag>,
    },
    { title: "Name", dataIndex: "subjectName" },
    {
      title: "Role",
      dataIndex: "role",
      render: (r: string) => <Tag color="green">{r}</Tag>,
    },
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
    <>
      <div className="flex items-center gap-3 mb-4">
        <Select
          placeholder="Select a client…"
          loading={clientsLoading}
          options={clientOptions}
          value={selectedClientId}
          onChange={(v) => { setSelectedClientId(v); setShowForm(false); }}
          style={{ width: 240 }}
        />
        {activeClient && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowForm((p) => !p)}
          >
            Assign Role
          </Button>
        )}
      </div>

      {activeClient && showForm && (
        <AssignForm clientId={activeClient.id} onDone={() => setShowForm(false)} />
      )}

      {activeClient ? (
        <Table<ClientRoleAssignment>
          rowKey="id"
          columns={columns}
          dataSource={assignments}
          loading={rolesLoading}
          pagination={false}
        />
      ) : (
        <div className="text-[rgba(240,240,240,0.3)] text-sm mt-8 text-center">
          Select a client to manage its role assignments.
        </div>
      )}
    </>
  );
}
