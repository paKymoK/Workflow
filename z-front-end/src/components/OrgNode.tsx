import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { Avatar, Card, Tag } from "antd";
import { UserOutlined, PlusCircleOutlined, MinusCircleOutlined } from "@ant-design/icons";

interface OrgNodeData {
  name:           string;
  title:          string;
  department:     string;
  email:          string;
  hasChildren:    boolean;
  isExpanded:     boolean;
  onExpandToggle: (id: string) => void;
  [key: string]:  unknown;
}

export default function OrgNode({ id, data }: NodeProps) {
  const { name, title, department, hasChildren, isExpanded, onExpandToggle } =
    data as OrgNodeData;

  return (
    <>
      <Handle type="target" position={Position.Top} />

      <Card
        size="small"
        hoverable
        styles={{ body: { padding: "8px 12px" } }}
        className="!w-[200px] !rounded-lg !shadow-sm !cursor-pointer"
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

      {/* Expand / collapse toggle — only shown if node has children */}
      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExpandToggle(id);
          }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 
                     bg-white rounded-full shadow border border-gray-200
                     flex items-center justify-center
                     w-6 h-6 z-10 hover:border-blue-400 
                     hover:text-blue-500 transition-colors"
        >
          {isExpanded
            ? <MinusCircleOutlined className="text-xs" />
            : <PlusCircleOutlined  className="text-xs" />
          }
        </button>
      )}
    </>
  );
}