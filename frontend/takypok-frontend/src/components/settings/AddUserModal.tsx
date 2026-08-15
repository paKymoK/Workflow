import { useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { api } from "@takypok/shared";
import type { ResultMessage } from "../../api/types";

interface Props {
  open:      boolean;
  onClose:   () => void;
  onSuccess: () => void;
}

interface FormValues {
  username: string;
  password: string;
}

export default function AddUserModal({ open, onClose, onSuccess }: Props) {
  const [form]    = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // auth-service confirms the sub is real and announces it over Kafka — employee-service
      // reacts by creating a PENDING shell for it. There's no employee-service call here
      // anymore; a hand-typed sub can no longer create a row directly. HR completes the
      // profile (name/title/department) separately once the shell exists.
      await api.post<ResultMessage<void>>("/auth-service/v1/users", {
        username: values.username,
        password: values.password,
      });
      message.success("User registered successfully");
      form.resetFields();
      onSuccess();
    } catch {
      message.error("Failed to register user");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal title="Register User" open={open} onCancel={handleClose} footer={null} width={480}>
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
        <Form.Item label="Username" name="username" rules={[{ required: true }]}>
          <Input placeholder="username" />
        </Form.Item>
        <Form.Item label="Password" name="password" rules={[{ required: true }]}>
          <Input.Password placeholder="password" />
        </Form.Item>
        <Form.Item className="mb-0 flex justify-end">
          <Button onClick={handleClose} className="mr-2" disabled={loading}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>Register</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
