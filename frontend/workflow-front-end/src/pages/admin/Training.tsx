import { useMemo, useState } from "react";
import { Button, Input, Select, Table, Space, Modal, Form, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  CloseOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import StatusTag from "../../components/admin/StatusTag";
import { trainingData } from "../../data/admin/mockData";

type TrainingRow = (typeof trainingData)[number];

const TYPE_OPTIONS = ["Onboarding", "Safety", "Skills"];

export default function Training() {
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [form] = Form.useForm();

  const filtered = useMemo(
    () =>
      trainingData.filter(
        (t) =>
          (typeFilter === "All" || t.type === typeFilter) &&
          t.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, typeFilter],
  );

  const handleClose = () => {
    form.resetFields();
    setShowUpload(false);
  };

  const columns: ColumnsType<TrainingRow> = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (title: string) => (
        <div className="flex items-center gap-2">
          <ReadOutlined className="text-[var(--text-faint)] flex-shrink-0" />
          <span className="font-medium text-[var(--text)]">{title}</span>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => <StatusTag status={type} />,
    },
    {
      title: "Format",
      dataIndex: "format",
      key: "format",
      render: (format: string) => <span className="text-xs text-[var(--text-dim)]">{format}</span>,
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      render: (duration: string) => <span className="font-mono text-xs text-[var(--text-dim)]">{duration}</span>,
    },
    {
      title: "Uploaded",
      dataIndex: "uploaded",
      key: "uploaded",
      render: (uploaded: string) => <span className="text-xs text-[var(--text-dim)] whitespace-nowrap">{uploaded}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: "",
      key: "actions",
      width: 110,
      render: () => (
        <Space size={0}>
          <Button type="text" size="small" icon={<EyeOutlined />} />
          <Button type="text" size="small" icon={<DownloadOutlined />} />
          <Button type="text" size="small" danger icon={<CloseOutlined />} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <Typography.Title level={4} className="!mb-0.5 !text-[var(--text)]">
            Training Materials
          </Typography.Title>
          <p className="text-sm text-[var(--text-faint)]">Onboarding, skills, and safety training</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowUpload(true)}>
          Upload Material
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Input
          allowClear
          prefix={<SearchOutlined className="text-[var(--text-faint)]" />}
          placeholder="Search training materials..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          className="!w-40"
          options={["All", ...TYPE_OPTIONS].map((o) => ({ value: o, label: o }))}
        />
      </div>

      <Table<TrainingRow> columns={columns} dataSource={filtered} rowKey="id" pagination={{ pageSize: 10 }} />

      <Modal title="Upload Training Material" open={showUpload} onCancel={handleClose} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleClose}>
          <Form.Item label="Title" name="title">
            <Input placeholder="Training material name..." />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Type" name="type" initialValue={TYPE_OPTIONS[0]}>
              <Select options={TYPE_OPTIONS.map((o) => ({ value: o, label: o }))} />
            </Form.Item>
            <Form.Item label="Duration" name="duration">
              <Input placeholder="e.g. 45 min" />
            </Form.Item>
          </div>
          <Form.Item label="Upload File">
            <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center hover:border-[var(--accent)] cursor-pointer transition-colors">
              <DownloadOutlined className="text-xl mb-2 text-[var(--text-faint)] block" />
              <p className="text-sm text-[var(--text-faint)]">Click to upload or drag & drop</p>
              <p className="text-xs text-[var(--text-faint)] mt-0.5">PDF, MP4, PPTX up to 100 MB</p>
            </div>
          </Form.Item>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Upload
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
