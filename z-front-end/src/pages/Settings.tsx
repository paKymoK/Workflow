import { useEffect, useState } from "react";
import { Tabs, Table, Tag, Typography, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import { fetchWorkflows } from "../api/ticketApi";
import type { Workflow, WorkflowStatus } from "../api/types";

const { Title } = Typography;

function WorkflowList() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkflows()
      .then(setWorkflows)
      .finally(() => setLoading(false));
  }, []);

  const columns: ColumnsType<Workflow> = [
    {
      title: "ID",
      dataIndex: "id",
      width: 60,
    },
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Statuses",
      dataIndex: "statuses",
      render: (statuses: WorkflowStatus[]) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {statuses.map((s) => (
            <Tag key={s.id} color={s.color}>
              {s.name}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Transitions",
      dataIndex: "transitions",
      render: (transitions: Workflow["transitions"]) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {transitions.map((t, i) => (
            <span key={i}>
              <Tag color={t.from.color}>{t.from.name}</Tag>
              {"→"}
              <Tag color={t.to.color} style={{ marginLeft: 4 }}>{t.to.name}</Tag>
              <span style={{ color: "#888", fontSize: 12, marginLeft: 4 }}>({t.name})</span>
            </span>
          ))}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={workflows}
      pagination={false}
      onRow={(record) => ({
        onClick: () => navigate(`/settings/workflow/${record.id}`),
        style: { cursor: "pointer" },
      })}
    />
  );
}

const tabs = [
  {
    key: "workflow",
    label: "Workflow",
    children: <WorkflowList />,
  },
];

export default function Settings() {
  return (
    <div>
      <Title level={3}>Settings</Title>
      <Tabs items={tabs} />
    </div>
  );
}
