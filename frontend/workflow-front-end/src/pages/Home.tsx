import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { wsBaseUrl } from "@takypok/shared";
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-bebas text-3xl tracking-[0.15em] neon-text-acc m-0">▸ OVERVIEW</h2>
          <span className="font-mono-tech text-xs text-[var(--fg-faint)] tracking-widest">// ANALYTICS TERMINAL</span>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="font-bebas text-xs tracking-[.15em] text-[var(--acc-1)] border border-[var(--line)] px-3 py-1.5 hover:border-[var(--acc-1)] hover:bg-[var(--bg-2)] transition-colors cursor-crosshair"
        >
          OPEN QUEUE →
        </button>
      </div>

      {/* Row 0 — KPI strip: 4 equal cards */}
      <KpiStrip refetchKey={refetchKey} />

      {/* Row 1 — ApplicationHealthCard needs full width (complex header + chart) */}
      <div className="min-w-0 overflow-hidden">
        <ApplicationHealthCard refetchKey={refetchKey} />
      </div>

      {/* Row 2 — TicketDistribution (chart+table, needs ~60%) | SlaCompliance panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, alignItems: "start" }}>
        <div className="min-w-0 overflow-hidden">
          <TicketDistributionCard refetchKey={refetchKey} />
        </div>
        <SlaComplianceCard refetchKey={refetchKey} />
      </div>

      {/* Row 3 — AvgResolution (chart+table, needs ~60%) | LiveActivity feed */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, alignItems: "start" }}>
        <div className="min-w-0 overflow-hidden">
          <AvgResolutionCard refetchKey={refetchKey} />
        </div>
        <LiveActivityFeed />
      </div>
    </div>
  );
}
