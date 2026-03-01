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
        <div className="flex gap-1.5 flex-wrap">
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
        <div className="flex flex-col gap-1">
          {transitions.map((t, i) => (
            <span key={i}>
              <Tag color={t.from.color}>{t.from.name}</Tag>
              {"→"}
              <Tag color={t.to.color} className="!ml-1">{t.to.name}</Tag>
              <span className="text-gray-400 text-xs ml-1">({t.name})</span>
            </span>
          ))}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="text-center py-12">
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
