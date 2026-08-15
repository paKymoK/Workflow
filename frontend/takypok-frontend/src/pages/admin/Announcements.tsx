import { useMemo, useRef, useState } from "react";
import {
  Button,
  Input,
  Select,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Typography,
  Drawer,
  Switch,
  Popconfirm,
  Empty,
  message as antMessage,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  UploadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchNewsFeed,
  createNewsPost,
  updateNewsPost,
  deleteNewsPost,
  setNewsPostPinned,
  fetchNewsComments,
  deleteNewsComment,
  TYPE_TO_LABEL,
  type NewsType,
  type NewsPost,
  type NewsPostInput,
} from "../../api/newsApi";
import { uploadFile, getFileUrl } from "../../api/ticketApi";
import { resizeImageForUpload } from "../../utils/imageResize";

const TYPE_OPTIONS: NewsType[] = ["NEWS", "EVENTS", "UNION", "RECOGNITION"];
const TYPE_FILTERS = ["All", ...TYPE_OPTIONS] as const;
const TYPE_COLORS: Record<NewsType, string> = {
  NEWS: "blue",
  EVENTS: "green",
  UNION: "purple",
  RECOGNITION: "gold",
};

function authorName(author: NewsPost["author"]): string {
  return author?.name ?? "Anonymous";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface AnnouncementFormValues {
  type: NewsType;
  title: string;
  body: string;
  isAnonymous?: boolean;
}

export default function Announcements() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]>("All");
  const [viewingPost, setViewingPost] = useState<NewsPost | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form] = Form.useForm<AnnouncementFormValues>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const type = typeFilter === "All" ? undefined : (typeFilter as NewsType);
  const { data, isLoading } = useQuery({
    queryKey: ["news", type],
    queryFn: () => fetchNewsFeed(type),
  });
  const filtered = useMemo(
    () => (data?.content ?? []).filter((p) => p.title.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const invalidateNews = () => queryClient.invalidateQueries({ queryKey: ["news"] });

  const saveMutation = useMutation({
    mutationFn: (payload: NewsPostInput) =>
      editingPost ? updateNewsPost(editingPost.id, payload) : createNewsPost(payload),
    onSuccess: () => {
      antMessage.success(editingPost ? "Post updated" : "Post published");
      invalidateNews();
      closeModal();
    },
    onError: () => antMessage.error("Could not save post"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteNewsPost(id),
    onSuccess: () => {
      antMessage.success("Post deleted");
      invalidateNews();
    },
    onError: () => antMessage.error("Could not delete post"),
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: number; pinned: boolean }) => setNewsPostPinned(id, pinned),
    onSuccess: invalidateNews,
    onError: () => antMessage.error("Could not update pin status"),
  });

  const openCreate = () => {
    setEditingPost(null);
    form.resetFields();
    setImageUrl(null);
    setModalOpen(true);
  };

  const openEdit = (post: NewsPost) => {
    setEditingPost(post);
    form.setFieldsValue({ type: post.type, title: post.title, body: post.body, isAnonymous: post.isAnonymous });
    setImageUrl(post.imageUrl);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleImagePick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const resized = await resizeImageForUpload(file);
      const uploaded = await uploadFile(resized);
      setImageUrl(getFileUrl(uploaded.id, uploaded.extension));
    } catch {
      antMessage.error("Could not upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (values: AnnouncementFormValues) => {
    saveMutation.mutate({ ...values, imageUrl, isAnonymous: values.isAnonymous ?? false });
  };

  const columns: ColumnsType<NewsPost> = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (title: string, record) => (
        <Space size={6}>
          {record.pinned && <StarFilled className="text-amber-500" />}
          <span className="font-medium text-[var(--text)]">{title}</span>
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: NewsType) => <Tag color={TYPE_COLORS[type]}>{TYPE_TO_LABEL[type]}</Tag>,
    },
    {
      title: "Author",
      dataIndex: "author",
      key: "author",
      render: (_author: NewsPost["author"], record) => (
        <span className="text-xs text-[var(--text-dim)]">{authorName(record.author)}</span>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) => (
        <span className="text-xs text-[var(--text-dim)] whitespace-nowrap">{formatDate(createdAt)}</span>
      ),
    },
    {
      title: "Reactions",
      dataIndex: "likeCount",
      key: "likeCount",
      render: (likeCount: number) => <span className="font-mono text-xs text-[var(--text-dim)]">{likeCount}</span>,
    },
    {
      title: "Comments",
      dataIndex: "commentCount",
      key: "commentCount",
      render: (commentCount: number, record) => (
        <Button type="link" size="small" className="!px-0 font-mono text-xs" onClick={() => setViewingPost(record)}>
          {commentCount}
        </Button>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 160,
      render: (_, record) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setViewingPost(record)} />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            disabled={!record.isMine}
            title={record.isMine ? "Edit" : "Only the author can edit this post"}
            onClick={() => openEdit(record)}
          />
          <Button
            type="text"
            size="small"
            icon={record.pinned ? <StarFilled /> : <StarOutlined />}
            title={record.pinned ? "Unpin" : "Pin"}
            onClick={() => pinMutation.mutate({ id: record.id, pinned: !record.pinned })}
          />
          <Popconfirm
            title="Delete this post?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
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
          <p className="text-sm text-[var(--text-faint)]">Manage the employee news feed</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
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
          value={typeFilter}
          onChange={setTypeFilter}
          className="!w-40"
          options={TYPE_FILTERS.map((o) => ({ value: o, label: o === "All" ? "All" : TYPE_TO_LABEL[o as NewsType] }))}
        />
      </div>

      <Table<NewsPost>
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        locale={{
          emptyText: <Empty description="No announcements found" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-6" />,
        }}
      />

      <Modal title={editingPost ? "Edit Post" : "Create New Announcement"} open={modalOpen} onCancel={closeModal} footer={null} width={640}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Title" name="title" rules={[{ required: true, message: "Title is required" }]}>
            <Input placeholder="Announcement title..." />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Type" name="type" initialValue={TYPE_OPTIONS[0]} rules={[{ required: true }]}>
              <Select options={TYPE_OPTIONS.map((o) => ({ value: o, label: TYPE_TO_LABEL[o] }))} />
            </Form.Item>
            <Form.Item label="Post anonymously" name="isAnonymous" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </div>
          <Form.Item label="Content" name="body" rules={[{ required: true, message: "Content is required" }]}>
            <Input.TextArea rows={6} placeholder="Write your announcement content here..." />
          </Form.Item>
          <Form.Item label="Image (optional)">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                handleImagePick(e.target.files);
                e.target.value = "";
              }}
            />
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt="" className="w-full h-40 object-cover rounded-lg" />
                <Button
                  size="small"
                  shape="circle"
                  icon={<CloseOutlined />}
                  className="!absolute top-2 right-2"
                  onClick={() => setImageUrl(null)}
                />
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-[var(--border)] rounded-lg p-5 text-center hover:border-[var(--accent)] cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadOutlined className="text-lg mb-1.5 text-[var(--text-faint)] block" />
                <p className="text-sm text-[var(--text-faint)]">{uploadingImage ? "Uploading..." : "Click to upload image"}</p>
              </div>
            )}
          </Form.Item>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saveMutation.isPending} disabled={uploadingImage}>
              {editingPost ? "Save Changes" : "Publish Announcement"}
            </Button>
          </div>
        </Form>
      </Modal>

      <NewsPostDrawer post={viewingPost} onClose={() => setViewingPost(null)} />
    </div>
  );
}

