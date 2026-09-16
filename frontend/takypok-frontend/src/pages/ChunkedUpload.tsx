import { useEffect, useState } from "react";
import { Upload, Progress, List, Typography, Tag, Input, Button, Checkbox, Popconfirm, message } from "antd";
import { InboxOutlined, FileDoneOutlined, DeleteOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import {
    getChunkedFileUrl,
    listChunkedFiles,
    deleteChunkedFile,
    deleteAllChunkedFiles,
    type ChunkedUploadedFile,
} from "../api/chunkedUploadApi";
import { uploadFileChunkedEncrypted, decryptPastedFile, type ChunkedUploadProgress } from "../lib/chunkedUpload";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

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
    const [encFilename, setEncFilename] = useState("");
    const [encText, setEncText] = useState("");
    const [encSubmitting, setEncSubmitting] = useState(false);
    const [selectedNames, setSelectedNames] = useState<string[]>([]);
    const [deleting, setDeleting] = useState(false);

    const refreshFiles = async () => {
        try {
            const result = await listChunkedFiles();
            setFiles(result);
            const stillPresent = new Set(result.map((file) => file.name));
            setSelectedNames((prev) => prev.filter((name) => stillPresent.has(name)));
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

    const uploadAndTrack = async (file: File) => {
        setInFlight((prev) => [
            ...prev,
            { name: file.name, progress: { sentChunks: 0, totalChunks: 1, percent: 0 } },
        ]);
        try {
            await uploadFileChunkedEncrypted(file, (progress) => {
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
    };

    const draggerProps: UploadProps = {
        name: "file",
        multiple: true,
        showUploadList: false,
        beforeUpload: async (file) => {
            await uploadAndTrack(file);
            return false;
        },
    };

    const submitEncrypted = async () => {
        if (!encFilename.trim()) {
            message.error("Enter a filename (with extension)");
            return;
        }
        if (!encText.trim()) {
            message.error("Paste the encrypted text from encrypt-file.bat");
            return;
        }

        let file: File;
        try {
            const bytes = await decryptPastedFile(encText);
            file = new File([bytes], encFilename.trim());
        } catch (err) {
            console.error(err);
            message.error("Couldn't decrypt that text — make sure it's unedited output from encrypt-file.bat");
            return;
        }

        setEncSubmitting(true);
        try {
            await uploadAndTrack(file);
            setEncFilename("");
            setEncText("");
        } finally {
            setEncSubmitting(false);
        }
    };

    const toggleSelected = (name: string, checked: boolean) => {
        setSelectedNames((prev) => (checked ? [...prev, name] : prev.filter((n) => n !== name)));
    };

    const deleteOne = async (name: string) => {
        setDeleting(true);
        try {
            await deleteChunkedFile(name);
            await refreshFiles();
        } catch (err) {
            console.error(err);
            message.error("Failed to delete file");
        } finally {
            setDeleting(false);
        }
    };

    const deleteSelected = async () => {
        setDeleting(true);
        try {
            await Promise.all(selectedNames.map((name) => deleteChunkedFile(name)));
            await refreshFiles();
        } catch (err) {
            console.error(err);
            message.error("Failed to delete some of the selected files");
        } finally {
            setDeleting(false);
        }
    };

    const deleteAll = async () => {
        setDeleting(true);
        try {
            await deleteAllChunkedFiles();
            setSelectedNames([]);
            await refreshFiles();
        } catch (err) {
            console.error(err);
            message.error("Failed to clear files");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 max-w-2xl mx-auto p-4">
            <div>
                <Title level={4} className="!mb-1">Chunked Upload</Title>
                <Paragraph className="!mb-0 text-[var(--text-muted)]">
                    Splits large files into 8KB pieces and uploads them with bounded concurrency and
                    per-chunk retry — useful for large attachments over unreliable connections. Each
                    chunk is AES-GCM encrypted in the browser before it's sent, so networks that block
                    uploads by inspecting file signatures (e.g. the ZIP header on .xlsx/.docx) shouldn't
                    interfere. Files are stored in the server's <code>uploads/files</code> folder.
                </Paragraph>
            </div>

            <Upload.Dragger {...draggerProps} className="!rounded-lg">
                <p className="ant-upload-drag-icon">
                    <InboxOutlined className="text-[32px]" />
                </p>
                <p className="ant-upload-text !text-sm !m-0">Click or drag a file here to upload</p>
                <p className="ant-upload-hint !text-[11px]">Any file type; large files are chunked automatically</p>
            </Upload.Dragger>

            <div className="flex flex-col gap-2 rounded-lg border border-[var(--border)] p-3">
                <Text strong className="text-[13px]">Upload from encrypted text</Text>
                <Text className="text-[12px] text-[var(--text-muted)]">
                    Run <code>scripts\encrypt-file\encrypt-file.bat your-file.xlsx</code> and paste the
                    contents of the <code>.b64.txt</code> it produces below — the browser decrypts it
                    with the same key and uploads it normally. Useful when a network blocks the file
                    itself before it ever reaches this page.
                </Text>
                <Input
                    placeholder="Filename with extension, e.g. report.xlsx"
                    value={encFilename}
                    onChange={(e) => setEncFilename(e.target.value)}
                />
                <TextArea
                    placeholder="Paste the contents of the .b64.txt file here"
                    rows={6}
                    value={encText}
                    onChange={(e) => setEncText(e.target.value)}
                />
                <Button type="primary" onClick={submitEncrypted} loading={encSubmitting} className="self-end">
                    Upload
                </Button>
            </div>

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
                header={
                    <div className="flex items-center justify-between gap-2">
                        <Text strong>Files in storage</Text>
                        <div className="flex items-center gap-2">
                            {selectedNames.length > 0 && (
                                <Popconfirm
                                    title={`Delete ${selectedNames.length} selected file(s)?`}
                                    onConfirm={deleteSelected}
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button size="small" danger loading={deleting}>
                                        Delete selected ({selectedNames.length})
                                    </Button>
                                </Popconfirm>
                            )}
                            {files.length > 0 && (
                                <Popconfirm
                                    title="Delete every file in storage?"
                                    description="This can't be undone."
                                    onConfirm={deleteAll}
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button size="small" danger loading={deleting}>
                                        Clear all
                                    </Button>
                                </Popconfirm>
                            )}
                        </div>
                    </div>
                }
                bordered
                loading={loadingFiles}
                dataSource={files}
                locale={{ emptyText: "No files uploaded yet" }}
                renderItem={(item) => (
                    <List.Item>
                        <div className="flex items-center gap-2 w-full">
                            <Checkbox
                                checked={selectedNames.includes(item.name)}
                                onChange={(e) => toggleSelected(item.name, e.target.checked)}
                            />
                            <FileDoneOutlined className="text-green-500" />
                            <a
                                href={getChunkedFileUrl(item.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 truncate"
                            >
                                {item.originalName}
                            </a>
                            <Text className="text-[12px] text-[var(--text-muted)]">
                                {formatSize(item.sizeBytes)}
                            </Text>
                            <Tag>{(item.originalName.split(".").pop() ?? "").toUpperCase()}</Tag>
                            <Popconfirm title="Delete this file?" onConfirm={() => deleteOne(item.name)}>
                                <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </div>
                    </List.Item>
                )}
            />
        </div>
    );
}
