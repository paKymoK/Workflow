import { useParams, useNavigate } from "react-router-dom";
import {
  Spin, Tag, Button,
  Dropdown, App, Avatar, List, Tooltip, Select, Modal, Form, Input,
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
import { type PendingReason, PENDING_REASON_LABELS } from "../api/types";
import CommentContent from "../components/CommentContent.tsx";
import AttachmentUpload from "../components/AttachmentUpload.tsx";
import SlaBar from "../components/dashboard/SlaBar.tsx";
import PriorityBars from "../components/dashboard/PriorityBars.tsx";
import WorkflowStepper from "../components/ticket/WorkflowStepper";
import Panel from "../components/ui/Panel";

const GLOW_CLASS = "[text-shadow:0_0_calc(16px_*_var(--glow))_color-mix(in_oklab,var(--acc-1)_60%,transparent)]";

export default function TicketDetail() {
  const { message } = App.useApp();
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const token       = sessionStorage.getItem("access_token");
  const { user }    = useAuth();

  const commentHtmlRef = useRef("");
  const editHtmlRef    = useRef("");
  const [editorKey, setEditorKey]               = useState(0);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editKey, setEditKey]                   = useState(0);

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

  // ── Assignee modal ────────────────────────────────────────────────────────
  const [assigneeModalOpen, setAssigneeModalOpen] = useState(false);
  const [userQuery,         setUserQuery]         = useState("");
  const [userOptions,       setUserOptions]       = useState<{ value: string; label: string; user: UserSummary }[]>([]);
  const [isSearchingUsers,  setIsSearchingUsers]  = useState(false);

  // ── Pending reason modal ──────────────────────────────────────────────────
  const [pendingModalOpen,      setPendingModalOpen]      = useState(false);
  const [pendingTransitionName, setPendingTransitionName] = useState("");
  const [pendingForm] = Form.useForm<{ reason: PendingReason; description?: string }>();

  useEffect(() => {
    const delay = userQuery.trim() ? 400 : 0;
    const t = setTimeout(async () => {
      if (!userQuery.trim()) { setUserOptions([]); return; }
      setIsSearchingUsers(true);
      try {
        const users = await fetchUsers(userQuery);
        setUserOptions(users.map((u) => ({ value: u.sub, label: `${u.name} — ${u.email}`, user: u })));
      } finally {
        setIsSearchingUsers(false);
      }
    }, delay);
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
    try { await pauseMutation.mutateAsync(id); } catch { message.error("Failed to pause ticket"); }
  }, [id, pauseMutation, message]);

  const handleResume = useCallback(async () => {
    if (!id) return;
    try { await resumeMutation.mutateAsync(id); } catch { message.error("Failed to resume ticket"); }
  }, [id, resumeMutation, message]);

  const handleTransition = useCallback(async (
    transitionName: string,
    pendingReason?: PendingReason,
    pendingDescription?: string,
  ) => {
    if (!id || !ticket) return;
    try {
      await transitionMutation.mutateAsync({
        ticketId: id,
        currentStatusId: ticket.status.id,
        transitionName,
        pendingReason,
        pendingDescription,
      });
    } catch {
      message.error("Failed to transition ticket");
    }
  }, [id, ticket, transitionMutation, message]);

  const handlePendingTransitionClick = useCallback((transitionName: string) => {
    setPendingTransitionName(transitionName);
    pendingForm.resetFields();
    setPendingModalOpen(true);
  }, [pendingForm]);

  const handlePendingConfirm = useCallback(async () => {
    const values = await pendingForm.validateFields();
    await handleTransition(pendingTransitionName, values.reason, values.description);
    setPendingModalOpen(false);
  }, [pendingForm, pendingTransitionName, handleTransition]);

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

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const ws = new WebSocket(`${wsBaseUrl}/workflow-service/web-socket/sla`);
    ws.onopen    = () => { ws.send(token ?? ""); };
    ws.onmessage = (event) => { if (Number(event.data) === Number(id)) refetch(); };
    return () => ws.close();
  }, [id, token, refetch]);

  // ── Derived values ────────────────────────────────────────────────────────
  const availableTransitions = useMemo(() => {
    if (!ticket?.workflow || !ticket.status) return [];
    return ticket.workflow.transitions.filter((t) => t.from?.id === ticket.status.id);
  }, [ticket]);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return <div className="flex justify-center py-20"><Spin size="large" /></div>;
  }

  if (!ticket) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboard")} className="mb-4">
          Back to Dashboard
        </Button>
        <p className="font-bebas text-xl text-[var(--fg-faint)]">Ticket not found</p>
      </div>
    );
  }

  const isPaused      = ticket.sla?.isPaused;
  const ticketCode    = `${ticket.project.code}-${String(ticket.id).padStart(4, "0")}`;
  const resolutionPct = ticket.sla?.status.resolutionPercent ?? 0;
  const clamped       = Math.min(100, Math.round(resolutionPct));
  const slaColor      = resolutionPct >= 100
    ? "var(--priority-critical)"
    : resolutionPct >= 80
    ? "var(--acc-amber)"
    : "var(--acc-1)";

  const menuItems: MenuProps["items"] = [
    {
      key: "assignee", label: "Change Assignee", icon: <UserSwitchOutlined />,
      onClick: () => setAssigneeModalOpen(true),
    },
    { type: "divider" as const },
    ...(!isPaused && ticket.sla ? [{ key: "pause",  label: "Pause SLA",  disabled: actionLoading, onClick: handlePause  }] : []),
    ...(isPaused  && ticket.sla ? [{ key: "resume", label: "Resume SLA", disabled: actionLoading, onClick: handleResume }] : []),
    ...(availableTransitions.length > 0 ? [
      { type: "divider" as const },
      ...availableTransitions.map((t) => ({
        key: t.name, label: t.name, disabled: actionLoading,
        onClick: () =>
          t.to.name === "Pending"
            ? handlePendingTransitionClick(t.name)
            : handleTransition(t.name),
      })),
    ] : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Modals */}
      <Modal
        title="Put On Hold"
        open={pendingModalOpen}
        onCancel={() => setPendingModalOpen(false)}
        onOk={handlePendingConfirm}
        confirmLoading={transitionMutation.isPending}
        okText="Confirm"
      >
        <Form form={pendingForm} layout="vertical" className="mt-3">
          <Form.Item name="reason" label="Reason" rules={[{ required: true, message: "Please select a reason" }]}>
            <Select
              placeholder="Select a reason..."
              options={(Object.keys(PENDING_REASON_LABELS) as PendingReason[]).map((k) => ({
                label: PENDING_REASON_LABELS[k], value: k,
              }))}
            />
          </Form.Item>
          <Form.Item name="description" label="Description (optional)">
            <Input.TextArea rows={3} placeholder="Provide additional context if needed..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Change Assignee"
        open={assigneeModalOpen}
        onCancel={() => { setAssigneeModalOpen(false); setUserQuery(""); setUserOptions([]); }}
        footer={null}
      >
        <Select
          showSearch autoFocus filterOption={false}
          placeholder="Search by name or email..."
          className="!w-full !mt-3"
          onSearch={setUserQuery}
          onSelect={handleAssigneeSelect}
          options={userOptions}
          loading={isSearchingUsers || assigneeMutation.isPending}
          notFoundContent={isSearchingUsers ? <Spin size="small" /> : userQuery ? "No users found" : null}
        />
      </Modal>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/dashboard")}
            className="font-bebas! tracking-wider! flex-shrink-0"
          >
            Back
          </Button>
          <span className="font-mono-tech text-[13px] text-[var(--acc-1)] flex-shrink-0">{ticketCode}</span>
          <h2 className={`font-bebas text-2xl tracking-[.1em] neon-text-acc m-0 truncate ${GLOW_CLASS}`}>
            ▸ TICKET #{ticket.id}
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {(refreshing || actionLoading) && <Spin size="small" />}
          <Tag color={ticket.status.color} className="font-bebas! tracking-wider! text-xs!">
            {ticket.status.name}
          </Tag>
          {ticket.sla && (
            isPaused
              ? <Tag icon={<PauseCircleOutlined />} color="warning" className="font-bebas! tracking-wider!">PAUSED</Tag>
              : <Tag icon={<PlayCircleOutlined />}  color="success" className="font-bebas! tracking-wider!">ACTIVE</Tag>
          )}
          {menuItems.length > 0 && (
            <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
              <Button size="small" icon={<MoreOutlined />} className="font-bebas! tracking-wider!">
                Actions
              </Button>
            </Dropdown>
          )}
        </div>
      </div>

      {/* ── Workflow stepper (fix ①) ──────────────────────────────────────── */}
      {ticket.workflow && (
        <WorkflowStepper
          statuses={ticket.workflow.statuses}
          currentStatusId={ticket.status.id}
          isDone={ticket.status.group === "DONE"}
        />
      )}

      {/* ── Two-column grid ───────────────────────────────────────────────── */}
      <div className="grid [grid-template-columns:1.7fr_0.9fr] gap-4 items-start">

        {/* ── LEFT COLUMN ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Fix ③ — dedicated Summary panel */}
          <Panel title="SUMMARY">
            <p className="font-mono-tech text-[15px] leading-[1.5] text-[var(--fg)] m-0">
              {ticket.summary}
            </p>
          </Panel>

          {/* Description */}
          {ticket.detail?.description && (
            <Panel title="DESCRIPTION">
              <CommentContent html={ticket.detail.description} />
            </Panel>
          )}

          {/* Attachments */}
          {ticket.detail && (
            <Panel title="ATTACHMENTS">
              <AttachmentUpload value={ticket.detail.attachment ?? []} readonly />
            </Panel>
          )}

          {/* Comments */}
          <Panel
            title={`COMMENTS (${comments.length})`}
            bodyClassName="p-0"
          >
            <div className="px-4 pt-4">
              {commentsLoading ? (
                <div className="flex justify-center py-6"><Spin size="small" /></div>
              ) : comments.length === 0 ? (
                <p className="font-mono-tech text-[11px] text-[var(--fg-faint)] mb-4">No comments yet.</p>
              ) : (
                <List
                  dataSource={comments}
                  rowKey="id"
                  renderItem={(comment) => {
                    const isOwner   = comment.commenter.sub === (user?.sub as string);
                    const isEditing = editingCommentId === comment.id;
                    return (
                      <List.Item className="!items-start !py-3 !px-0">
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              className="font-bebas! bg-[var(--acc-2)] text-[var(--bg-0)]"
                            >
                              {comment.commenter.name.charAt(0).toUpperCase()}
                            </Avatar>
                          }
                          title={
                            <div className="flex items-center gap-2">
                              <span className="font-mono-tech text-[12px] text-[var(--fg)]">
                                {comment.commenter.name}
                              </span>
                              {comment.isEdited && comment.modifiedAt && (
                                <span className="font-mono-tech text-[9px] text-[var(--fg-faint)]">
                                  edited {dayjs(comment.modifiedAt).format("DD MMM YYYY, HH:mm")}
                                </span>
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
                                  <Button size="small" type="primary" icon={<CheckOutlined />}
                                    loading={editMutation.isPending}
                                    onClick={() => handleSaveEdit(comment.id)}
                                    className="font-bebas! tracking-wider!"
                                  >Save</Button>
                                  <Button size="small" icon={<CloseOutlined />}
                                    onClick={handleCancelEdit}
                                    className="font-bebas! tracking-wider!"
                                  >Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <CommentContent html={comment.content} />
                            )
                          }
                        />
                        {isOwner && !isEditing && (
                          <Button
                            type="text" size="small" icon={<EditOutlined />}
                            onClick={() => handleStartEdit(comment.id, comment.content)}
                            className="!text-[var(--fg-faint)] hover:!text-[var(--acc-1)] mt-1"
                          />
                        )}
                      </List.Item>
                    );
                  }}
                />
              )}
            </div>

            <div className="px-4 pb-4">
              <div className="border-t border-[var(--line)] mt-0 mb-3" />
              {/* ⌘/Ctrl+↵ to submit */}
              <div
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              >
                <RichTextEditor
                  key={editorKey}
                  editable={true}
                  onChange={(html: string) => { commentHtmlRef.current = html; }}
                  placeholder="Write a comment…  (⌘/Ctrl+↵ to submit)"
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="font-mono-tech text-[9px] text-[var(--fg-faint)]">⌘/Ctrl+↵ to submit</span>
                <Button
                  type="primary" size="small" icon={<SendOutlined />}
                  loading={commentSubmitting}
                  onClick={handleSubmitComment}
                  className="font-bebas! tracking-wider!"
                >
                  SUBMIT
                </Button>
              </div>
            </div>
          </Panel>
        </div>

        {/* ── RIGHT COLUMN (sticky) ─────────────────────────────────────── */}
        <div className="sticky top-4 flex flex-col gap-4">

          {/* Details */}
          <Panel title="DETAILS">
            <div className="flex flex-col gap-3">
              <MetaRow label="Priority">
                <PriorityBars priority={ticket.priority} />
              </MetaRow>
              <MetaRow label="Project">
                <span className="font-mono-tech text-[11px] text-[var(--fg)]">
                  {ticket.project.name}
                  <span className="text-[var(--fg-faint)] ml-1">({ticket.project.code})</span>
                </span>
              </MetaRow>
              <MetaRow label="Issue Type">
                <span className="font-mono-tech text-[11px] text-[var(--fg)]">{ticket.issueType.name}</span>
              </MetaRow>
              <MetaRow label="Reporter">
                <div>
                  <p className="font-mono-tech text-[11px] text-[var(--fg)] m-0">{ticket.reporter.name}</p>
                  <p className="font-mono-tech text-[9px] text-[var(--fg-faint)] m-0">{ticket.reporter.email}</p>
                </div>
              </MetaRow>
              <MetaRow label="Assignee">
                {ticket.assignee ? (
                  <div>
                    <p className="font-mono-tech text-[11px] text-[var(--fg)] m-0">{ticket.assignee.name}</p>
                    <p className="font-mono-tech text-[9px] text-[var(--fg-faint)] m-0">{ticket.assignee.email}</p>
                  </div>
                ) : (
                  <span className="font-mono-tech text-[11px] text-[var(--fg-faint)]">UNASSIGNED</span>
                )}
              </MetaRow>
              <MetaRow label="Created">
                <span className="font-mono-tech text-[11px] text-[var(--fg)]">
                  {dayjs(ticket.createdAt).format("DD MMM YYYY, HH:mm")}
                </span>
              </MetaRow>
            </div>
          </Panel>

          {/* SLA */}
          {ticket.sla && (
            <Panel title="SLA">
              {/* Big resolution % */}
              <div className="flex items-end gap-2 mb-3">
                <span className={`font-bebas text-5xl leading-none text-[${slaColor}]`}>
                  {clamped}%
                </span>
                <span className="font-mono-tech text-[9px] text-[var(--fg-faint)] mb-1">resolution elapsed</span>
              </div>

              <SlaBar sla={ticket.sla} />

              <div className="flex gap-4 mt-2 mb-3">
                {[
                  ["Response",   !ticket.sla.status.isResponseOverdue],
                  ["Resolution", !ticket.sla.status.isResolutionOverdue],
                ].map(([label, ok]) => (
                  <span key={label as string} className={`font-mono-tech text-[10px] text-[${ok ? "var(--acc-3)" : "var(--priority-critical)"}]`}
                  >
                    {ok ? "✓" : "✗"} {label as string}
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-2 mb-3">
                <MetaRow label="Response">
                  <Tooltip title={`${ticket.sla.priority.responseTime}h window`}>
                    <DeadlineTag createdAt={ticket.createdAt} sla={ticket.sla} type="response" />
                  </Tooltip>
                </MetaRow>
                <MetaRow label="Resolution">
                  <Tooltip title={`${ticket.sla.priority.resolutionTime}h window`}>
                    <DeadlineTag createdAt={ticket.createdAt} sla={ticket.sla} type="resolution" />
                  </Tooltip>
                </MetaRow>
              </div>

              {isPaused && (
                <div className="px-3 py-2 border-l-2 border-[var(--acc-amber)] bg-[var(--bg-2)] mb-3">
                  <p className="font-mono-tech text-[10px] text-[var(--acc-amber)] m-0">
                    SLA PAUSED
                    {ticket.sla.pausedTime?.length
                      ? ` — ${ticket.sla.pausedTime[ticket.sla.pausedTime.length - 1].reason ?? "No reason"}`
                      : ""}
                  </p>
                </div>
              )}

              {ticket.sla.pausedTime.length > 0 && (
                <>
                  <p className="font-bebas text-[10px] tracking-[.2em] text-[var(--acc-1)] mb-2">
                    PAUSE HISTORY
                  </p>
                  <div className="flex flex-col gap-2">
                    {ticket.sla.pausedTime.map((p, i) => (
                      <div key={i} className="pl-2 border-l border-[var(--line-strong)]">
                        {p.reason && (
                          <Tag color="warning" className="font-bebas! tracking-wider! mb-1">
                            {PENDING_REASON_LABELS[p.reason]}
                          </Tag>
                        )}
                        {p.description && (
                          <p className="font-mono-tech text-[10px] text-[var(--fg-dim)] m-0 mb-0.5">
                            {p.description}
                          </p>
                        )}
                        <p className="font-mono-tech text-[9px] text-[var(--fg-faint)] m-0">
                          {dayjs(p.pausedTime).format("DD MMM HH:mm")}
                          {p.resumeTime ? ` → ${dayjs(p.resumeTime).format("HH:mm")}` : " → ongoing"}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="font-mono-tech text-[9px] tracking-widest text-[var(--fg-faint)] uppercase w-20 flex-shrink-0 mt-0.5">
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
