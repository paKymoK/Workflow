import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Card, Descriptions, Spin, Tag, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { streamTicketById, type TicketSla } from "../api/ticketApi";

const { Title } = Typography;

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketSla | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const controller = streamTicketById(
      Number(id),
      (data) => {
        if (isMounted) {
          setTicket(data);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Ticket detail stream error:", error);
        if (isMounted) {
          setLoading(false);
        }
      },
      () => {
        if (isMounted) {
          setLoading(false);
        }
      },
    );

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  if (!ticket) {
    return <Title level={4}>Ticket not found</Title>;
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/dashboard")}
        />
        <Title level={3} className="!mb-0">
          Ticket #{ticket.id}
        </Title>
      </div>

      <Card className="mb-4">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Summary" span={2}>
            {ticket.summary}
          </Descriptions.Item>
          <Descriptions.Item label="Project">
            {ticket.project?.name} ({ticket.project?.code})
          </Descriptions.Item>
          <Descriptions.Item label="Issue Type">
            {ticket.issueType?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={ticket.status?.color}>{ticket.status?.name}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Priority">
            {ticket.priority?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Reporter">
            {ticket.reporter?.preferred_username ?? ticket.reporter?.name ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Assignee">
            {ticket.assignee?.preferred_username ??
              ticket.assignee?.name ??
              "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {ticket.sla && (
        <Card title="SLA">
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Time (second)">
              {ticket.sla.time}
            </Descriptions.Item>
            <Descriptions.Item label="Response Status">
              {ticket.sla.status?.response ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Response Time">
              {ticket.sla.status?.responseTime ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Resolution Status">
              {ticket.sla.status?.resolution ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Resolution Time">
              {ticket.sla.status?.resolutionTime ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Resolution Target (hrs)">
              {ticket.sla.priority?.resolutionTime}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </>
  );
}