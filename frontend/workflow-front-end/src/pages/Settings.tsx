import { Tabs, Button, Tooltip } from "antd";
import { useUrlState } from "@state";
import { TeamOutlined } from "@ant-design/icons";
import WorkflowList from "../components/settings/WorkflowList";
import StatusList from "../components/settings/StatusList";
import PriorityList from "../components/settings/PriorityList";
import ProjectList from "../components/settings/ProjectList";

const workflowTabs = [
  { key: "workflow", label: "Workflow", children: <WorkflowList /> },
  { key: "status",   label: "Status",   children: <StatusList /> },
  { key: "priority", label: "Priority", children: <PriorityList /> },
  { key: "project",  label: "Project",  children: <ProjectList /> },
];

export default function Settings() {
  const [wfTab, setWfTab] = useUrlState("wfTab", "workflow");

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="font-bebas text-3xl tracking-[0.15em] neon-text-yellow m-0">▸ SETTINGS</h2>
          <span className="font-mono-tech text-xs text-[rgba(240,240,240,0.3)] tracking-widest">// SYSTEM CONFIG</span>
        </div>
        <Tooltip title="Manage users, groups, clients and roles">
          <Button
            icon={<TeamOutlined />}
            href="/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono-tech text-xs"
          >
            IAM Portal
          </Button>
        </Tooltip>
      </div>

      <Tabs activeKey={wfTab} onChange={setWfTab} items={workflowTabs} />
    </div>
  );
}
