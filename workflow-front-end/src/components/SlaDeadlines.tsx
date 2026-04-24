import { memo } from "react";
import { Descriptions } from "antd";
import type { TicketSla } from "../api/types.ts";
import DeadlineTag from "./DeadlineTag.tsx";

type Props = {
  createdAt: string;
  sla: NonNullable<TicketSla["sla"]>;
};

const SlaDeadlines = memo(function SlaDeadlines({ createdAt, sla }: Props) {
  const { priority } = sla;

  return (
    <Descriptions bordered column={2}>
      <Descriptions.Item label="Response Time">
        {priority.responseTime} {priority.responseTime === 1 ? "hour" : "hours"}
      </Descriptions.Item>

      <Descriptions.Item label="Resolution Time">
        {priority.resolutionTime} {priority.resolutionTime === 1 ? "hour" : "hours"}
      </Descriptions.Item>

      <Descriptions.Item label="Response">
        <DeadlineTag createdAt={createdAt} sla={sla} type="response" />
      </Descriptions.Item>

      <Descriptions.Item label="Resolution">
        <DeadlineTag createdAt={createdAt} sla={sla} type="resolution" />
      </Descriptions.Item>
    </Descriptions>
  );
});

export default SlaDeadlines;
