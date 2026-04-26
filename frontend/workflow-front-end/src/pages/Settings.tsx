import { Tabs } from "antd";
import { useUrlState } from "@state";
import WorkflowList from "../components/settings/WorkflowList";
import UserList from "../components/settings/UserList";
import OrgChartView from "../components/settings/OrgChartView";
import StatusList from "../components/settings/StatusList";
import PriorityList from "../components/settings/PriorityList";
import ProjectList from "../components/settings/ProjectList";
import ClientList from "../components/settings/ClientList";
import GroupList from "../components/settings/GroupList";
import RoleList from "../components/settings/RoleList";

const authTabs = [
  { key: "user",     label: "User",      children: <UserList /> },
  { key: "orgChart", label: "Org Chart", children: <OrgChartView /> },
  { key: "client",   label: "Client",    children: <ClientList /> },
  { key: "group",    label: "Group",     children: <GroupList /> },
  { key: "role",     label: "Role",      children: <RoleList /> },
];

const workflowTabs = [
  { key: "workflow", label: "Workflow", children: <WorkflowList /> },
  { key: "status",   label: "Status",   children: <StatusList /> },
  { key: "priority", label: "Priority", children: <PriorityList /> },
  { key: "project",  label: "Project",  children: <ProjectList /> },
];

const sections = [
  {
    key: "auth",
    label: "Auth",
    tabs: authTabs,
    defaultInner: "user",
    innerKey: "authTab",
  },
  {
    key: "workflow",
    label: "Workflow",
    tabs: workflowTabs,
    defaultInner: "workflow",
    innerKey: "wfTab",
  },
];

export default function Settings() {
  const [section,  setSection]  = useUrlState("section",  "auth");
  const [authTab,  setAuthTab]  = useUrlState("authTab",  "user");
  const [wfTab,    setWfTab]    = useUrlState("wfTab",    "workflow");

  const active = sections.find((s) => s.key === section) ?? sections[0];
  const innerValue  = active.key === "auth" ? authTab : wfTab;
  const setInner    = active.key === "auth" ? setAuthTab : setWfTab;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="font-bebas text-3xl tracking-[0.15em] neon-text-yellow m-0">▸ SETTINGS</h2>
        <span className="font-mono-tech text-xs text-[rgba(240,240,240,0.3)] tracking-widest">// SYSTEM CONFIG</span>
      </div>

      <Tabs
        activeKey={section}
        onChange={setSection}
        type="card"
        items={sections.map((s) => ({
          key: s.key,
          label: s.label,
          children: (
            <Tabs
              activeKey={innerValue}
              onChange={setInner}
              items={s.tabs}
            />
          ),
        }))}
      />
    </div>
  );
}
