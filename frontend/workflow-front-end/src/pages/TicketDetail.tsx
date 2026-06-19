import { useParams, useNavigate } from "react-router-dom";
import {
  Spin, Typography, Card, Descriptions, Tag, Button, Steps, Alert,
  Dropdown, App, Avatar, List, Row, Col, Divider, Progress, Tooltip, Select, Modal,
} from "antd";
import {
  ArrowLeftOutlined, PauseCircleOutlined, PlayCircleOutlined,
  MoreOutlined, SendOutlined, EditOutlined, CheckOutlined, CloseOutlined, UserSwitchOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { wsBaseUrl } from "@takypok/shared";
import DeadlineTag from "../components/DeadlineTag.tsx";
import RichTextEditor from "../components/RichTextEditor.tsx";
import dayjs from "dayjs";
import { useTicket, usePauseTicket, useResumeTicket, useTransitionTicket, useUpdateAssignee } from "../hooks/useTickets";
import { useComments, useCreateComment, useUpdateComment } from "../hooks/useComments";
import { useAuth } from "@takypok/shared";
import { fetchUsers, type UserSummary } from "../api/ticketApi";
import CommentContent from "../components/CommentContent.tsx";
import AttachmentUpload from "../components/AttachmentUpload.tsx";

const { Title, Text } = Typography;

export default function TicketDetail() {
  const { message } = App.useApp();
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const token       = sessionStorage.getItem("access_token");
  const { user }    = useAuth();

  const commentHtmlRef = useRef("");
  const editHtmlRef    = useRef("");
  const [editorKey, setEditorKey] = useState(0);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState(0);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: ticket, isLoading, isFetching: refreshing, refetch } = useTicket(id);
  const { data: comments = [], isLoading: commentsLoading }          = useComments(id);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const pauseMutation      = usePauseTicket();
  const resumeMutation     = useResumeTicket();
  const transitionMutation = useTransitionTicket();
  const commentMutation    = useCreateComment();
  const editMutation       = useUpdateComment();
  const assigneeMutation   = useUpdateAssignee();

  // ── Assignee edit state ───────────────────────────────────────────────────
  const [assigneeModalOpen,  setAssigneeModalOpen]  = useState(false);
  const [userQuery,          setUserQuery]          = useState("");
  const [userOptions,        setUserOptions]        = useState<{ value: string; label: string; user: UserSummary }[]>([]);
  const [isSearchingUsers,   setIsSearchingUsers]   = useState(false);

  useEffect(() => {
    if (!userQuery.trim()) { setUserOptions([]); return; }
    const t = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const users = await fetchUsers(userQuery);
        setUserOptions(users.map((u) => ({ value: u.sub, label: `${u.name} — ${u.email}`, user: u })));
      } finally {
        setIsSearchingUsers(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [userQuery]);

  const handleAssigneeSelect = useCallback(async (_: string, option: { user: UserSummary }) => {
    if (!id) return;
    try {
      await assigneeMutation.mutateAsync({ ticketId: id, sub: option.user.sub });
      message.success("Assignee updated");
      setAssigneeModalOpen(false);
      setUserQuery("");
      setUserOptions([]);
    } catch {
      message.error("Failed to update assignee");
    }
  }, [id, assigneeMutation, message]);

  const actionLoading     = pauseMutation.isPending || resumeMutation.isPending || transitionMutation.isPending;
  const commentSubmitting = commentMutation.isPending;

  const handlePause = useCallback(async () => {
    if (!id) return;
    try {
      await pauseMutation.mutateAsync(id);
    } catch {
      message.error("Failed to pause ticket");
    }
  }, [id, pauseMutation, message]);

  const handleResume = useCallback(async () => {
    if (!id) return;
    try {
      await resumeMutation.mutateAsync(id);
    } catch {
      message.error("Failed to resume ticket");
    }
  }, [id, resumeMutation, message]);

  const handleTransition = useCallback(async (transitionName: string) => {
    if (!id || !ticket) return;
    try {
      await transitionMutation.mutateAsync({
        ticketId: id,
        currentStatusId: ticket.status.id,
        transitionName,
      });
    } catch {
      message.error("Failed to transition ticket");
    }
  }, [id, ticket, transitionMutation, message]);

  const handleStartEdit = useCallback((commentId: string, currentContent: string) => {
    editHtmlRef.current = currentContent;
    setEditingCommentId(commentId);
    setEditKey((k) => k + 1);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingCommentId(null);
    editHtmlRef.current = "";
  }, []);

  const handleSaveEdit = useCallback(async (commentId: string) => {
    const html = editHtmlRef.current;
    const hasText  = html.replace(/<[^>]*>/g, "").trim() !== "";
    const hasMedia = html.includes('data-type="video-embed"') || html.includes("<img");
    if (!hasText && !hasMedia) return;
    try {
      await editMutation.mutateAsync({ id: commentId, content: html });
      message.success("Comment updated");
      setEditingCommentId(null);
      editHtmlRef.current = "";
    } catch {
      message.error("Failed to update comment");
    }
  }, [editMutation, message]);

  const handleSubmitComment = useCallback(async () => {
    const html = commentHtmlRef.current;
    const hasText  = html.replace(/<[^>]*>/g, "").trim() !== "";
    const hasMedia = html.includes('data-type="video-embed"') || html.includes("<img");
    if (!hasText && !hasMedia) return;
    try {
      await commentMutation.mutateAsync({ ticketId: id!, content: html });
      message.success("Comment submitted");
      commentHtmlRef.current = "";
      setEditorKey((k) => k + 1);
    } catch {
      message.error("Failed to submit comment");
    }
  }, [id, commentMutation, message]);

  // ── WebSocket — untouched; just call refetch() on matching push ───────────
  useEffect(() => {
    if (!id) return;
    const ws = new WebSocket(`${wsBaseUrl}/workflow-service/web-socket/sla`);
    ws.onopen    = () => { ws.send(token ?? ""); };
    ws.onmessage = (event) => {
      if (Number(event.data) === Number(id)) refetch();
    };
    return () => ws.close();
  }, [id, token, refetch]);

  // ── Derived values ────────────────────────────────────────────────────────
  const availableTransitions = useMemo(() => {
    if (!ticket?.workflow || !ticket.status) return [];
    return ticket.workflow.transitions.filter((t) => t.from?.id === ticket.status.id);
  }, [ticket]);

  const currentStepIndex = useMemo(() => {
    if (!ticket?.workflow || !ticket.status) return 0;
    return ticket.workflow.statuses.findIndex((s) => s.id === ticket.status.id);
  }, [ticket]);

  // ── Render guards ─────────────────────────────────────────────────────────
  if (isLoading) {
    return <div className="flex justify-center py-20"><Spin size="large" /></div>;
  }

  if (!ticket) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboard")} className="mb-4">
          Back to Dashboard
        </Button>
        <Title level={4}>Ticket not found</Title>
      </div>
    );
  }

  const isPaused  = ticket.sla?.isPaused;
  const menuItems: MenuProps["items"] = [
    {
      key: "assignee", label: "Change Assignee", icon: <UserSwitchOutlined />,
      onClick: () => setAssigneeModalOpen(true),
    },
    { type: "divider" as const },
    ...(!isPaused && ticket.sla ? [{
      key: "pause", label: "Pause SLA", disabled: actionLoading, onClick: handlePause,
    }] : []),
    ...(isPaused && ticket.sla ? [{
      key: "resume", label: "Resume SLA", disabled: actionLoading, onClick: handleResume,
    }] : []),
    ...(availableTransitions.length > 0 ? [
      { type: "divider" as const },
      ...availableTransitions.map((t) => ({
        key: t.name, label: t.name, disabled: actionLoading,
        onClick: () => handleTransition(t.name),
      })),
    ] : []),
  ];

  return (
    <div>
      <Modal
        title="Change Assignee"
        open={assigneeModalOpen}
        onCancel={() => { setAssigneeModalOpen(false); setUserQuery(""); setUserOptions([]); }}
        footer={null}
      >
        <Select
          showSearch
          autoFocus
          filterOption={false}
          placeholder="Search by name or email..."
          className="!w-full !mt-3"
          onSearch={setUserQuery}
          onSelect={handleAssigneeSelect}
          options={userOptions}
          loading={isSearchingUsers || assigneeMutation.isPending}
          notFoundContent={isSearchingUsers ? <Spin size="small" /> : userQuery ? "No users found" : null}
        />
      </Modal>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboard")}>Back</Button>
        <div className="flex items-center gap-2">
          {(refreshing || actionLoading) && <Spin size="small" />}
          {menuItems.length > 0 && (
            <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
              <Button icon={<MoreOutlined />}>Actions</Button>
            </Dropdown>
          )}
        </div>
      </div>

      {/* Title row */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-bebas text-3xl tracking-[0.1em] neon-text-yellow m-0">▸ TICKET #{ticket.id}</h2>
        <Tag color={ticket.status.color} className="!text-[13px] !py-[2px] !px-[10px]">{ticket.status.name}</Tag>
        {ticket.sla && (
          isPaused
            ? <Tag icon={<PauseCircleOutlined />} color="orange">SLA Paused</Tag>
            : <Tag icon={<PlayCircleOutlined />}  color="green">SLA Active</Tag>
        )}
      </div>

      {/* Workflow steps */}
      {ticket.workflow && (
        <Card className="!mb-4">
          <Steps
            size="small"
            current={currentStepIndex}
            items={ticket.workflow.statuses.map((s) => ({
              title:       <Tag color={s.color} className="!m-0">{s.name}</Tag>,
              description: <Text type="secondary" className="!text-[11px]">{s.group}</Text>,
            }))}
          />
          {currentStepIndex === ticket.workflow.statuses.length - 1 && (
            <Alert message="This ticket has reached its final status." type="success" showIcon className="!mt-3" />
          )}
        </Card>
      )}

      <Row gutter={24} align="top">
        {/* Left — main content */}
        <Col xs={24} lg={16}>
          <Card className="!mb-4">
            <Text strong>Summary: </Text>
            <Text className="text-[15px]">{ticket.summary}</Text>
          </Card>

          {ticket.detail?.description && (
            <Card title="Description" className="!mb-4">
              <CommentContent html={ticket.detail.description} />
            </Card>
          )}

          {ticket.detail && (
            <Card title="Attachments" className="!mb-4">
              <AttachmentUpload value={ticket.detail.attachment ?? []} readonly />
            </Card>
          )}

          <Card title={`Comments (${comments.length})`} className="!mb-4" loading={commentsLoading}>
            {comments.length === 0 && !commentsLoading ? (
              <Text type="secondary" className="block mb-4">No comments yet.</Text>
            ) : (
              <List
                dataSource={comments}
                rowKey="id"
                renderItem={(comment) => {
                  const isOwner = comment.commenter.sub === (user?.sub as string);
                  const isEditing = editingCommentId === comment.id;
                  return (
                    <List.Item className="!items-start !py-3 !px-0">
                      <List.Item.Meta
                        avatar={<Avatar className="!bg-[#1677ff]">{comment.commenter.name.charAt(0).toUpperCase()}</Avatar>}
                        title={
                          <div className="flex items-center gap-2">
                            <Text strong>{comment.commenter.name}</Text>
                            {comment.isEdited && comment.modifiedAt && (
                              <Text type="secondary" className="!text-[10px]">
                                edited {dayjs(comment.modifiedAt).format("DD MMM YYYY, HH:mm")}
                              </Text>
                            )}
                          </div>
                        }
                        description={
                          isEditing ? (
                            <div>
                              <RichTextEditor
                                key={`edit-${comment.id}-${editKey}`}
                                editable={true}
                                content={comment.content}
                                onChange={(html: string) => { editHtmlRef.current = html; }}
                                placeholder="Edit your comment..."
                              />
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={<CheckOutlined />}
                                  loading={editMutation.isPending}
                                  onClick={() => handleSaveEdit(comment.id)}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="small"
                                  icon={<CloseOutlined />}
                                  onClick={handleCancelEdit}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <CommentContent html={comment.content} />
                          )
                        }
                      />
                      {isOwner && !isEditing && (
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleStartEdit(comment.id, comment.content)}
                          className="!text-[var(--text-muted)] hover:!text-[var(--neon-yellow)] mt-1"
                        />
                      )}
                    </List.Item>
                  );
                }}
              />
            )}
            <Divider className="!mt-0 !mb-3" />
            <RichTextEditor
              key={editorKey}
              editable={true}
              onChange={(html: string) => { commentHtmlRef.current = html; }}
              placeholder="Write a comment..."
            />
            <div className="flex justify-end mt-3">
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={commentSubmitting}
                onClick={handleSubmitComment}
              >
                Submit
              </Button>
            </div>
          </Card>
        </Col>

        {/* Right — metadata */}
        <Col xs={24} lg={8}>
          <Card>
            <Descriptions column={1} size="small" colon={false}>
              <Descriptions.Item label={<Text type="secondary">Created</Text>}>
                {dayjs(ticket.createdAt).format("DD MMM YYYY, HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label={<Text type="secondary">Priority</Text>}>
                {ticket.priority.name}
              </Descriptions.Item>
              <Descriptions.Item label={<Text type="secondary">Project</Text>}>
                {ticket.project.name} <Text className="pl-0.5" type="secondary">({ticket.project.code})</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text type="secondary">Issue Type</Text>}>
                {ticket.issueType.name}
              </Descriptions.Item>
              <Descriptions.Item label={<Text type="secondary">Reporter</Text>}>
                <div>{ticket.reporter.name}</div>
                <Text type="secondary" className="!text-[11px] pl-0.5">({ticket.reporter.email})</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text type="secondary">Assignee</Text>}>
                {ticket.assignee ? (
                  <>
                    <div>{ticket.assignee.name}</div>
                    <Text type="secondary" className="!text-[11px] pl-0.5">({ticket.assignee.email})</Text>
                  </>
                ) : (
                  <Text type="secondary">Unassigned</Text>
                )}
              </Descriptions.Item>
            </Descriptions>

            {ticket.sla && (
              <>
                <Divider className="!my-3 !mx-0" />
                <Descriptions column={1} size="small" colon={false}>
                  <Descriptions.Item label={<Text type="secondary">Response Time</Text>}>
                    {ticket.sla.priority.responseTime} {ticket.sla.priority.responseTime === 1 ? "hour" : "hours"}
                  </Descriptions.Item>
                  <Descriptions.Item label={<Text type="secondary">Resolution Time</Text>}>
                    {ticket.sla.priority.resolutionTime} {ticket.sla.priority.resolutionTime === 1 ? "hour" : "hours"}
                  </Descriptions.Item>
                  <Descriptions.Item label={<Text type="secondary">Response</Text>}>
                    <DeadlineTag createdAt={ticket.createdAt} sla={ticket.sla} type="response" />
                  </Descriptions.Item>
                  <Descriptions.Item label={<Text type="secondary">Resolution</Text>}>
                    <DeadlineTag createdAt={ticket.createdAt} sla={ticket.sla} type="resolution" />
                  </Descriptions.Item>
                </Descriptions>
                {(() => {
                  const pct = ticket.sla.status.resolutionPercent ?? 0;
                  const clamped = Math.min(pct, 100);
                  const color = pct >= 100 ? "#FF2D6B" : pct >= 75 ? "#FFE500" : "#00F5FF";
                  return (
                    <div className="mt-2">
                      <Text type="secondary" className="!text-[11px]">Resolution Progress</Text>
                      <Tooltip title={`${pct}% of resolution time elapsed`}>
                        <Progress
                          percent={clamped}
                          strokeColor={color}
                          trailColor="rgba(255,255,255,0.1)"
                          format={() => `${pct}%`}
                          status={pct >= 100 ? "exception" : "active"}
                          size="small"
                        />
                      </Tooltip>
                    </div>
                  );
                })()}
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
