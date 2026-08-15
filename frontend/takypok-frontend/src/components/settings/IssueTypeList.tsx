import { useState } from "react";
import { Button, Form, Modal, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { IssueType } from "../../api/types";
import { useAllIssueTypes, useUpdateIssueType } from "../../hooks/useTickets";
import { useWorkflows } from "../../hooks/useWorkflows";

export default function IssueTypeList() {
  const { data = [], isLoading } = useAllIssueTypes();
  const { data: workflows = [] } = useWorkflows();
  const updateMutation = useUpdateIssueType();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IssueType | null>(null);
  const [form] = Form.useForm();

  const onEdit = (record: IssueType) => {
    setEditing(record);
    form.setFieldsValue({ workflowId: record.workflowId });
    setOpen(true);
  };

  const onSubmit = async () => {
    const values = await form.validateFields();
    if (!editing) return;
    await updateMutation.mutateAsync({ id: editing.id, workflowId: values.workflowId });
    setOpen(false);
  };

  const workflowLabel = (workflowId: number) =>
    workflows.find((w) => w.id === workflowId)?.name ?? workflowId;

  const columns: ColumnsType<IssueType> = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "Name", dataIndex: "name" },
    {
      title: "Code",
      dataIndex: "code",
      width: 160,
      render: (code: string) => <Tag>{code}</Tag>,
    },
    {
      title: "Workflow",
      dataIndex: "workflowId",
      render: (workflowId: number) => workflowLabel(workflowId),
    },
    {
      title: "Action",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => onEdit(record)}>Edit</Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table rowKey="id" columns={columns} dataSource={data} loading={isLoading} pagination={false} />
      <Modal
        title={`Edit Issue Type — ${editing?.name}`}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSubmit}
        confirmLoading={updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
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
