import { useEffect, useRef, useState } from "react";
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
    return <FilePdfOutlined className="text-4xl text-red-400" />;
  if ([".xls", ".xlsx"].includes(ext))
    return <FileExcelOutlined className="text-4xl text-green-400" />;
  if ([".doc", ".docx"].includes(ext))
    return <FileWordOutlined className="text-4xl text-blue-400" />;
  if ([".zip", ".rar", ".7z", ".tar", ".gz"].includes(ext))
    return <FileZipOutlined className="text-4xl text-orange-400" />;
  if ([".txt", ".md", ".csv"].includes(ext))
    return <FileTextOutlined className="text-4xl text-violet-400" />;
  return <FileOutlined className="text-4xl text-slate-400" />;
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
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

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
          className={hasContent ? "!py-2 !rounded-lg" : "!rounded-lg"}
        >
          <p className={`ant-upload-drag-icon ${hasContent ? "!mb-1" : ""}`}>
            <InboxOutlined className={hasContent ? "text-[20px]" : "text-[32px]"} />
          </p>
          <p className={`ant-upload-text ${hasContent ? "!text-xs" : "!text-sm"} !m-0`}>
            Click or drag files here to upload
          </p>
          {!hasContent && (
            <p className="ant-upload-hint !text-[11px]">
              Images, PDFs, documents, archives supported
            </p>
          )}
        </Upload.Dragger>
      )}

      {hasContent && (
        <div className="grid grid-cols-[repeat(auto-fill,96px)] gap-3">
          {value.map((item) => {
            const url = getFileUrl(item.id, item.extension);
            const label = `${item.name}${item.extension}`;

            return isImage(item.extension) ? (
              <div key={item.id} className="relative group w-24">
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/10">
                  <Image
                    src={url}
                    alt={label}
                    width={96}
                    height={96}
                    className="object-cover block"
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
                      className="!absolute -top-2 -right-2 !rounded-full !w-6 !h-6 !min-w-0 !p-0 opacity-0 group-hover:opacity-100 transition-opacity !bg-[var(--darker)]"
                    />
                  </Tooltip>
                )}

                <Tooltip title={label}>
                  <p className="text-center truncate mt-1 text-[11px] text-[var(--text-muted)] w-24">
                    {label}
                  </p>
                </Tooltip>
              </div>
            ) : (
              <div key={item.id} className="relative group w-24">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-24 h-24 rounded-lg border border-white/10 bg-white/[0.03] flex flex-col items-center justify-center gap-1 no-underline"
                >
                  <FileTypeIcon extension={item.extension} />
                  <span className="text-[10px] text-[var(--text-muted)] bg-white/[0.08] rounded-[3px] px-1 py-px uppercase tracking-[0.05em]">
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
                      className="!absolute -top-2 -right-2 !rounded-full !w-6 !h-6 !min-w-0 !p-0 opacity-0 group-hover:opacity-100 transition-opacity !bg-[var(--darker)]"
                    />
                  </Tooltip>
                )}

                <Tooltip title={label}>
                  <p className="text-center truncate mt-1 text-[11px] text-[var(--text-muted)] w-24">
                    {label}
                  </p>
                </Tooltip>
              </div>
            );
          })}

          {pending.map(({ tempId, name }) => (
            <Tooltip key={tempId} title={name}>
              <div className="w-24 h-24 rounded-lg border border-white/10 bg-white/[0.03] shrink-0 flex items-center justify-center">
                <Skeleton.Image active className="!w-20 !h-20" />
              </div>
            </Tooltip>
          ))}
        </div>
      )}

      {value.length === 0 && pending.length === 0 && readonly && (
        <span className="text-[var(--text-muted)] text-[13px]">No attachments</span>
      )}
    </div>
  );
}
