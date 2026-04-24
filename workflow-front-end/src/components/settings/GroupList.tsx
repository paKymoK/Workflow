import { useState } from "react";
import {
  Button, Drawer, Form, Input, Modal, Popconfirm,
  Select, Space, Table, Tag, Typography,
} from "antd";
import { PlusOutlined, TeamOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { UserGroup, GroupMember } from "../../api/types";
import {
  useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup,
  useAddGroupMember, useRemoveGroupMember,
} from "../../hooks/useGroups";
import { useUsers } from "../../hooks/useUsers";

const { Text } = Typography;

export default function GroupList() {
  const { data: groups = [], isLoading } = useGroups();
  const createMutation       = useCreateGroup();
  const updateMutation       = useUpdateGroup();
  const deleteMutation       = useDeleteGroup();
  const addMemberMutation    = useAddGroupMember();
  const removeMemberMutation = useRemoveGroupMember();

  // Fetch enough users for the member-add select (page 0, size 100)
  const { data: usersPage } = useUsers(0, 100);
  const allUsers = usersPage?.content ?? [];

  const [groupForm] = Form.useForm();
  const [groupOpen, setGroupOpen] = useState(false);
  const [editing,   setEditing]   = useState<UserGroup | null>(null);

  const [membersGroup, setMembersGroup] = useState<UserGroup | null>(null);
  const [addUserSub,   setAddUserSub]   = useState<string | undefined>();

  const onAdd = () => {
    setEditing(null);
    groupForm.resetFields();
    setGroupOpen(true);
  };

  const onEdit = (record: UserGroup) => {
    setEditing(record);
    groupForm.setFieldsValue({ name: record.name, description: record.description });
    setGroupOpen(true);
  };

  const onSubmit = async () => {
    const values = await groupForm.validateFields();
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setGroupOpen(false);
  };

  const onAddMember = async () => {
    if (!membersGroup || !addUserSub) return;
    await addMemberMutation.mutateAsync({ groupId: membersGroup.id, userSub: addUserSub });
    setAddUserSub(undefined);
  };

  // Keep the members panel in sync with latest group data
  const liveGroup = membersGroup
    ? (groups.find((g) => g.id === membersGroup.id) ?? membersGroup)
    : null;

  const memberOptions = allUsers
    .filter((u) => !liveGroup?.members.some((m) => m.sub === u.sub))
    .map((u) => ({ value: u.sub, label: `${u.name} (${u.email})` }));

  const memberColumns: ColumnsType<GroupMember> = [
    { title: "Name",  dataIndex: "name" },
    { title: "Email", dataIndex: "email", render: (v) => v ?? "-" },
    {
      title: "",
      width: 60,
      render: (_, m) => (
        <Popconfirm
          title="Remove from group?"
          onConfirm={() =>
            removeMemberMutation.mutate({ groupId: liveGroup!.id, userSub: m.sub })
          }
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const columns: ColumnsType<UserGroup> = [
    { title: "Name",        dataIndex: "name" },
    { title: "Description", dataIndex: "description", render: (v) => v ?? "-" },
    {
      title: "Members",
      dataIndex: "members",
      render: (members: GroupMember[]) => (
        <div className="flex flex-wrap gap-1">
          {members.length === 0
            ? <Text type="secondary" className="text-xs">—</Text>
            : members.map((m) => <Tag key={m.sub}>{m.name}</Tag>)
          }
        </div>
      ),
    },
    {
      title: "Action",
      width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<TeamOutlined />}  onClick={() => setMembersGroup(record)}>
            Members
          </Button>
          <Button size="small" icon={<EditOutlined />}  onClick={() => onEdit(record)} />
          <Popconfirm
            title="Delete this group?"
            description="All role assignments for this group will also be removed."
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="mb-3">
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Add Group
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={groups}
        loading={isLoading}
        pagination={false}
      />

      {/* Create / Edit group modal */}
      <Modal
        title={editing ? "Edit Group" : "Create Group"}
        open={groupOpen}
        onCancel={() => setGroupOpen(false)}
        onOk={onSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={groupForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Manage members drawer */}
      <Drawer
        title={`Members — ${liveGroup?.name ?? ""}`}
        open={!!membersGroup}
        onClose={() => setMembersGroup(null)}
        width={480}
      >
        <div className="flex gap-2 mb-4">
          <Select
            showSearch
            placeholder="Add a user…"
            value={addUserSub}
            onChange={setAddUserSub}
            options={memberOptions}
            filterOption={(input, opt) =>
              (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            className="flex-1"
          />
          <Button
            type="primary"
            onClick={onAddMember}
            disabled={!addUserSub}
            loading={addMemberMutation.isPending}
          >
            Add
          </Button>
        </div>

        <Table
          rowKey="sub"
          columns={memberColumns}
          dataSource={liveGroup?.members ?? []}
          pagination={false}
          size="small"
        />
      </Drawer>
    </>
  );
}
