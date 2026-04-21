import { useState } from "react";
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Project } from "../../api/types";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from "../../hooks/useTickets";
import { useWorkflows } from "../../hooks/useWorkflows";

export default function ProjectList() {
  const { data = [], isLoading } = useProjects();
  const { data: workflows = [] } = useWorkflows();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form] = Form.useForm();

  const onCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const onEdit = (record: Project) => {
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

  const workflowLabel = (workflowId: number) =>
    workflows.find((w) => w.id === workflowId)?.name ?? workflowId;

  const columns: ColumnsType<Project> = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "Name", dataIndex: "name" },
    { title: "Code", dataIndex: "code", width: 120 },
    {
      title: "Workflow",
      dataIndex: "workflowId",
      render: (workflowId: number) => workflowLabel(workflowId),
    },
    {
      title: "Action",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => onEdit(record)}>Edit</Button>
          <Popconfirm title="Delete this project?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="mb-3">
        <Button type="primary" onClick={onCreate}>Add Project</Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={data} loading={isLoading} pagination={false} />
      <Modal
        title={editing ? "Edit Project" : "Create Project"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="workflowId" label="Workflow" rules={[{ required: true }]}>
            <Select
              options={workflows.map((w) => ({ label: w.name, value: w.id }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
