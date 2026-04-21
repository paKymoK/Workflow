import { useState } from "react";
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { WorkflowStatus } from "../../api/types";
import {
  useCreateStatus,
  useDeleteStatus,
  useStatuses,
  useUpdateStatus,
} from "../../hooks/useTickets";

const groupOptions = [
  { label: "To Do", value: "TODO" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Done", value: "DONE" },
];

export default function StatusList() {
  const { data = [], isLoading } = useStatuses();
  const createMutation = useCreateStatus();
  const updateMutation = useUpdateStatus();
  const deleteMutation = useDeleteStatus();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkflowStatus | null>(null);
  const [form] = Form.useForm();

  const onCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const onEdit = (record: WorkflowStatus) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      color: record.color,
      group: record.group,
    });
    setOpen(true);
  };

  const onSubmit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setOpen(false);
  };

  const columns: ColumnsType<WorkflowStatus> = [
    { title: "ID", dataIndex: "id", width: 80 },
    {
      title: "Name",
      dataIndex: "name",
      render: (_, record) => <Tag color={record.color}>{record.name}</Tag>,
    },
    { title: "Color", dataIndex: "color", width: 120 },
    { title: "Group", dataIndex: "group", width: 160 },
    {
      title: "Action",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => onEdit(record)}>Edit</Button>
          <Popconfirm title="Delete this status?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="mb-3">
        <Button type="primary" onClick={onCreate}>Add Status</Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={data} loading={isLoading} pagination={false} />
      <Modal
        title={editing ? "Edit Status" : "Create Status"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="color" label="Color" rules={[{ required: true }]}>
            <Input placeholder="#1677ff" />
          </Form.Item>
          <Form.Item name="group" label="Group" rules={[{ required: true }]}>
            <Select options={groupOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
