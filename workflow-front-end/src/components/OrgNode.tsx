import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { Avatar, Tag } from "antd";
import { UserOutlined, PlusCircleOutlined, MinusCircleOutlined } from "@ant-design/icons";

interface OrgNodeData {
  name:           string;
  title:          string;
  department:     string;
  email:          string;
  avatar:         string | null;
  hasChildren:    boolean;
  isExpanded:     boolean;
  onExpandToggle: (id: string) => void;
  [key: string]:  unknown;
}

export default function OrgNode({ id, data }: NodeProps) {
  const { name, title, department, avatar, hasChildren, isExpanded, onExpandToggle } =
    data as OrgNodeData;

  return (
    <>
      <Handle type="target" position={Position.Top} />

      <div className="w-[200px] bg-[var(--dark)] border border-[rgba(255,229,0,0.3)] hover:border-[var(--neon-yellow)] hover:shadow-[0_0_12px_rgba(255,229,0,0.2)] transition-all cursor-pointer px-3 pt-2 pb-4">
        <div className="flex items-center gap-2">
          <Avatar
            size={34}
            src={avatar ?? undefined}
            icon={!avatar && <UserOutlined />}
            className="!bg-[var(--neon-yellow)] !text-black flex-shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-mono-tech text-[12px] text-[var(--white)] leading-tight truncate font-semibold">
              {name}
            </span>
            {title && (
              <span className="font-mono-tech text-[10px] text-[rgba(240,240,240,0.45)] truncate">
                {title}
              </span>
            )}
            {department && (
              <Tag className="!mt-1 !text-[9px] !px-1.5 !py-0 w-fit !border-[rgba(0,245,255,0.4)] !bg-[rgba(0,245,255,0.08)] !text-[var(--neon-cyan)]">
                {department}
              </Tag>
            )}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />

      {/* Expand / collapse toggle */}
      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExpandToggle(id);
          }}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2
                     w-4 h-4 rounded-full z-10 flex items-center justify-center
                     bg-[var(--neon-yellow)] border border-[var(--neon-yellow)]
                     text-black hover:bg-[var(--neon-pink)] hover:border-[var(--neon-pink)]
                     hover:text-white transition-colors shadow-[0_0_6px_rgba(255,229,0,0.6)]"
        >
          {isExpanded
            ? <MinusCircleOutlined className="!text-[9px]" />
            : <PlusCircleOutlined  className="!text-[9px]" />
          }
        </button>
      )}
    </>
  );
}
