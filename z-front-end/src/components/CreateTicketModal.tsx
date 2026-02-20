import { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button, message } from "antd";
import { fetchProjects, fetchPriorities, fetchIssueTypes, createTicket } from "../api/ticketApi";
import type { Project, Priority, IssueType, CreateTicketRequest } from "../api/types";

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
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingPriorities, setLoadingPriorities] = useState(false);
  const [loadingIssueTypes, setLoadingIssueTypes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Fetch data when modal opens
  useEffect(() => {
    if (open) {
      loadProjects();
      loadPriorities();
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

  const loadPriorities = async () => {
    setLoadingPriorities(true);
    try {
      const data = await fetchPriorities();
      setPriorities(data);
    } catch (error) {
      console.error("Failed to fetch priorities:", error);
      message.error("Failed to load priorities");
    } finally {
      setLoadingPriorities(false);
    }
  };

  const loadIssueTypes = async (projectId: number) => {
    setLoadingIssueTypes(true);
    try {
      const data = await fetchIssueTypes(projectId);
      setIssueTypes(data);
    } catch (error) {
      console.error("Failed to fetch issue types:", error);
      message.error("Failed to load issue types");
      setIssueTypes([]);
    } finally {
      setLoadingIssueTypes(false);
    }
  };

  const handleProjectChange = (projectId: number) => {
    setSelectedProjectId(projectId);
    // Reset issueType when project changes
    form.setFieldValue("issueTypeId", undefined);
    // Clear previous issue types
    setIssueTypes([]);
    // Fetch issue types for the selected project
    loadIssueTypes(projectId);
  };

  const handleCreateTicket = async (values: CreateTicketRequest) => {
    setSubmitting(true);
    try {
      await createTicket(values);
      message.success("Ticket created successfully");
      form.resetFields();
      setSelectedProjectId(null);
      setIssueTypes([]);
      onSuccess();
    } catch (error: any) {
      console.error("Failed to create ticket:", error);
      const errorMessage = error?.response?.data?.status?.message || "Failed to create ticket";
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setSelectedProjectId(null);
    setIssueTypes([]);
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
            loading={loadingIssueTypes}
            options={issueTypes.map((type) => ({
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
            loading={loadingPriorities}
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
          <Button onClick={handleClose} className="mr-2" disabled={submitting}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Create
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
