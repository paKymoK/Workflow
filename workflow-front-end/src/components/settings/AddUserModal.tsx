import { useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { createUser } from "../../api/ticketApi";

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  username: string;
  password: string;
  name: string;
  email: string;
  title: string;
  department: string;
}

export default function AddUserModal({ open, onClose, onSuccess }: AddUserModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await createUser({
        username: values.username,
        password: values.password,
        userinfo: {
          name: values.name,
          email: values.email,
          title: values.title,
          department: values.department,
        },
      });
      message.success("User registered successfully");
      onSuccess();
    } catch {
      message.error("Failed to register user");
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
      title="Register User"
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
          label="Username"
          name="username"
          rules={[{ required: true, message: "Please enter a username" }]}
        >
          <Input placeholder="username" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please enter a password" }]}
        >
          <Input.Password placeholder="password" />
        </Form.Item>

        <Form.Item
          label="Full Name"
          name="name"
          rules={[{ required: true, message: "Please enter the full name" }]}
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

        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter a title" }]}
        >
          <Input placeholder="Job title" />
        </Form.Item>

        <Form.Item
          label="Department"
          name="department"
          rules={[{ required: true, message: "Please enter a department" }]}
        >
          <Input placeholder="Department" />
        </Form.Item>

        <Form.Item className="mb-0 flex justify-end">
          <Button onClick={handleClose} className="mr-2" disabled={submitting}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Register
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
