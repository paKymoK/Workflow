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
  ReadOutlined,
  InboxOutlined,
  UndoOutlined,
  UploadOutlined,
  CloseOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchTrainingMaterials,
  createTrainingMaterial,
  updateTrainingMaterial,
  setTrainingMaterialArchived,
  type TrainingMaterial,
  type TrainingMaterialInput,
  type TrainingFormat,
  type TrainingStatus,
} from "../../api/trainingApi";
import { uploadFile, getFileUrl, uploadVideo, waitForVideoReady } from "../../api/ticketApi";
import VideoPlayer from "../../components/VideoPlayer";

const STATUS_FILTERS = ["Active", "Archived", "All"] as const;
const FORMAT_OPTIONS: { value: TrainingFormat; label: string }[] = [
  { value: "PDF", label: "PDF" },
  { value: "VIDEO", label: "Video" },
  { value: "SLIDES", label: "Slides" },
];
const DEFAULT_CATEGORY_OPTIONS = ["Onboarding", "Skills Training", "Safety Training", "Company SOPs"];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface TrainingFormValues {
  category: string;
  title: string;
  format: TrainingFormat;
  duration?: string;
}

type VideoUploadState = "idle" | "uploading" | "processing" | "ready" | "failed";

export default function Training() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("Active");
  const [viewingMaterial, setViewingMaterial] = useState<TrainingMaterial | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<TrainingMaterial | null>(null);
  const [fileInfo, setFileInfo] = useState<{ url: string; name: string; size: number } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoState, setVideoState] = useState<VideoUploadState>("idle");
  const [videoError, setVideoError] = useState<string | null>(null);
  const [form] = Form.useForm<TrainingFormValues>();
  const format = Form.useWatch("format", form);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const status: TrainingStatus | undefined = statusFilter === "All" ? undefined : (statusFilter.toUpperCase() as TrainingStatus);
  const { data, isLoading } = useQuery({
    queryKey: ["training-materials", status],
    queryFn: () => fetchTrainingMaterials(undefined, status),
  });

  const categoryOptions = useMemo(() => {
    const fromData = (data?.content ?? []).map((m) => m.category);
    return Array.from(new Set([...DEFAULT_CATEGORY_OPTIONS, ...fromData]));
  }, [data]);

  const filtered = useMemo(
    () =>
      (data?.content ?? []).filter(
        (m) =>
          (categoryFilter === "All" || m.category === categoryFilter) &&
          m.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [data, search, categoryFilter],
  );

  const invalidateMaterials = () => queryClient.invalidateQueries({ queryKey: ["training-materials"] });

  const saveMutation = useMutation({
    mutationFn: (payload: TrainingMaterialInput) =>
      editingMaterial ? updateTrainingMaterial(editingMaterial.id, payload) : createTrainingMaterial(payload),
    onSuccess: () => {
      antMessage.success(editingMaterial ? "Training material updated" : "Training material uploaded");
      invalidateMaterials();
      closeModal();
    },
    onError: () => antMessage.error("Could not save training material"),
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, archived }: { id: number; archived: boolean }) => setTrainingMaterialArchived(id, archived),
    onSuccess: (_, { archived }) => {
      antMessage.success(archived ? "Training material archived" : "Training material restored");
      invalidateMaterials();
    },
    onError: () => antMessage.error("Could not update training material status"),
  });

  const resetUploadState = () => {
    setFileInfo(null);
    setVideoId(null);
    setVideoState("idle");
    setVideoError(null);
  };

  const openCreate = () => {
    setEditingMaterial(null);
    form.resetFields();
    resetUploadState();
    setModalOpen(true);
  };

  const openEdit = (material: TrainingMaterial) => {
    setEditingMaterial(material);
    form.setFieldsValue({
      category: material.category,
      title: material.title,
      format: material.format,
      duration: material.duration ?? undefined,
    });
    if (material.format === "VIDEO") {
      setFileInfo(null);
      setVideoId(material.videoId);
      setVideoState(material.videoId ? "ready" : "idle");
      setVideoError(null);
    } else {
      setVideoId(null);
      setVideoState("idle");
      setVideoError(null);
      setFileInfo(
        material.fileUrl ? { url: material.fileUrl, name: material.fileName ?? "file", size: material.fileSize ?? 0 } : null,
      );
    }
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

  const handleVideoPick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setVideoState("uploading");
    setVideoError(null);
    try {
      const job = await uploadVideo(file);
      setVideoState("processing");
      const result = await waitForVideoReady(job.jobId);
      if (result.status === "DONE") {
        setVideoId(result.videoId);
        setVideoState("ready");
      } else {
        setVideoState("failed");
        setVideoError(result.errorMessage ?? "Video processing failed");
      }
    } catch {
      setVideoState("failed");
      setVideoError("Could not upload video");
    }
  };

  const handleSubmit = (values: TrainingFormValues) => {
    if (values.format === "VIDEO") {
      if (!videoId) {
        antMessage.error("Upload a video and wait for processing to finish");
        return;
      }
      saveMutation.mutate({
        category: values.category,
        title: values.title,
        format: values.format,
        videoId,
        duration: values.duration || null,
      });
    } else {
      if (!fileInfo) {
        antMessage.error("Upload a file");
        return;
      }
      saveMutation.mutate({
        category: values.category,
        title: values.title,
        format: values.format,
        fileUrl: fileInfo.url,
        fileName: fileInfo.name,
        fileSize: fileInfo.size,
      });
    }
  };

  const submitDisabled =
    uploadingFile || videoState === "uploading" || videoState === "processing" || saveMutation.isPending;

  const columns: ColumnsType<TrainingMaterial> = [
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
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: "Format",
      dataIndex: "format",
      key: "format",
      render: (fmt: TrainingFormat) => <Tag color={fmt === "VIDEO" ? "red" : fmt === "SLIDES" ? "purple" : "blue"}>{fmt}</Tag>,
    },
    {
      title: "Duration / Size",
      key: "meta",
      render: (_, record) => (
        <span className="font-mono text-xs text-[var(--text-dim)]">
          {record.format === "VIDEO" ? (record.duration ?? "—") : formatBytes(record.fileSize)}
        </span>
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
      title: "Completed",
      key: "completed",
      render: (_, record) => (
        <span className="font-mono text-xs text-[var(--text-dim)]">
          {record.completedCount}/{record.totalActiveEmployees}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: TrainingStatus) => <Tag color={status === "ACTIVE" ? "success" : "default"}>{status === "ACTIVE" ? "Active" : "Archived"}</Tag>,
    },
    {
      title: "",
      key: "actions",
      width: 110,
      render: (_, record) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setViewingMaterial(record)} />
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
            Training Materials
          </Typography.Title>
          <p className="text-sm text-[var(--text-faint)]">Onboarding, skills, and safety training</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
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

      <Table<TrainingMaterial>
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        locale={{
          emptyText: <Empty description="No training materials found" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-6" />,
        }}
      />

      <Modal title={editingMaterial ? "Edit Training Material" : "Upload Training Material"} open={modalOpen} onCancel={closeModal} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Title" name="title" rules={[{ required: true, message: "Title is required" }]}>
            <Input placeholder="Training material name..." />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Category" name="category" rules={[{ required: true, message: "Category is required" }]}>
              <AutoComplete
                options={categoryOptions.map((o) => ({ value: o }))}
                filterOption={(input, option) => (option?.value ?? "").toLowerCase().includes(input.toLowerCase())}
                placeholder="Select or type a category"
              />
            </Form.Item>
            <Form.Item label="Format" name="format" rules={[{ required: true, message: "Format is required" }]} initialValue="PDF">
              <Select
                options={FORMAT_OPTIONS}
                onChange={() => resetUploadState()}
              />
            </Form.Item>
          </div>

          {format === "VIDEO" ? (
            <>
              <Form.Item label="Duration" name="duration">
                <Input placeholder="e.g. 8 min" />
              </Form.Item>
              <Form.Item label="Video File">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  hidden
                  onChange={(e) => {
                    handleVideoPick(e.target.files);
                    e.target.value = "";
                  }}
                />
                {videoState === "ready" && videoId ? (
                  <div className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
                    <span className="flex items-center gap-2 text-sm text-[var(--text)]">
                      <CheckCircleOutlined className="text-green-500" /> Video ready
                    </span>
                    <Button size="small" shape="circle" icon={<CloseOutlined />} onClick={resetUploadState} />
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center hover:border-[var(--accent)] cursor-pointer transition-colors"
                    onClick={() => videoState !== "uploading" && videoState !== "processing" && videoInputRef.current?.click()}
                  >
                    {videoState === "uploading" || videoState === "processing" ? (
                      <>
                        <LoadingOutlined className="text-xl mb-2 text-[var(--text-faint)] block" />
                        <p className="text-sm text-[var(--text-faint)]">
                          {videoState === "uploading" ? "Uploading..." : "Processing video..."}
                        </p>
                      </>
                    ) : (
                      <>
                        <UploadOutlined className="text-xl mb-2 text-[var(--text-faint)] block" />
                        <p className="text-sm text-[var(--text-faint)]">Click to upload a video</p>
                        {videoState === "failed" && <p className="text-xs text-red-500 mt-0.5">{videoError}</p>}
                      </>
                    )}
                  </div>
                )}
              </Form.Item>
            </>
          ) : (
            <Form.Item label="File">
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
                  <p className="text-xs text-[var(--text-faint)] mt-0.5">PDF, PPTX up to 10 MB</p>
                </div>
              )}
            </Form.Item>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saveMutation.isPending} disabled={submitDisabled}>
              {editingMaterial ? "Save Changes" : "Upload"}
            </Button>
          </div>
        </Form>
      </Modal>

      <Drawer title={viewingMaterial?.title ?? ""} open={!!viewingMaterial} onClose={() => setViewingMaterial(null)} size={480}>
        {viewingMaterial && (
          <>
            <Space size={6} className="mb-3">
              <Tag>{viewingMaterial.category}</Tag>
              <Tag color={viewingMaterial.format === "VIDEO" ? "red" : viewingMaterial.format === "SLIDES" ? "purple" : "blue"}>
                {viewingMaterial.format}
              </Tag>
              <Tag color={viewingMaterial.status === "ACTIVE" ? "success" : "default"}>
                {viewingMaterial.status === "ACTIVE" ? "Active" : "Archived"}
              </Tag>
            </Space>
            <p className="text-xs text-[var(--text-faint)] mb-3">
              Uploaded {formatDate(viewingMaterial.createdAt)} · Completed {viewingMaterial.completedCount}/{viewingMaterial.totalActiveEmployees}{" "}
              employees
            </p>
            {viewingMaterial.format === "VIDEO" && viewingMaterial.videoId ? (
              <VideoPlayer videoId={viewingMaterial.videoId} />
            ) : (
              viewingMaterial.fileUrl && (
                <a
                  href={viewingMaterial.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--accent)] hover:border-[var(--accent)]"
                >
                  <ReadOutlined />
                  {viewingMaterial.fileName ?? "Download file"} ({formatBytes(viewingMaterial.fileSize)})
                </a>
              )
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
