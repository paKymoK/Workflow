import { useRef, useState } from "react";
import { Upload, Image, Button, Skeleton, Tooltip } from "antd";
import {
  InboxOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileZipOutlined,
  FileTextOutlined,
  FileOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import type { AttachmentRef } from "../api/types";
import { uploadFile, getFileUrl } from "../api/ticketApi";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]);

function isImage(ext: string) {
  return IMAGE_EXTS.has(ext.toLowerCase());
}

function FileTypeIcon({ extension }: { extension: string }) {
  const ext = extension.toLowerCase();
  if (ext === ".pdf")
    return <FilePdfOutlined className="text-4xl" style={{ color: "#f87171" }} />;
  if ([".xls", ".xlsx"].includes(ext))
    return <FileExcelOutlined className="text-4xl" style={{ color: "#4ade80" }} />;
  if ([".doc", ".docx"].includes(ext))
    return <FileWordOutlined className="text-4xl" style={{ color: "#60a5fa" }} />;
  if ([".zip", ".rar", ".7z", ".tar", ".gz"].includes(ext))
    return <FileZipOutlined className="text-4xl" style={{ color: "#fb923c" }} />;
  if ([".txt", ".md", ".csv"].includes(ext))
    return <FileTextOutlined className="text-4xl" style={{ color: "#a78bfa" }} />;
  return <FileOutlined className="text-4xl" style={{ color: "#94a3b8" }} />;
}

interface AttachmentUploadProps {
  value?: AttachmentRef[];
  onChange?: (attachments: AttachmentRef[]) => void;
  readonly?: boolean;
}

type PendingEntry = { tempId: string; name: string };

export default function AttachmentUpload({
  value = [],
  onChange,
  readonly = false,
}: AttachmentUploadProps) {
  const [pending, setPending] = useState<PendingEntry[]>([]);
  const valueRef = useRef(value);
  valueRef.current = value;

  const draggerProps: UploadProps = {
    name: "file",
    multiple: true,
    showUploadList: false,
    beforeUpload: async (file) => {
      const tempId = `${Date.now()}-${Math.random()}`;
      setPending((prev) => [...prev, { tempId, name: file.name }]);
      try {
        const uploaded = await uploadFile(file);
        onChange?.([...valueRef.current, uploaded]);
      } finally {
        setPending((prev) => prev.filter((p) => p.tempId !== tempId));
      }
      return false;
    },
  };

  const handleRemove = (id: string) => {
    onChange?.(value.filter((a) => a.id !== id));
  };

  const hasContent = value.length > 0 || pending.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {!readonly && (
        <Upload.Dragger
          {...draggerProps}
          className={hasContent ? "!py-2" : ""}
          style={{ borderRadius: 8 }}
        >
          <p className="ant-upload-drag-icon" style={{ marginBottom: 4 }}>
            <InboxOutlined style={{ fontSize: hasContent ? 20 : 32 }} />
          </p>
          <p
            className="ant-upload-text"
            style={{ fontSize: hasContent ? 12 : 14, margin: 0 }}
          >
            Click or drag files here to upload
          </p>
          {!hasContent && (
            <p className="ant-upload-hint" style={{ fontSize: 11 }}>
              Images, PDFs, documents, archives supported
            </p>
          )}
        </Upload.Dragger>
      )}

      {hasContent && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 96px)", gap: 12 }}>
          {/* Uploaded files */}
          {value.map((item) => {
            const url = getFileUrl(item.id, item.extension);
            const label = `${item.name}${item.extension}`;

            return isImage(item.extension) ? (
              <div key={item.id} className="relative group" style={{ width: 96 }}>
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    width: 96,
                    height: 96,
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Image
                    src={url}
                    alt={label}
                    width={96}
                    height={96}
                    style={{ objectFit: "cover", display: "block" }}
                    preview={{ mask: false }}
                  />
                </div>

                {!readonly && (
                  <Tooltip title="Remove">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemove(item.id)}
                      className="!absolute -top-2 -right-2 !rounded-full !w-6 !h-6 !min-w-0 !p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "var(--darker, #1a1a2e)" }}
                    />
                  </Tooltip>
                )}

                <Tooltip title={label}>
                  <p
                    className="text-center truncate mt-1"
                    style={{ fontSize: 11, color: "var(--text-muted)", width: 96 }}
                  >
                    {label}
                  </p>
                </Tooltip>
              </div>
            ) : (
              <div key={item.id} className="relative group" style={{ width: 96 }}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg"
                  style={{
                    width: 96,
                    height: 96,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    textDecoration: "none",
                  }}
                >
                  <FileTypeIcon extension={item.extension} />
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: 3,
                      padding: "1px 4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {item.extension.replace(".", "")}
                  </span>
                </a>

                {!readonly && (
                  <Tooltip title="Remove">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemove(item.id)}
                      className="!absolute -top-2 -right-2 !rounded-full !w-6 !h-6 !min-w-0 !p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "var(--darker, #1a1a2e)" }}
                    />
                  </Tooltip>
                )}

                <Tooltip title={label}>
                  <p
                    className="text-center truncate mt-1"
                    style={{ fontSize: 11, color: "var(--text-muted)", width: 96 }}
                  >
                    {label}
                  </p>
                </Tooltip>
              </div>
            );
          })}

          {/* Skeleton cards for in-flight uploads */}
          {pending.map(({ tempId, name }) => (
            <Tooltip key={tempId} title={name}>
              <div
                className="rounded-lg flex items-center justify-center"
                style={{
                  width: 96,
                  height: 96,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.03)",
                  flexShrink: 0,
                }}
              >
                <Skeleton.Image active style={{ width: 80, height: 80 }} />
              </div>
            </Tooltip>
          ))}
        </div>
      )}

      {value.length === 0 && pending.length === 0 && readonly && (
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>No attachments</span>
      )}
    </div>
  );
}
