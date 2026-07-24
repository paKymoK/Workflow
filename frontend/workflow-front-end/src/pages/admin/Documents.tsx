import { useMemo, useState } from "react";
import { Button, Input, Select, Table, Tag, Space, Modal, Form, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  CloseOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import StatusTag from "../../components/admin/StatusTag";
import { documentsData } from "../../data/admin/mockData";

type DocumentRow = (typeof documentsData)[number];

const CATEGORY_OPTIONS = ["HR Policy", "Safety", "IT", "Operations", "Finance"];

export default function Documents() {
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [form] = Form.useForm();

  const filtered = useMemo(
    () =>
      documentsData.filter(
        (d) =>
          (categoryFilter === "All" || d.category === categoryFilter) &&
          d.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, categoryFilter],
  );

  const handleClose = () => {
    form.resetFields();
    setShowUpload(false);
  };

  const columns: ColumnsType<DocumentRow> = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (title: string) => (
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-[var(--text-faint)] flex-shrink-0" />
          <span className="font-medium text-[var(--text)]">{title}</span>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      render: (version: string) => (
        <span className="font-mono text-xs text-[var(--text-dim)] bg-[var(--hover)] px-1.5 py-0.5 rounded">
          {version}
        </span>
      ),
    },
    {
      title: "Uploaded",
      dataIndex: "uploaded",
      key: "uploaded",
      render: (uploaded: string) => <span className="text-xs text-[var(--text-dim)] whitespace-nowrap">{uploaded}</span>,
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      render: (size: string) => <span className="text-xs text-[var(--text-dim)]">{size}</span>,
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
            Documents & Policies
          </Typography.Title>
          <p className="text-sm text-[var(--text-faint)]">Company documents with version history</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowUpload(true)}>
          Upload Document
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Input
          allowClear
          prefix={<SearchOutlined className="text-[var(--text-faint)]" />}
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={categoryFilter}
          onChange={setCategoryFilter}
          className="!w-44"
          options={["All", ...CATEGORY_OPTIONS].map((o) => ({ value: o, label: o }))}
        />
      </div>

      <Table<DocumentRow> columns={columns} dataSource={filtered} rowKey="id" pagination={{ pageSize: 10 }} />

      <Modal title="Upload Document" open={showUpload} onCancel={handleClose} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleClose}>
          <Form.Item label="Document Title" name="title">
            <Input placeholder="Document name..." />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Category" name="category" initialValue={CATEGORY_OPTIONS[0]}>
              <Select options={CATEGORY_OPTIONS.map((o) => ({ value: o, label: o }))} />
            </Form.Item>
            <Form.Item label="Version" name="version">
              <Input placeholder="v1.0" />
            </Form.Item>
          </div>
          <Form.Item label="File">
            <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center hover:border-[var(--accent)] cursor-pointer transition-colors">
              <DownloadOutlined className="text-xl mb-2 text-[var(--text-faint)] block" />
              <p className="text-sm text-[var(--text-faint)]">Click to upload or drag & drop</p>
              <p className="text-xs text-[var(--text-faint)] mt-0.5">PDF, DOCX, XLSX up to 20 MB</p>
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
