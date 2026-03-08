import { Tabs } from "antd";
import WorkflowList from "../components/settings/WorkflowList";
import UserList from "../components/settings/UserList";
import OrgChartView from "../components/settings/OrgChartView";

const tabs = [
  { key: "workflow", label: "Workflow", children: <WorkflowList /> },
  { key: "user",     label: "User",     children: <UserList /> },
  { key: "orgChart", label: "Org Chart", children: <OrgChartView /> },
];

export default function Settings() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="font-bebas text-3xl tracking-[0.15em] neon-text-yellow m-0">▸ SETTINGS</h2>
        <span className="font-mono-tech text-xs text-[rgba(240,240,240,0.3)] tracking-widest">// SYSTEM CONFIG</span>
      </div>
      <Tabs items={tabs} />
    </div>
  );
}
