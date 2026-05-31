import { useState } from "react";
import { Table, Tag, Spin, Button, Modal, Form, Input, Select, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import type { Workflow, WorkflowStatus } from "../../api/types";
import { useWorkflows, useCreateWorkflow } from "../../hooks/useWorkflows";
import { useStatuses } from "../../hooks/useTickets";

const groupOptions = [
  { label: "To Do",      value: "TODO" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Done",       value: "DONE" },
];

export default function WorkflowList() {
  const navigate                            = useNavigate();
  const { data: workflows = [], isLoading } = useWorkflows();
  const { data: allStatuses = [] }          = useStatuses();
  const createMutation                      = useCreateWorkflow();
  const [messageApi, ctx]                   = message.useMessage();

  const [open, setOpen] = useState(false);
  const [form]          = Form.useForm();

  const onOpen  = () => { form.resetFields(); setOpen(true); };
  const onClose = () => setOpen(false);

  const onSubmit = async () => {
    const values = await form.validateFields();
    const selectedStatuses: WorkflowStatus[] = allStatuses.filter((s) =>
      values.statuses.includes(s.id),
    );
    const hasTodo = selectedStatuses.some((s) => s.group === "TODO");
    if (!hasTodo) {
      messageApi.error("Workflow must include at least one TODO status.");
      return;
    }
    await createMutation.mutateAsync({
      name:        values.name,
      statuses:    values.statuses,
      transitions: [],
    });
    messageApi.success("Workflow created");
    setOpen(false);
  };

  const columns: ColumnsType<Workflow> = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "Name", dataIndex: "name" },
    {
      title: "Statuses",
      dataIndex: "statuses",
      render: (statuses: WorkflowStatus[]) => (
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map((s) => <Tag key={s.id} color={s.color}>{s.name}</Tag>)}
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

  if (isLoading) return <div className="text-center py-12"><Spin /></div>;

  return (
    <>
      {ctx}
      <div className="mb-3">
        <Button type="primary" onClick={onOpen}>New Workflow</Button>
      </div>

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

      <Modal
        title="New Workflow"
        open={open}
        onCancel={onClose}
        onOk={onSubmit}
        confirmLoading={createMutation.isPending}
        okText="Create"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. IT Approval Line" />
          </Form.Item>
          <Form.Item
            name="statuses"
            label="Statuses"
            rules={[{ required: true, message: "Select at least one status" }]}
            extra="Must include at least one TODO status."
          >
            <Select
              mode="multiple"
              placeholder="Select statuses"
              optionFilterProp="label"
              options={allStatuses.map((s) => ({
                label: (
                  <span className="flex items-center gap-1.5">
                    <Tag color={s.color} className="!m-0">{s.name}</Tag>
                    <span className="text-gray-400 text-xs">
                      {groupOptions.find((g) => g.value === s.group)?.label}
                    </span>
                  </span>
                ),
                value: s.id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
