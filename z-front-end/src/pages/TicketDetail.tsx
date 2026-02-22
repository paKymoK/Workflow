import { useParams, useNavigate } from "react-router-dom";
import { Spin, Typography, Card, Descriptions, Tag, Button, Steps, Alert, Dropdown, message } from "antd";
import { ArrowLeftOutlined, PauseCircleOutlined, PlayCircleOutlined, RightOutlined, DownOutlined, MoreOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import type { TicketSla } from "../api/types.ts";
import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchTicketById, pauseTicket, resumeTicket, transitionTicket } from "../api/ticketApi";
import SlaDeadlines from "../components/SlaDeadlines.tsx";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketSla | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const token = sessionStorage.getItem("access_token");

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
  }, [id]);

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
  }, [id]);

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
  }, [id, ticket]);

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

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboard")} className="mb-4">
        Back to Dashboard
      </Button>

      <Card
        title={
          <div className="flex items-center gap-3">
            <Title level={3} style={{ margin: 0 }}>
              Ticket #{ticket.id}
            </Title>
            <Tag color={ticket.status.color}>{ticket.status.name}</Tag>
          </div>
        }
        extra={
          <div className="flex items-center gap-2">
            {(refreshing || actionLoading) && <Spin size="small" />}
            {ticket.sla && (() => {
              const isPaused = ticket.sla.isPaused;
              const menuItems: MenuProps["items"] = [
                ...(!isPaused ? [{
                  key: "pause",
                  label: "Pause",
                  disabled: actionLoading,
                  onClick: handlePause,
                }] : []),
                ...(isPaused ? [{
                  key: "resume",
                  label: "Resume",
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
                <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
                  <Button type="text" icon={<MoreOutlined rotate={90} />} />
                </Dropdown>
              );
            })()}
          </div>
        }
      >
        {/* SLA Information */}
        {ticket.sla && (
          <Card
            title={
              <div className="flex items-center gap-2">
                SLA Information
                {ticket.sla.isPaused ? (
                  <Tag icon={<PauseCircleOutlined />} color="orange">Paused</Tag>
                ) : (
                  <Tag icon={<PlayCircleOutlined />} color="green">Active</Tag>
                )}
              </div>
            }
            className="mb-4"
            type="inner"
          >
            <SlaDeadlines createdAt={ticket.createdAt} sla={ticket.sla} />
          </Card>
        )}

        {/* Basic Information */}
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Summary" span={2}>
            {ticket.summary}
          </Descriptions.Item>

          <Descriptions.Item label="Created At">
            {dayjs(ticket.createdAt).format("DD MMM YYYY, HH:mm:ss")}
          </Descriptions.Item>

          <Descriptions.Item label="Priority">
            {ticket.priority.name}
          </Descriptions.Item>

          <Descriptions.Item label="Project">
            {ticket.project.name} ({ticket.project.code})
          </Descriptions.Item>

          <Descriptions.Item label="Issue Type">
            {ticket.issueType.name}
          </Descriptions.Item>

          <Descriptions.Item label="Reporter">
            <div>{ticket.reporter.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{ticket.reporter.email}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Assignee">
            {ticket.assignee ? (
              <div>
                <div>{ticket.assignee.name}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>{ticket.assignee.email}</Text>
              </div>
            ) : (
              <Text type="secondary">Unassigned</Text>
            )}
          </Descriptions.Item>
        </Descriptions>

        {/* Detail / Description */}
        {ticket.detail?.data && (
          <Card title="Description" className="mt-4" type="inner">
            <Text>{ticket.detail.data}</Text>
          </Card>
        )}

        {/* Workflow */}
        {ticket.workflow && (
          <Card
            title={
              <div
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => setWorkflowOpen((v) => !v)}
              >
                {workflowOpen ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}
                <span>
                  Workflow: <Text strong>{ticket.workflow.name}</Text>
                </span>
              </div>
            }
            className="mt-4"
            type="inner"
          >
            {workflowOpen && (
              <>
                <Steps
                  current={currentStepIndex}
                  items={ticket.workflow.statuses.map((s) => ({
                    title: (
                      <Tag color={s.color} style={{ margin: 0 }}>
                        {s.name}
                      </Tag>
                    ),
                    description: <Text type="secondary" style={{ fontSize: 11 }}>{s.group}</Text>,
                  }))}
                />

                {availableTransitions.length > 0 && (
                  <div className="mt-4">
                    <Text type="secondary">Available transitions:</Text>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableTransitions.map((t, i) => (
                        <Tag
                          key={i}
                          color="blue"
                          style={{ cursor: "default" }}
                        >
                          {t.name}: {t.from.name} → {t.to.name}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}

                {currentStepIndex === ticket.workflow.statuses.length - 1 && (
                  <Alert
                    message="This ticket has reached its final status."
                    type="success"
                    showIcon
                    className="mt-4"
                  />
                )}
              </>
            )}
          </Card>
        )}

      </Card>
    </div>
  );
}
