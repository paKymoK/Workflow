import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { Avatar, Card, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";

interface OrgNodeData {
  name: string;
  title: string;
  department: string;
  email: string;
  onViewDetail: (sub: string) => void;
  [key: string]: unknown;
}

export default function OrgNode({ id, data }: NodeProps) {
  const { name, title, department, onViewDetail } = data as OrgNodeData;

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Card
        size="small"
        hoverable
        styles={{ body: { padding: "8px 12px" } }}
        style={{ width: 200, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,.12)", cursor: "pointer" }}
        onClick={() => (onViewDetail as (sub: string) => void)(id)}
      >
        <div className="flex items-center gap-2">
          <Avatar size={36} icon={<UserOutlined />} />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm leading-tight truncate">{name}</span>
            {title && (
              <span className="text-xs text-gray-500 truncate">{title}</span>
            )}
            {department && (
              <Tag color="blue" className="!mt-1 !text-xs w-fit">{department}</Tag>
            )}
          </div>
        </div>
      </Card>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}
