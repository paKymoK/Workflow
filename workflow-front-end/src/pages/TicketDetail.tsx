import { useParams, useNavigate } from "react-router-dom";
import {
  Spin, Typography, Card, Descriptions, Tag, Button, Steps, Alert,
  Dropdown, App, Avatar, List, Row, Col, Divider,
} from "antd";
import {
  ArrowLeftOutlined, PauseCircleOutlined, PlayCircleOutlined,
  MoreOutlined, SendOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { wsBaseUrl } from "../api/axios.ts";
import DeadlineTag from "../components/DeadlineTag.tsx";
import RichTextEditor from "../components/RichTextEditor.tsx";
import dayjs from "dayjs";
import { useTicket, usePauseTicket, useResumeTicket, useTransitionTicket } from "../hooks/useTickets";
import { useComments, useCreateComment } from "../hooks/useComments";

const { Title, Text } = Typography;

export default function TicketDetail() {
  const { message } = App.useApp();
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const token       = sessionStorage.getItem("access_token");

  const commentHtmlRef = useRef("");
  const [editorKey, setEditorKey] = useState(0);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: ticket, isLoading, isFetching: refreshing, refetch } = useTicket(id);
  const { data: comments = [], isLoading: commentsLoading }          = useComments(id);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const pauseMutation      = usePauseTicket();
  const resumeMutation     = useResumeTicket();
  const transitionMutation = useTransitionTicket();
  const commentMutation    = useCreateComment();

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

  const handleSubmitComment = useCallback(async () => {
    const html = commentHtmlRef.current;
    if (html.replace(/<[^>]*>/g, "").trim() === "") return;
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

          {ticket.detail?.data && (
            <Card title="Description" className="!mb-4">
              <Text>{ticket.detail.data}</Text>
            </Card>
          )}

          <Card title={`Comments (${comments.length})`} className="!mb-4" loading={commentsLoading}>
            {comments.length === 0 && !commentsLoading ? (
              <Text type="secondary">No comments yet.</Text>
            ) : (
              <List
                dataSource={comments}
                rowKey="id"
                renderItem={(comment) => (
                  <List.Item className="!items-start !py-3 !px-0">
                    <List.Item.Meta
                      avatar={<Avatar className="!bg-[#1677ff]">{comment.commenter.name.charAt(0).toUpperCase()}</Avatar>}
                      title={<Text strong>{comment.commenter.name}</Text>}
                      description={
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: comment.content }}
                        />
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card title="Add Comment">
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
                    <Text type="secondary" className="!text-[11px]">{ticket.assignee.email}</Text>
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
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
