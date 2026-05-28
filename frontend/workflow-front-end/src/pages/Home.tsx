import { useEffect, useState } from "react";
import { wsBaseUrl } from "@takypok/shared";
import TicketDistributionCard from "../components/stats/TicketDistributionCard.tsx";
import SlaOverviewCard from "../components/stats/SlaOverviewCard.tsx";
import ApplicationHealthCard from "../components/stats/ApplicationHealthCard.tsx";

export default function Home() {
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    const ws = new WebSocket(`${wsBaseUrl}/workflow-service/web-socket/sla`);
    ws.onopen    = () => { ws.send(token ?? ""); };
    ws.onmessage = () => { setRefetchKey((k) => k + 1); };
    return () => ws.close();
  }, []);

  return (
    <div className="p-2">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-bebas text-3xl tracking-[0.15em] neon-text-yellow m-0">▸ OVERVIEW</h2>
        <span className="font-mono-tech text-xs text-[rgba(240,240,240,0.3)] tracking-widest">// ANALYTICS TERMINAL</span>
      </div>

      <div className="flex flex-col gap-6">
        <TicketDistributionCard refetchKey={refetchKey} />
        <SlaOverviewCard refetchKey={refetchKey} />
        <ApplicationHealthCard refetchKey={refetchKey} />
      </div>
    </div>
  );
}
