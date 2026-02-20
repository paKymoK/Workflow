import { useParams, useNavigate } from "react-router-dom";
import { Spin, Typography, Card, Descriptions, Tag, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import type {TicketSla} from "../api/types.ts";
import {useState, useEffect, useCallback} from "react";
import { fetchTicketById } from "../api/ticketApi";

const { Title } = Typography;

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketSla | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const token = sessionStorage.getItem("access_token");

  // Load ticket data
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

  // Refresh ticket data (for websocket updates)
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

  // Initial load
  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  // WebSocket setup
  useEffect(() => {
    if (!id) return;

    const ws = new WebSocket("ws://localhost:8080/workflow-service/web-socket/sla");

    ws.onopen = () => {
      ws.send(token ?? "");
    };

    ws.onmessage = (event) => {
      const ticketId = Number(event.data);
      // Only refresh if the update is for this ticket
      if (ticketId === Number(id)) {
        refreshTicket();
      }
    };

    return () => ws.close();
  }, [id, token, refreshTicket]);

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
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          Back to Dashboard
        </Button>
        <Title level={4}>Ticket not found</Title>
      </div>
    );
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/dashboard")}
        className="mb-4"
      >
        Back to Dashboard
      </Button>

      <Card title={<Title level={3}>Ticket #{ticket.id}</Title>} extra={refreshing && <Spin size="small" />}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Summary" span={2}>
            {ticket.summary}
          </Descriptions.Item>

          <Descriptions.Item label="Project">
            {ticket.project.name} ({ticket.project.code})
          </Descriptions.Item>

          <Descriptions.Item label="Issue Type">
            {ticket.issueType.name}
          </Descriptions.Item>

          <Descriptions.Item label="Status">
            <Tag color={ticket.status.color}>{ticket.status.name}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Priority">
            {ticket.priority.name}
          </Descriptions.Item>

          <Descriptions.Item label="Reporter">
            {ticket.reporter.preferred_username ?? ticket.reporter.name ?? ticket.reporter.sub}
          </Descriptions.Item>

          <Descriptions.Item label="Assignee">
            {ticket.assignee
              ? (ticket.assignee.preferred_username ?? ticket.assignee.name ?? ticket.assignee.sub)
              : "-"}
          </Descriptions.Item>
        </Descriptions>

        {ticket.sla && (
          <Card title="SLA Information" className="mt-4" type="inner">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Response Time">
                {ticket.sla.priority.responseTime} hours
              </Descriptions.Item>

              <Descriptions.Item label="Resolution Time">
                {ticket.sla.priority.resolutionTime} hours
              </Descriptions.Item>

              <Descriptions.Item label="Response Status">
                {ticket.sla.status.response ? (
                  <Tag color={ticket.sla.status.isResponseOverdue ? "red" : "green"}>
                    {ticket.sla.status.response}
                  </Tag>
                ) : "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Resolution Status">
                {ticket.sla.status.resolution ? (
                  <Tag color={ticket.sla.status.isResolutionOverdue ? "red" : "green"}>
                    {ticket.sla.status.resolution}
                  </Tag>
                ) : "-"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </Card>
    </div>
  );
}