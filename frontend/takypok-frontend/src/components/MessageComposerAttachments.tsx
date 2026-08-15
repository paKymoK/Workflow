import { Button, Spin, Tooltip } from "antd";
import { CloseOutlined, PictureOutlined, VideoCameraOutlined } from "@ant-design/icons";
import type { MessageAttachment } from "../api/types";

export interface PendingAttachment {
  key: string;
  name: string;
  kind: "image" | "video";
  status: "uploading" | "processing" | "ready" | "failed";
  attachment?: MessageAttachment;
}

interface Props {
  items: PendingAttachment[];
  onRemove: (key: string) => void;
}

export default function MessageComposerAttachments({ items, onRemove }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="flex gap-2 px-4 pt-2 flex-wrap">
      {items.map((item) => (
        <Tooltip key={item.key} title={item.name}>
          <div className="relative w-14 h-14 rounded-lg border border-[var(--border)] bg-[var(--hover)] flex items-center justify-center overflow-hidden">
            {item.status === "ready" && item.attachment?.type === "IMAGE" && item.attachment.url ? (
              <img src={item.attachment.url} alt={item.name} className="w-full h-full object-cover" />
            ) : item.kind === "video" ? (
              <VideoCameraOutlined className="text-lg text-[var(--text-faint)]" />
            ) : (
              <PictureOutlined className="text-lg text-[var(--text-faint)]" />
            )}

            {(item.status === "uploading" || item.status === "processing") && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Spin size="small" />
              </div>
            )}

            {item.status === "failed" && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-[var(--red)] text-[9px]">Failed</span>
              </div>
            )}

            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => onRemove(item.key)}
              className="!absolute -top-1.5 -right-1.5 !w-4 !h-4 !min-w-0 !p-0 !bg-[var(--surface)] !rounded-full"
            />
          </div>
        </Tooltip>
      ))}
    </div>
  );
}
