import { useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Priority } from "../../api/types";
import {
  useCreatePriority,
  useDeletePriority,
  usePriorities,
  useUpdatePriority,
} from "../../hooks/useTickets";

export default function PriorityList() {
  const { data = [], isLoading } = usePriorities();
  const createMutation = useCreatePriority();
  const updateMutation = useUpdatePriority();
  const deleteMutation = useDeletePriority();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Priority | null>(null);
  const [form] = Form.useForm();

  const onCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const onEdit = (record: Priority) => {
    setEditing(record);
    form.setFieldsValue(record);
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

  const columns: ColumnsType<Priority> = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "Name", dataIndex: "name" },
    { title: "Response Time", dataIndex: "responseTime", width: 160 },
    { title: "Resolution Time", dataIndex: "resolutionTime", width: 160 },
    {
      title: "Action",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => onEdit(record)}>Edit</Button>
          <Popconfirm title="Delete this priority?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="mb-3">
        <Button type="primary" onClick={onCreate}>Add Priority</Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={data} loading={isLoading} pagination={false} />
      <Modal
        title={editing ? "Edit Priority" : "Create Priority"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="responseTime" label="Response Time" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={1} />
          </Form.Item>
          <Form.Item name="resolutionTime" label="Resolution Time" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
