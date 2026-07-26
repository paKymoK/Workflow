import { useMemo, useRef, useState } from "react";
import {
  Button,
  Input,
  Select,
  AutoComplete,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Typography,
  Drawer,
  Empty,
  message as antMessage,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  FileTextOutlined,
  InboxOutlined,
  UndoOutlined,
  UploadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchDocuments,
  createDocument,
  updateDocument,
  setDocumentArchived,
  type DocumentPost,
  type DocumentInput,
  type DocumentStatus,
} from "../../api/documentsApi";
import { uploadFile, getFileUrl } from "../../api/ticketApi";

const STATUS_FILTERS = ["Active", "Archived", "All"] as const;
const DEFAULT_CATEGORY_OPTIONS = [
  "HR Policies",
  "Attendance Policy",
  "Code of Conduct",
  "IT & Data Usage Policy",
  "Compensation & Benefits",
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentFormValues {
  category: string;
  title: string;
  version?: string;
  content?: string;
}

export default function Documents() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("Active");
  const [viewingDoc, setViewingDoc] = useState<DocumentPost | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentPost | null>(null);
  const [fileInfo, setFileInfo] = useState<{ url: string; name: string; size: number } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [form] = Form.useForm<DocumentFormValues>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status: DocumentStatus | undefined = statusFilter === "All" ? undefined : (statusFilter.toUpperCase() as DocumentStatus);
  const { data, isLoading } = useQuery({
    queryKey: ["documents", status],
    queryFn: () => fetchDocuments(undefined, status),
  });

  const categoryOptions = useMemo(() => {
    const fromData = (data?.content ?? []).map((d) => d.category);
    return Array.from(new Set([...DEFAULT_CATEGORY_OPTIONS, ...fromData]));
  }, [data]);

  const filtered = useMemo(
    () =>
      (data?.content ?? []).filter(
        (d) =>
          (categoryFilter === "All" || d.category === categoryFilter) &&
          d.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [data, search, categoryFilter],
  );

  const invalidateDocuments = () => queryClient.invalidateQueries({ queryKey: ["documents"] });

  const saveMutation = useMutation({
    mutationFn: (payload: DocumentInput) =>
      editingDoc ? updateDocument(editingDoc.id, payload) : createDocument(payload),
    onSuccess: () => {
      antMessage.success(editingDoc ? "Document updated" : "Document uploaded");
      invalidateDocuments();
      closeModal();
    },
    onError: () => antMessage.error("Could not save document"),
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, archived }: { id: number; archived: boolean }) => setDocumentArchived(id, archived),
    onSuccess: (_, { archived }) => {
      antMessage.success(archived ? "Document archived" : "Document restored");
      invalidateDocuments();
    },
    onError: () => antMessage.error("Could not update document status"),
  });

  const openCreate = () => {
    setEditingDoc(null);
    form.resetFields();
    setFileInfo(null);
    setModalOpen(true);
  };

  const openEdit = (doc: DocumentPost) => {
    setEditingDoc(doc);
    form.setFieldsValue({
      category: doc.category,
      title: doc.title,
      version: doc.version ?? undefined,
      content: doc.content ?? undefined,
    });
    setFileInfo(doc.fileUrl ? { url: doc.fileUrl, name: doc.fileName ?? "file", size: doc.fileSize ?? 0 } : null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleFilePick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const uploaded = await uploadFile(file);
      setFileInfo({ url: getFileUrl(uploaded.id, uploaded.extension), name: uploaded.name, size: file.size });
    } catch {
      antMessage.error("Could not upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = (values: DocumentFormValues) => {
    if (!values.content?.trim() && !fileInfo) {
      antMessage.error("Add content, a file, or both");
      return;
    }
    saveMutation.mutate({
      category: values.category,
      title: values.title,
      version: values.version || null,
      content: values.content || null,
      fileUrl: fileInfo?.url ?? null,
      fileName: fileInfo?.name ?? null,
      fileSize: fileInfo?.size ?? null,
    });
  };

  const columns: ColumnsType<DocumentPost> = [
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
      render: (version: string | null) =>
        version ? (
          <span className="font-mono text-xs text-[var(--text-dim)] bg-[var(--hover)] px-1.5 py-0.5 rounded">
            {version}
          </span>
        ) : (
          <span className="text-[var(--text-faint)]">—</span>
        ),
    },
    {
      title: "Uploaded",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) => (
        <span className="text-xs text-[var(--text-dim)] whitespace-nowrap">{formatDate(createdAt)}</span>
      ),
    },
    {
      title: "Size",
      dataIndex: "fileSize",
      key: "fileSize",
      render: (fileSize: number | null) => <span className="text-xs text-[var(--text-dim)]">{formatBytes(fileSize)}</span>,
    },
    {
      title: "Acknowledged",
      key: "acknowledged",
      render: (_, record) => (
        <span className="font-mono text-xs text-[var(--text-dim)]">
          {record.acknowledgedCount}/{record.totalActiveEmployees}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: DocumentStatus) => <Tag color={status === "ACTIVE" ? "success" : "default"}>{status === "ACTIVE" ? "Active" : "Archived"}</Tag>,
    },
    {
      title: "",
      key: "actions",
      width: 110,
      render: (_, record) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setViewingDoc(record)} />
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Button
            type="text"
            size="small"
            danger={record.status === "ACTIVE"}
            icon={record.status === "ACTIVE" ? <InboxOutlined /> : <UndoOutlined />}
            title={record.status === "ACTIVE" ? "Archive" : "Restore"}
            onClick={() => archiveMutation.mutate({ id: record.id, archived: record.status === "ACTIVE" })}
          />
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
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
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
          className="!w-52"
          options={["All", ...categoryOptions].map((o) => ({ value: o, label: o }))}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          className="!w-36"
          options={STATUS_FILTERS.map((o) => ({ value: o, label: o }))}
        />
      </div>

      <Table<DocumentPost>
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        locale={{
          emptyText: <Empty description="No documents found" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-6" />,
        }}
      />

      <Modal title={editingDoc ? "Edit Document" : "Upload Document"} open={modalOpen} onCancel={closeModal} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Document Title" name="title" rules={[{ required: true, message: "Title is required" }]}>
            <Input placeholder="Document name..." />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Category" name="category" rules={[{ required: true, message: "Category is required" }]}>
              <AutoComplete
                options={categoryOptions.map((o) => ({ value: o }))}
                filterOption={(input, option) => (option?.value ?? "").toLowerCase().includes(input.toLowerCase())}
                placeholder="Select or type a category"
              />
            </Form.Item>
            <Form.Item label="Version" name="version">
              <Input placeholder="v1.0" />
            </Form.Item>
          </div>
          <Form.Item label="Content (optional)" name="content">
            <Input.TextArea rows={5} placeholder="Inline policy text, read in the mobile app..." />
          </Form.Item>
          <Form.Item label="File (optional)">
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={(e) => {
                handleFilePick(e.target.files);
                e.target.value = "";
              }}
            />
            {fileInfo ? (
              <div className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
                <span className="text-sm text-[var(--text)] truncate">{fileInfo.name}</span>
                <Button size="small" shape="circle" icon={<CloseOutlined />} onClick={() => setFileInfo(null)} />
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center hover:border-[var(--accent)] cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadOutlined className="text-xl mb-2 text-[var(--text-faint)] block" />
                <p className="text-sm text-[var(--text-faint)]">{uploadingFile ? "Uploading..." : "Click to upload or drag & drop"}</p>
                <p className="text-xs text-[var(--text-faint)] mt-0.5">PDF, DOCX, XLSX up to 10 MB</p>
              </div>
            )}
          </Form.Item>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saveMutation.isPending} disabled={uploadingFile}>
              {editingDoc ? "Save Changes" : "Upload"}
            </Button>
          </div>
        </Form>
      </Modal>

      <Drawer title={viewingDoc?.title ?? ""} open={!!viewingDoc} onClose={() => setViewingDoc(null)} size={480}>
        {viewingDoc && (
          <>
            <Space size={6} className="mb-3">
              <Tag>{viewingDoc.category}</Tag>
              {viewingDoc.version && <Tag color="blue">{viewingDoc.version}</Tag>}
              <Tag color={viewingDoc.status === "ACTIVE" ? "success" : "default"}>
                {viewingDoc.status === "ACTIVE" ? "Active" : "Archived"}
              </Tag>
            </Space>
            <p className="text-xs text-[var(--text-faint)] mb-3">
              Uploaded {formatDate(viewingDoc.createdAt)} · Acknowledged {viewingDoc.acknowledgedCount}/{viewingDoc.totalActiveEmployees}{" "}
              employees
            </p>
            {viewingDoc.fileUrl && (
              <a
                href={viewingDoc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--accent)] hover:border-[var(--accent)]"
              >
                <FileTextOutlined />
                {viewingDoc.fileName ?? "Download file"} ({formatBytes(viewingDoc.fileSize)})
              </a>
            )}
            {viewingDoc.content && (
              <p className="text-sm whitespace-pre-wrap text-[var(--text)]">{viewingDoc.content}</p>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
