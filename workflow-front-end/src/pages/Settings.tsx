import { Tabs, Typography } from "antd";
import WorkflowList from "../components/settings/WorkflowList";
import UserList from "../components/settings/UserList";
import OrgChartView from "../components/settings/OrgChartView";

const { Title } = Typography;

const tabs = [
  { key: "workflow", label: "Workflow", children: <WorkflowList /> },
  { key: "user",     label: "User",     children: <UserList /> },
  { key: "orgChart", label: "Org Chart", children: <OrgChartView /> },
];

export default function Settings() {
  return (
    <div>
      <Title level={3}>Settings</Title>
      <Tabs items={tabs} />
    </div>
  );
}
