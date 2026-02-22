import { useParams, useNavigate } from "react-router-dom";
import { Spin, Typography, Card, Descriptions, Tag, Button, Steps, Alert, Dropdown, App, Avatar, List, Row, Col, Divider } from "antd";
import { ArrowLeftOutlined, PauseCircleOutlined, PlayCircleOutlined, MoreOutlined, SendOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import type { TicketSla } from "../api/types.ts";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { fetchTicketById, pauseTicket, resumeTicket, transitionTicket, createComment, fetchComments } from "../api/ticketApi";
import type { Comment } from "../api/types.ts";
import DeadlineTag from "../components/DeadlineTag.tsx";
import RichTextEditor from "../components/RichTextEditor.tsx";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function TicketDetail() {
  const { message } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketSla | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const token = sessionStorage.getItem("access_token");
  const commentHtmlRef = useRef("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const loadComments = useCallback(async () => {
    if (!id) return;
    setCommentsLoading(true);
    try {
      const data = await fetchComments(id);
      setComments(data);
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmitComment = useCallback(async () => {
    const html = commentHtmlRef.current;
    const isEmpty = html.replace(/<[^>]*>/g, "").trim() === "";
    if (isEmpty) return;
    setCommentSubmitting(true);
    try {
      await createComment(id!, html);
      message.success("Comment submitted");
      commentHtmlRef.current = "";
      setEditorKey((k) => k + 1);
      loadComments();
    } catch {
      message.error("Failed to submit comment");
    } finally {
      setCommentSubmitting(false);
    }
  }, [id, loadComments, message]);

  const handlePause = useCallback(async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await pauseTicket(id);
      const data = await fetchTicketById(id);
      setTicket(data);
    } catch {
      message.error("Failed to pause ticket");
    } finally {
      setActionLoading(false);
    }
  }, [id, message]);

  const handleResume = useCallback(async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await resumeTicket(id);
      const data = await fetchTicketById(id);
      setTicket(data);
    } catch {
      message.error("Failed to resume ticket");
    } finally {
      setActionLoading(false);
    }
  }, [id, message]);

  const handleTransition = useCallback(async (transitionName: string) => {
    if (!id || !ticket) return;
    setActionLoading(true);
    try {
      await transitionTicket(id, ticket.status.id, transitionName);
      const data = await fetchTicketById(id);
      setTicket(data);
    } catch {
      message.error("Failed to transition ticket");
    } finally {
      setActionLoading(false);
    }
  }, [id, ticket, message]);

  const loadTicket = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchTicketById(id);
      setTicket(data);
    } catch (error) {
      console.error("Failed to fetch ticket:", error);
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const refreshTicket = useCallback(async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      const data = await fetchTicketById(id);
      setTicket(data);
    } catch (error) {
      console.error("Failed to refresh ticket:", error);
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    if (!id) return;
    const ws = new WebSocket("ws://localhost:8080/workflow-service/web-socket/sla");
    ws.onopen = () => { ws.send(token ?? ""); };
    ws.onmessage = (event) => {
      if (Number(event.data) === Number(id)) refreshTicket();
    };
    return () => ws.close();
  }, [id, token, refreshTicket]);

  const availableTransitions = useMemo(() => {
    if (!ticket?.workflow) return [];
    return ticket.workflow.transitions.filter((t) => t.from.id === ticket.status.id);
  }, [ticket]);

  const currentStepIndex = useMemo(() => {
    if (!ticket?.workflow) return 0;
    return ticket.workflow.statuses.findIndex((s) => s.id === ticket.status.id);
  }, [ticket]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
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

  const isPaused = ticket.sla?.isPaused;
  const menuItems: MenuProps["items"] = [
    ...(!isPaused && ticket.sla ? [{
      key: "pause",
      label: "Pause SLA",
      disabled: actionLoading,
      onClick: handlePause,
    }] : []),
    ...(isPaused && ticket.sla ? [{
      key: "resume",
      label: "Resume SLA",
      disabled: actionLoading,
      onClick: handleResume,
    }] : []),
    ...(availableTransitions.length > 0 ? [
      { type: "divider" as const },
      ...availableTransitions.map((t) => ({
        key: t.name,
        label: t.name,
        disabled: actionLoading,
        onClick: () => handleTransition(t.name),
      })),
    ] : []),
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboard")}>
          Back
        </Button>
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
        <Title level={3} style={{ margin: 0 }}>Ticket #{ticket.id}</Title>
        <Tag color={ticket.status.color} style={{ fontSize: 13, padding: "2px 10px" }}>
          {ticket.status.name}
        </Tag>
        {ticket.sla && (
          isPaused
            ? <Tag icon={<PauseCircleOutlined />} color="orange">SLA Paused</Tag>
            : <Tag icon={<PlayCircleOutlined />} color="green">SLA Active</Tag>
        )}
      </div>

      {/* Workflow — always visible, full width */}
      {ticket.workflow && (
        <Card style={{ marginBottom: 16 }}>
          <Steps
            size="small"
            current={currentStepIndex}
            items={ticket.workflow.statuses.map((s) => ({
              title: <Tag color={s.color} style={{ margin: 0 }}>{s.name}</Tag>,
              description: <Text type="secondary" style={{ fontSize: 11 }}>{s.group}</Text>,
            }))}
          />
          {currentStepIndex === ticket.workflow.statuses.length - 1 && (
            <Alert message="This ticket has reached its final status." type="success" showIcon style={{ marginTop: 12 }} />
          )}
        </Card>
      )}

      <Row gutter={24} align="top">
        {/* Left column — main content */}
        <Col xs={24} lg={16}>
          {/* Summary */}
          <Card style={{ marginBottom: 16 }}>
            <Text strong>Summary: </Text>
            <Text style={{ fontSize: 15 }}>{ticket.summary}</Text>
          </Card>

          {/* Description */}
          {ticket.detail?.data && (
            <Card title="Description" style={{ marginBottom: 16 }}>
              <Text>{ticket.detail.data}</Text>
            </Card>
          )}

          {/* Comments */}
          <Card title={`Comments (${comments.length})`} style={{ marginBottom: 16 }} loading={commentsLoading}>
            {comments.length === 0 && !commentsLoading ? (
              <Text type="secondary">No comments yet.</Text>
            ) : (
              <List
                dataSource={comments}
                rowKey="id"
                renderItem={(comment) => (
                  <List.Item style={{ alignItems: "flex-start", padding: "12px 0" }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: "#1677ff" }}>
                          {comment.commenter.name.charAt(0).toUpperCase()}
                        </Avatar>
                      }
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

          {/* Add Comment */}
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

        {/* Right column — metadata */}
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
                {ticket.project.name} <Text style={{paddingLeft:2}} type="secondary">({ticket.project.code})</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text type="secondary">Issue Type</Text>}>
                {ticket.issueType.name}
              </Descriptions.Item>
              <Descriptions.Item label={<Text type="secondary">Reporter</Text>}>
                <div>{ticket.reporter.name}</div>
                <Text type="secondary" style={{ fontSize: 11, paddingLeft:2 }}>({ticket.reporter.email})</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text type="secondary">Assignee</Text>}>
                {ticket.assignee ? (
                  <>
                    <div>{ticket.assignee.name}</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>{ticket.assignee.email}</Text>
                  </>
                ) : (
                  <Text type="secondary">Unassigned</Text>
                )}
              </Descriptions.Item>
            </Descriptions>

            {ticket.sla && (
              <>
                <Divider style={{ margin: "12px 0" }} />
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
