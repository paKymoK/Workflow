import { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button, message } from "antd";
import { fetchProjects } from "../api/ticketApi";
import type { Project } from "../api/types";

const { TextArea } = Input;

interface CreateTicketModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTicketModal({
  open,
  onClose,
  onSuccess,
}: CreateTicketModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [form] = Form.useForm();

  // Fetch projects when modal opens
  useEffect(() => {
    if (open) {
      loadProjects();
    }
  }, [open]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      message.error("Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  };

  const issueTypes = [
    { id: 1, name: "Bug", projectId: 1 },
    { id: 2, name: "Feature", projectId: 1 },
    { id: 3, name: "Task", projectId: 1 },
    { id: 4, name: "Bug", projectId: 2 },
    { id: 5, name: "Enhancement", projectId: 2 },
  ];

  const priorities = [
    { id: 1, name: "Low" },
    { id: 2, name: "Medium" },
    { id: 3, name: "High" },
    { id: 4, name: "Critical" },
  ];

  // Filter issue types based on selected project
  const filteredIssueTypes = selectedProjectId
    ? issueTypes.filter((type) => type.projectId === selectedProjectId)
    : [];

  const handleProjectChange = (projectId: number) => {
    setSelectedProjectId(projectId);
    // Reset issueType when project changes
    form.setFieldValue("issueTypeId", undefined);
  };

  const handleCreateTicket = async (values: any) => {
    console.log("Form values:", values);
    // API call will be added here
    // After successful creation:
    // - Close modal
    // - Refresh ticket list
    // - Show success message

    form.resetFields();
    setSelectedProjectId(null);
    onSuccess();
  };

  const handleClose = () => {
    form.resetFields();
    setSelectedProjectId(null);
    onClose();
  };

  return (
    <Modal
      title="Create Ticket"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleCreateTicket}
        className="mt-4"
      >
        <Form.Item
          label="Summary"
          name="summary"
          rules={[{ required: true, message: "Please enter a summary" }]}
        >
          <Input placeholder="Enter ticket summary" />
        </Form.Item>

        <Form.Item
          label="Project"
          name="projectId"
          rules={[{ required: true, message: "Please select a project" }]}
        >
          <Select
            placeholder="Select a project"
            loading={loadingProjects}
            onChange={handleProjectChange}
            options={projects.map((p) => ({
              label: `${p.name} (${p.code})`,
              value: p.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Issue Type"
          name="issueTypeId"
          rules={[{ required: true, message: "Please select an issue type" }]}
        >
          <Select
            placeholder={
              selectedProjectId
                ? "Select an issue type"
                : "Please select a project first"
            }
            disabled={!selectedProjectId}
            options={filteredIssueTypes.map((type) => ({
              label: type.name,
              value: type.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Priority"
          name="priority"
          rules={[{ required: true, message: "Please select a priority" }]}
        >
          <Select
            placeholder="Select priority"
            options={priorities.map((p) => ({
              label: p.name,
              value: p.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Detail"
          name={["detail", "data"]}
          rules={[{ required: true, message: "Please enter ticket details" }]}
        >
          <TextArea rows={4} placeholder="Enter ticket details" />
        </Form.Item>

        <Form.Item className="mb-0 text-right">
          <Button onClick={handleClose} className="mr-2">
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            Create
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
