import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { wsBaseUrl } from "@takypok/shared";
import { Icon } from "../components/ui/Icon";
import TicketDistributionCard from "../components/stats/TicketDistributionCard.tsx";
import ApplicationHealthCard from "../components/stats/ApplicationHealthCard.tsx";
import AvgResolutionCard from "../components/stats/AvgResolutionCard.tsx";
import KpiStrip from "../components/home/KpiStrip.tsx";
import SlaComplianceCard from "../components/home/SlaComplianceCard.tsx";
import LiveActivityFeed from "../components/home/LiveActivityFeed.tsx";

export default function Home() {
  const navigate = useNavigate();
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    const ws = new WebSocket(`${wsBaseUrl}/workflow-service/web-socket/sla`);
    ws.onopen    = () => { ws.send(token ?? ""); };
    ws.onmessage = () => { setRefetchKey((k) => k + 1); };
    return () => ws.close();
  }, []);

  return (
    <div className="p-2 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        <div>
          <div className="text-xl font-bold text-[var(--text)]">Overview</div>
          <div className="text-[12.5px] text-[var(--text-faint)] mt-0.5">Real-time snapshot of workflow health</div>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] text-[12.5px] font-semibold cursor-pointer hover:bg-[var(--hover)] transition-colors"
        >
          Open queue
          <Icon name="chevR" size={13} stroke={2.2} />
        </button>
      </div>

      {/* Row 0 — KPI strip: 4 equal cards */}
      <KpiStrip refetchKey={refetchKey} />

      {/* Row 1 — ApplicationHealthCard needs full width (complex header + chart) */}
      <div className="min-w-0 overflow-hidden">
        <ApplicationHealthCard refetchKey={refetchKey} />
      </div>

      {/* Row 2 — SLA compliance, full width */}
      <SlaComplianceCard refetchKey={refetchKey} />

      {/* Row 3 — ticket distribution, full width */}
      <div className="min-w-0 overflow-hidden">
        <TicketDistributionCard refetchKey={refetchKey} />
      </div>

      {/* Row 4 — avg resolution chart + live activity feed */}
      <div className="grid [grid-template-columns:1.6fr_1fr] [grid-template-rows:560px] gap-[14px]">
        <div className="min-w-0 overflow-y-auto">
          <AvgResolutionCard refetchKey={refetchKey} />
        </div>
        <div className="min-w-0 h-full">
          <LiveActivityFeed />
        </div>
      </div>
    </div>
  );
}