function NewsPostDrawer({ post, onClose }: { post: NewsPost | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["news-comments", post?.id],
    queryFn: () => fetchNewsComments(post!.id),
    enabled: !!post,
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => deleteNewsComment(commentId),
    onSuccess: () => {
      antMessage.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["news-comments", post?.id] });
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
    onError: () => antMessage.error("Could not delete comment"),
  });

  return (
    <Drawer title={post?.title ?? ""} open={!!post} onClose={onClose} size={480}>
      {post && (
        <>
          <Space size={6} className="mb-3">
            <Tag color={TYPE_COLORS[post.type]}>{TYPE_TO_LABEL[post.type]}</Tag>
            {post.pinned && (
              <Tag icon={<StarFilled />} color="gold">
                Pinned
              </Tag>
            )}
          </Space>
          <p className="text-xs text-[var(--text-faint)] mb-1">
            {authorName(post.author)} · {formatDate(post.createdAt)}
          </p>
          {post.imageUrl && <img src={post.imageUrl} alt="" className="w-full rounded-lg my-3" />}
          <p className="text-sm whitespace-pre-wrap text-[var(--text)] mb-5">{post.body}</p>

          <Typography.Title level={5} className="!mb-3">
            Comments ({comments.length})
          </Typography.Title>
          {isLoading ? (
            <p className="text-xs text-[var(--text-faint)]">Loading...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-[var(--text-faint)]">No comments yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {comments.map((c) => (
                <div key={c.id} className="border border-[var(--border)] rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-[var(--text)]">{c.commenter?.name ?? "Unknown"}</p>
                      <p className="text-[10px] text-[var(--text-faint)]">{formatDate(c.createdAt)}</p>
                    </div>
                    <Popconfirm
                      title="Delete this comment?"
                      onConfirm={() => deleteCommentMutation.mutate(c.id)}
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                    >
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                  <p className="text-sm text-[var(--text)] mt-1.5">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}
