import { useState } from "react";
import { Upload, List, Button, Tooltip } from "antd";
import { InboxOutlined, DeleteOutlined, FileOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import type { AttachmentRef } from "../api/types";
import { uploadFile, getFileUrl } from "../api/ticketApi";

interface AttachmentUploadProps {
  value?: AttachmentRef[];
  onChange?: (attachments: AttachmentRef[]) => void;
  readonly?: boolean;
}

export default function AttachmentUpload({ value = [], onChange, readonly = false }: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false);

  const draggerProps: UploadProps = {
    name: "file",
    multiple: true,
    showUploadList: false,
    disabled: uploading,
    beforeUpload: async (file) => {
      setUploading(true);
      try {
        const uploaded = await uploadFile(file);
        onChange?.([...value, uploaded]);
      } finally {
        setUploading(false);
      }
      return false;
    },
  };

  const handleRemove = (id: string) => {
    onChange?.(value.filter((a) => a.id !== id));
  };

  return (
    <div>
      {!readonly && (
        <Upload.Dragger {...draggerProps} className="!mb-2">
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">{uploading ? "Uploading…" : "Click or drag files here to upload"}</p>
        </Upload.Dragger>
      )}
      {value.length > 0 && (
        <List
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
