import { useState } from "react";
import { Modal, Form, Input, Select, Button, message } from "antd";
import type { CreateTicketRequest, InternalApplicationDetail } from "../api/types";
import { PROJECT_CODE_INTERNAL } from "../api/types";
import { useProjects, useIssueTypes, useApplications, useCreateTicket, usePriorities } from "../hooks/useTickets";
import RichTextEditor from "./RichTextEditor";
import AttachmentUpload from "./AttachmentUpload";
import RelatedLinksField, { type RelatedLinkEntry } from "./RelatedLinksField";

interface CreateTicketModalProps {
  open:      boolean;
  onClose:   () => void;
  onSuccess: () => void;
}

export default function CreateTicketModal({ open, onClose, onSuccess }: CreateTicketModalProps) {
  // Add more entries here to support additional countries
  const DIAL_CODES = [
    { label: "🇻🇳 +84", value: "+84" }, // Vietnam
    { label: "🇯🇵 +81", value: "+81" }, // Japan
    { label: "🇰🇷 +82", value: "+82" }, // Korea
  ];

  const [form]               = Form.useForm();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [dialCode, setDialCode] = useState("+84");

  const { data: projects      = [], isLoading: loadingProjects      } = useProjects();
  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;
  const isInternalApplication = selectedProject?.code === PROJECT_CODE_INTERNAL;

  // ── Queries — reference data cached indefinitely ──────────────────────────
  const { data: priorities    = [], isLoading: loadingPriorities    } = usePriorities();
  const { data: issueTypes    = [], isLoading: loadingIssueTypes    } = useIssueTypes(selectedProjectId);
  const { data: applications  = [], isLoading: loadingApplications  } = useApplications();

  // ── Mutation ─────────────────────────────────────────────────────────────
  const createMutation = useCreateTicket();

  const handleProjectChange = (projectId: number) => {
    setSelectedProjectId(projectId);
    form.setFieldValue("issueTypeId", undefined);
    form.setFieldValue("detail", undefined);
  };

  const handleCreateTicket = async (values: Record<string, unknown>) => {
    try {
      const detail = values.detail as InternalApplicationDetail | undefined;
      const payload: CreateTicketRequest = {
        summary:     values.summary as string,
        projectId:   values.projectId as number,
        issueTypeId: values.issueTypeId as number,
        priorityId:  values.priorityId as number,
        detail: isInternalApplication && detail
          ? {
              ...detail,
              phoneNumber:  detail.phoneNumber ? `${dialCode}${detail.phoneNumber}` : undefined,
              relatedLinks: (detail.relatedLinks as RelatedLinkEntry[] | undefined)
                ?.map(({ type, ticketId }) => ({ type, ticketId })),
            }
          : null,
      };
      await createMutation.mutateAsync(payload);
      message.success("Ticket created successfully");
      form.resetFields();
      setSelectedProjectId(null);
      setDialCode("+84");
      setEditorKey((k) => k + 1);
      onSuccess();
    } catch (error) {
      const axiosError = error as { response?: { data?: { status?: { message?: string } } } };
      message.error(axiosError?.response?.data?.status?.message ?? "Failed to create ticket");
    }
  };

  const handleClose = () => {
    form.resetFields();
    setSelectedProjectId(null);
    setDialCode("+84");
    setEditorKey((k) => k + 1);
    onClose();
  };

  return (
    <Modal
      title="Create Ticket"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={800}
      styles={{ body: { padding: 0 } }}
    >
      <Form form={form} layout="vertical" onFinish={handleCreateTicket}>
        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 pt-4 max-h-[65vh]">
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

          <Form.Item label="Priority" name="priorityId" rules={[{ required: true, message: "Please select a priority" }]}>
            <Select
              placeholder="Select priority"
              loading={loadingPriorities}
              options={priorities.map((p) => ({ label: p.name, value: p.id }))}
            />
          </Form.Item>

          {isInternalApplication && (
            <>
              <Form.Item
                label="Application"
                name={["detail", "application"]}
                rules={[{ required: true, message: "Please select an application" }]}
              >
                <Select
                  placeholder="Select an application"
                  loading={loadingApplications}
                  options={applications.map((a) => ({ label: a, value: a }))}
                />
              </Form.Item>

              <div className="grid grid-cols-2 gap-x-4">
                <Form.Item label="Department" name={["detail", "department"]}>
                  <Input placeholder="Enter department" />
                </Form.Item>

                <Form.Item label="Region" name={["detail", "region"]}>
                  <Input placeholder="Enter region" />
                </Form.Item>

                <Form.Item label="Location" name={["detail", "location"]}>
                  <Input placeholder="Enter location" />
                </Form.Item>

                <Form.Item label="Phone Number" name={["detail", "phoneNumber"]}>
                  <Input
                    addonBefore={
                      <Select
                        value={dialCode}
                        onChange={setDialCode}
                        options={DIAL_CODES}
                        style={{ width: 105 }}
                      />
                    }
                    placeholder="Enter phone number"
                  />
                </Form.Item>
              </div>

              <Form.Item
                label="Description"
                name={["detail", "description"]}
                valuePropName="content"
                rules={[{
                  required: true,
                  validator: (_, value: string) =>
                    value && value.replace(/<[^>]*>/g, "").trim()
                      ? Promise.resolve()
                      : Promise.reject("Please enter a description"),
                }]}
              >
                <RichTextEditor key={editorKey} placeholder="Describe the issue..." />
              </Form.Item>

              <Form.Item label="Related Tickets" name={["detail", "relatedLinks"]}>
                <RelatedLinksField />
              </Form.Item>

              <Form.Item label="Attachments" name={["detail", "attachment"]}>
                <AttachmentUpload />
              </Form.Item>
            </>
          )}
        </div>

        {/* Pinned footer */}
        <div className="flex justify-end gap-2 px-6 py-3 border-t border-[rgba(255,255,255,0.1)]">
          <Button onClick={handleClose} disabled={createMutation.isPending}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending}>Create</Button>
        </div>
      </Form>
    </Modal>
  );
}
