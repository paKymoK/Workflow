import { useState } from "react";
import { Modal, Form, Input, Select, Button, message } from "antd";
import type { CreateTicketRequest } from "../api/types";
import { useProjects, useIssueTypes, useCreateTicket } from "../hooks/useTickets";
import { usePriorities } from "../hooks/useTickets";

const { TextArea } = Input;

interface CreateTicketModalProps {
  open:      boolean;
  onClose:   () => void;
  onSuccess: () => void;
}

export default function CreateTicketModal({ open, onClose, onSuccess }: CreateTicketModalProps) {
  const [form]               = Form.useForm();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // ── Queries — reference data cached indefinitely ──────────────────────────
  const { data: projects   = [], isLoading: loadingProjects   } = useProjects();
  const { data: priorities = [], isLoading: loadingPriorities } = usePriorities();
  const { data: issueTypes = [], isLoading: loadingIssueTypes } = useIssueTypes(selectedProjectId);

  // ── Mutation ─────────────────────────────────────────────────────────────
  const createMutation = useCreateTicket();

  const handleProjectChange = (projectId: number) => {
    setSelectedProjectId(projectId);
    form.setFieldValue("issueTypeId", undefined);
  };

  const handleCreateTicket = async (values: CreateTicketRequest) => {
    try {
      await createMutation.mutateAsync(values);
      message.success("Ticket created successfully");
      form.resetFields();
      setSelectedProjectId(null);
      onSuccess();
    } catch (error) {
      const axiosError = error as { response?: { data?: { status?: { message?: string } } } };
      message.error(axiosError?.response?.data?.status?.message ?? "Failed to create ticket");
    }
  };

  const handleClose = () => {
    form.resetFields();
    setSelectedProjectId(null);
    onClose();
  };

  return (
    <Modal title="Create Ticket" open={open} onCancel={handleClose} footer={null} width={800}>
      <Form form={form} layout="vertical" onFinish={handleCreateTicket} className="mt-4">
        <Form.Item label="Summary" name="summary" rules={[{ required: true, message: "Please enter a summary" }]}>
          <Input placeholder="Enter ticket summary" />
        </Form.Item>

        <Form.Item label="Project" name="projectId" rules={[{ required: true, message: "Please select a project" }]}>
          <Select
            placeholder="Select a project"
            loading={loadingProjects}
            onChange={handleProjectChange}
            options={projects.map((p) => ({ label: `${p.name} (${p.code})`, value: p.id }))}
          />
        </Form.Item>

        <Form.Item label="Issue Type" name="issueTypeId" rules={[{ required: true, message: "Please select an issue type" }]}>
          <Select
            placeholder={selectedProjectId ? "Select an issue type" : "Please select a project first"}
            disabled={!selectedProjectId}
            loading={loadingIssueTypes}
            options={issueTypes.map((t) => ({ label: t.name, value: t.id }))}
          />
        </Form.Item>

        <Form.Item label="Priority" name="priority" rules={[{ required: true, message: "Please select a priority" }]}>
          <Select
            placeholder="Select priority"
            loading={loadingPriorities}
            options={priorities.map((p) => ({ label: p.name, value: p.id }))}
          />
        </Form.Item>

        <Form.Item label="Detail" name={["detail", "data"]} rules={[{ required: true, message: "Please enter ticket details" }]}>
          <TextArea rows={4} placeholder="Enter ticket details" />
        </Form.Item>

        <Form.Item className="mb-0 text-right">
          <Button onClick={handleClose} className="mr-2" disabled={createMutation.isPending}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending}>Create</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
