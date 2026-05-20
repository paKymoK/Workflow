import { useRef, useState } from "react";
import { Button, List, Spin, Tooltip } from "antd";
import { PaperClipOutlined, DeleteOutlined, FileOutlined } from "@ant-design/icons";
import type { AttachmentRef } from "../api/types";
import { uploadFile, getFileUrl } from "../api/ticketApi";

interface AttachmentUploadProps {
  value?: AttachmentRef[];
  onChange?: (attachments: AttachmentRef[]) => void;
  readonly?: boolean;
}

export default function AttachmentUpload({ value = [], onChange, readonly = false }: AttachmentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const uploaded = await uploadFile(file);
      onChange?.([...value, uploaded]);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (id: string) => {
    onChange?.(value.filter((a) => a.id !== id));
  };

  return (
    <div>
      {!readonly && (
        <>
          <Button
            icon={uploading ? <Spin size="small" /> : <PaperClipOutlined />}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Attach File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </>
      )}
      {value.length > 0 && (
        <List
          className="mt-2"
          size="small"
          dataSource={value}
          renderItem={(item) => (
            <List.Item
              actions={
                !readonly
                  ? [
                      <Tooltip title="Remove" key="remove">
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemove(item.id)}
                        />
                      </Tooltip>,
                    ]
                  : undefined
              }
            >
              <a
                href={getFileUrl(item.id, item.extension)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[var(--neon-yellow)] hover:underline"
              >
                <FileOutlined />
                {item.name}{item.extension}
              </a>
            </List.Item>
          )}
        />
      )}
      {value.length === 0 && readonly && (
        <span className="text-[var(--text-muted)] text-sm">No attachments</span>
      )}
    </div>
  );
}
