import { useParams, useNavigate } from "react-router-dom";
import { Spin, Typography, Card, Descriptions, Tag, Button, Steps, Alert } from "antd";
import { ArrowLeftOutlined, PauseCircleOutlined, PlayCircleOutlined, RightOutlined, DownOutlined } from "@ant-design/icons";
import type { TicketSla } from "../api/types.ts";
import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchTicketById } from "../api/ticketApi";
import { calculateOfficeEndTime } from "../utils/sla.ts";
import dayjs from "dayjs";

const { Title, Text } = Typography;


function formatDeadline(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketSla | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const token = sessionStorage.getItem("access_token");

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

  const slaDeadlines = useMemo(() => {
    if (!ticket?.sla || !ticket.createdAt) return null;
    const { setting, priority } = ticket.sla;
    const from = new Date(ticket.createdAt);
    const opts = {
      from,
      timezone: setting.timezone,
      workStart: setting.workStart,
      workEnd: setting.workEnd,
      lunchStart: setting.lunchStart,
      lunchEnd: setting.lunchEnd,
      weekendDays: setting.weekend,
    };
    try {
      return {
        response: calculateOfficeEndTime({ ...opts, hoursToWork: priority.responseTime }),
        resolution: calculateOfficeEndTime({ ...opts, hoursToWork: priority.resolutionTime }),
      };
    } catch {
      return null;
    }
  }, [ticket]);

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
        extra={refreshing && <Spin size="small" />}
      >
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
            className="mt-4"
            type="inner"
          >
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Response Time">
                {ticket.sla.priority.responseTime} {ticket.sla.priority.responseTime === 1 ? "hour" : "hours"}
              </Descriptions.Item>

              <Descriptions.Item label="Resolution Time">
                {ticket.sla.priority.resolutionTime} {ticket.sla.priority.resolutionTime === 1 ? "hour" : "hours"}
              </Descriptions.Item>

              <Descriptions.Item label="Response Status">
                {ticket.sla.status.response ? (
                  <Tag color={ticket.sla.status.isResponseOverdue ? "red" : "green"}>
                    {ticket.sla.status.response}
                    {ticket.sla.status.isResponseOverdue && " (Overdue)"}
                  </Tag>
                ) : "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Resolution Status">
                {ticket.sla.status.resolution ? (
                  <Tag color={ticket.sla.status.isResolutionOverdue ? "red" : "green"}>
                    {ticket.sla.status.resolution}
                    {ticket.sla.status.isResolutionOverdue && " (Overdue)"}
                  </Tag>
                ) : "-"}
              </Descriptions.Item>

              {slaDeadlines && (
                <>
                  <Descriptions.Item label="Response Deadline">
                    <Text>{formatDeadline(slaDeadlines.response, ticket.sla.setting.timezone)}</Text>
                  </Descriptions.Item>

                  <Descriptions.Item label="Resolution Deadline">
                    <Text>{formatDeadline(slaDeadlines.resolution, ticket.sla.setting.timezone)}</Text>
                  </Descriptions.Item>
                </>
              )}

            </Descriptions>
          </Card>
        )}
      </Card>
    </div>
  );
}
