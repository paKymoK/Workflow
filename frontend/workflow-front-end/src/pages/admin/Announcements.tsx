import { useMemo, useState } from "react";
import { Button, Input, Select, Table, Tag, Space, Modal, Form, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  CloseOutlined,
  InboxOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import StatusTag from "../../components/admin/StatusTag";
import { announcements } from "../../data/admin/mockData";

type Announcement = (typeof announcements)[number];

const STATUS_FILTERS = ["All", "Published", "Scheduled", "Draft"];
const CATEGORY_OPTIONS = ["Policy", "Safety", "HR", "Events", "Operations", "Benefits", "IT"];
const PUBLISH_OPTIONS = ["Publish Now", "Schedule", "Save as Draft"];

export default function Announcements() {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [form] = Form.useForm();

  const filtered = useMemo(
    () =>
      announcements.filter(
        (a) =>
          (statusFilter === "All" || a.status === statusFilter.toLowerCase()) &&
          a.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, statusFilter],
  );

  const handleClose = () => {
    form.resetFields();
    setShowCreate(false);
  };

  const columns: ColumnsType<Announcement> = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (title: string) => <span className="font-medium text-[var(--text)]">{title}</span>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => <span className="text-xs text-[var(--text-dim)] whitespace-nowrap">{date}</span>,
    },
    {
      title: "Author",
      dataIndex: "author",
      key: "author",
      render: (author: string) => <span className="text-xs text-[var(--text-dim)]">{author}</span>,
    },
    {
      title: "Views",
      dataIndex: "views",
      key: "views",
      render: (views: number) => (
        <span className="font-mono text-xs text-[var(--text-dim)]">{views > 0 ? views.toLocaleString() : "—"}</span>
      ),
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
          <Button type="text" size="small" icon={<EditOutlined />} />
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
            Announcements / News
          </Typography.Title>
          <p className="text-sm text-[var(--text-faint)]">Manage published and scheduled content</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>
          Create New Post
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Input
          allowClear
          prefix={<SearchOutlined className="text-[var(--text-faint)]" />}
          placeholder="Search announcements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          className="!w-40"
          options={STATUS_FILTERS.map((o) => ({ value: o, label: o }))}
        />
      </div>

      <Table<Announcement>
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        locale={{
          emptyText: (
            <div className="py-10 text-center text-[var(--text-faint)]">
              <InboxOutlined className="text-2xl mb-2 block" />
              No announcements found
            </div>
          ),
        }}
      />

      <Modal title="Create New Announcement" open={showCreate} onCancel={handleClose} footer={null} width={640}>
        <Form form={form} layout="vertical" onFinish={handleClose}>
          <Form.Item label="Title" name="title">
            <Input placeholder="Announcement title..." />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Category" name="category" initialValue={CATEGORY_OPTIONS[0]}>
              <Select options={CATEGORY_OPTIONS.map((o) => ({ value: o, label: o }))} />
            </Form.Item>
            <Form.Item label="Publish" name="publish" initialValue={PUBLISH_OPTIONS[0]}>
              <Select options={PUBLISH_OPTIONS.map((o) => ({ value: o, label: o }))} />
            </Form.Item>
          </div>
          <Form.Item label="Content" name="content">
            <Input.TextArea rows={6} placeholder="Write your announcement content here..." />
          </Form.Item>
          <Form.Item label="Image (optional)">
            <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-5 text-center hover:border-[var(--accent)] cursor-pointer transition-colors">
              <DownloadOutlined className="text-lg mb-1.5 text-[var(--text-faint)] block" />
              <p className="text-sm text-[var(--text-faint)]">Click to upload image</p>
            </div>
          </Form.Item>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Publish Announcement
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
