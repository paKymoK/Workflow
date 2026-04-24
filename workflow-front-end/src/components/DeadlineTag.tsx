import { memo, useState, useEffect, useMemo } from "react";
import { Tag } from "antd";
import { calculateOfficeEndTime } from "../utils/sla.ts";
import type { TicketSla } from "../api/types.ts";

type Props = {
  createdAt: string;
  sla: NonNullable<TicketSla["sla"]>;
  type: "response" | "resolution";
};

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

const DeadlineTag = memo(function DeadlineTag({ createdAt, sla, type }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!sla.isPaused) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [sla.isPaused]);

  const deadline = useMemo(() => {
    const { setting, priority } = sla;
    const hoursToWork = type === "response" ? priority.responseTime : priority.resolutionTime;
    try {
      return calculateOfficeEndTime({
        from: new Date(createdAt),
        timezone: setting.timezone,
        workStart: setting.workStart,
        workEnd: setting.workEnd,
        lunchStart: setting.lunchStart,
        lunchEnd: setting.lunchEnd,
        weekendDays: setting.weekend,
        pausedTime: sla.pausedTime,
        hoursToWork,
      });
    } catch {
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdAt, sla, now]);

  if (!deadline) return <span>-</span>;

  const overdue = type === "response"
    ? (sla.status.isResponseOverdue ?? false)
    : (sla.status.isResolutionOverdue ?? false);

  return (
    <Tag color={overdue ? "red" : "green"}>
      {formatDeadline(deadline, sla.setting.timezone)}
    </Tag>
  );
});

export default DeadlineTag;
