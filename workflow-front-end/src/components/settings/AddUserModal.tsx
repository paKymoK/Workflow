import { useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUserModal({ open, onClose, onSuccess }: AddUserModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: { name: string; email: string }) => {
    setSubmitting(true);
    try {
      // TODO: wire up POST /auth-service/v1/users when endpoint is available
      console.log("Add user payload:", values);
      message.info("Add user endpoint not implemented yet");
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Add User"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={480}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-4"
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please enter the user's name" }]}
        >
          <Input placeholder="Full name" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter an email address" },
            { type: "email", message: "Please enter a valid email address" },
          ]}
        >
          <Input placeholder="user@example.com" />
        </Form.Item>

        <Form.Item className="mb-0 flex justify-end">
          <Button onClick={handleClose} className="mr-2" disabled={submitting}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Add User
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
