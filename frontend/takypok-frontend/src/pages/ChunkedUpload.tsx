import { useEffect, useState } from "react";
import { Upload, Progress, List, Typography, Tag, Switch, message } from "antd";
import { InboxOutlined, FileDoneOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { getChunkedFileUrl, listChunkedFiles, type ChunkedUploadedFile } from "../api/chunkedUploadApi";
import { uploadFileChunked, uploadFileChunkedBase64, type ChunkedUploadProgress } from "../lib/chunkedUpload";

const { Title, Text, Paragraph } = Typography;

interface InFlightUpload {
    name: string;
    progress: ChunkedUploadProgress;
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Standalone screen for the chunked-upload flow: a file is split into fixed-size pieces and
 * sent with bounded concurrency and per-chunk retry. Intentionally separate from the ticket
 * attachment flow (AttachmentUpload.tsx / ticketApi.ts#uploadFile), which is unaffected by this.
 */
export default function ChunkedUpload() {
    const [inFlight, setInFlight] = useState<InFlightUpload[]>([]);
    const [files, setFiles] = useState<ChunkedUploadedFile[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [useBase64, setUseBase64] = useState(false);

    const refreshFiles = async () => {
        try {
            setFiles(await listChunkedFiles());
        } catch (err) {
            console.error(err);
            message.error("Failed to load uploaded files");
        } finally {
            setLoadingFiles(false);
        }
    };

    useEffect(() => {
        refreshFiles();
    }, []);

    const draggerProps: UploadProps = {
        name: "file",
        multiple: true,
        showUploadList: false,
        beforeUpload: async (file) => {
            setInFlight((prev) => [
                ...prev,
                { name: file.name, progress: { sentChunks: 0, totalChunks: 1, percent: 0 } },
            ]);
            try {
                const upload = useBase64 ? uploadFileChunkedBase64 : uploadFileChunked;
                await upload(file, (progress) => {
                    setInFlight((prev) =>
                        prev.map((entry) => (entry.name === file.name ? { ...entry, progress } : entry)),
                    );
                });
                await refreshFiles();
            } catch (err) {
                console.error(err);
                message.error(`Failed to upload ${file.name}`);
            } finally {
                setInFlight((prev) => prev.filter((entry) => entry.name !== file.name));
            }
            return false;
        },
    };

    return (
        <div className="flex flex-col gap-4 max-w-2xl mx-auto p-4">
            <div>
                <Title level={4} className="!mb-1">Chunked Upload</Title>
                <Paragraph className="!mb-0 text-[var(--text-muted)]">
                    Splits large files into 8KB pieces and uploads them with bounded concurrency and
                    per-chunk retry — useful for large attachments over unreliable connections. Files are
                    stored in the server's <code>uploads/files</code> folder.
                </Paragraph>
            </div>

            <div className="flex items-center gap-2">
                <Switch size="small" checked={useBase64} onChange={setUseBase64} />
                <Text className="text-[13px]">
                    Encode chunks as base64 (use on networks that block raw binary uploads)
                </Text>
            </div>

            <Upload.Dragger {...draggerProps} className="!rounded-lg">
                <p className="ant-upload-drag-icon">
                    <InboxOutlined className="text-[32px]" />
                </p>
                <p className="ant-upload-text !text-sm !m-0">Click or drag a file here to upload</p>
                <p className="ant-upload-hint !text-[11px]">Any file type; large files are chunked automatically</p>
            </Upload.Dragger>

            {inFlight.length > 0 && (
                <div className="flex flex-col gap-3">
                    {inFlight.map((entry) => (
                        <div key={entry.name} className="flex flex-col gap-1">
                            <Text className="text-[13px] truncate">{entry.name}</Text>
                            <Progress percent={entry.progress.percent} size="small" />
                        </div>
                    ))}
                </div>
            )}

            <List
                header={<Text strong>Files in storage</Text>}
                bordered
                loading={loadingFiles}
                dataSource={files}
                locale={{ emptyText: "No files uploaded yet" }}
                renderItem={(item) => (
                    <List.Item>
                        <div className="flex items-center gap-2 w-full">
                            <FileDoneOutlined className="text-green-500" />
                            <a
                                href={getChunkedFileUrl(item.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 truncate"
                            >
                                {item.name}
                            </a>
                            <Text className="text-[12px] text-[var(--text-muted)]">
                                {formatSize(item.sizeBytes)}
                            </Text>
                            <Tag>{(item.name.split(".").pop() ?? "").toUpperCase()}</Tag>
                        </div>
                    </List.Item>
                )}
            />
        </div>
    );
}
