import { useRef, memo } from "react";
import { useState } from "react";
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import type { AnyExtension } from "@tiptap/core";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import { Button, Divider, Spin, Tooltip } from "antd";
import {
    BoldOutlined,
    ItalicOutlined,
    StrikethroughOutlined,
    UnorderedListOutlined,
    OrderedListOutlined,
    UndoOutlined,
    RedoOutlined,
    PaperClipOutlined,
    VideoCameraOutlined,
} from "@ant-design/icons";
import { uploadFile, getFileUrl, uploadVideo, fetchJobStatus, searchMentions } from "../api/ticketApi.ts";
import { VideoEmbed } from "./VideoEmbed.tsx";
import MentionList, { type MentionListHandle } from "./MentionList.tsx";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];

interface RichTextEditorProps {
    content?: string;
    editable?: boolean;
    onChange?: (html: string) => void;
    placeholder?: string;
}

function RichTextEditor({
    content = "",
    editable = true,
    onChange,
    placeholder = "Write something...",
}: RichTextEditorProps) {
    const fileInputRef  = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({ inline: false }),
            Placeholder.configure({ placeholder }),
            VideoEmbed,
            (Mention.configure({
                HTMLAttributes: { class: "mention" },
                suggestion: {
                    items: async ({ query }) => {
                        if (!query) return [];
                        return searchMentions(query).catch(() => []);
                    },
                    render() {
                        let component: ReactRenderer<MentionListHandle>;
                        let popup: TippyInstance[];
                        return {
                            onStart(props) {
                                component = new ReactRenderer(MentionList, {
                                    props,
                                    editor: props.editor,
                                });
                                popup = tippy("body", {
                                    getReferenceClientRect: props.clientRect as () => DOMRect,
                                    appendTo: () => document.body,
                                    content: component.element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: "manual",
                                    placement: "bottom-start",
                                });
                            },
                            onUpdate(props) {
                                component.updateProps(props);
                                popup[0]?.setProps({
                                    getReferenceClientRect: props.clientRect as () => DOMRect,
                                });
                            },
                            onKeyDown(props) {
                                if (props.event.key === "Escape") {
                                    popup[0]?.hide();
                                    return true;
                                }
                                return component.ref?.onKeyDown(props) ?? false;
                            },
                            onExit() {
                                popup[0]?.destroy();
                                component.destroy();
                            },
                        };
                    },
                },
            }) as AnyExtension),
        ],
        content,
        editable,
        onUpdate({ editor }) {
            onChange?.(editor.getHTML());
        },
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;
        e.target.value = "";

        setUploading(true);
        try {
            const uploaded = await uploadFile(file);
            const url = getFileUrl(uploaded.id, uploaded.extension);

            if (IMAGE_TYPES.includes(file.type)) {
                editor.chain().focus().setImage({ src: url, alt: uploaded.name }).run();
            } else {
                editor
                    .chain()
                    .focus()
                    .insertContent(`<a href="${url}" target="_blank">${uploaded.name}</a>`)
                    .run();
            }
        } finally {
            setUploading(false);
        }
    };

    const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;
        e.target.value = "";

        setUploadingVideo(true);
        try {
            let job = await uploadVideo(file);
            while (job.status !== "DONE" && job.status !== "FAILED") {
                await new Promise(resolve => setTimeout(resolve, 3000));
                job = await fetchJobStatus(job.jobId);
            }
            if (job.status === "FAILED") return;
            editor.chain().focus().insertContent({
                type: "videoEmbed",
                attrs: { videoId: job.videoId, fileName: file.name },
            }).run();
        } finally {
            setUploadingVideo(false);
        }
    };

    if (!editor) return null;

    return (
        <div className={`rich-text-editor border rounded ${editable ? "border-[var(--border-subtle)]" : "border-transparent"}`}>
            {editable && (
                <div className="flex flex-wrap items-center gap-1 px-2 py-1 border-b border-[var(--border-subtle)] bg-[var(--darker)] rounded-t">
                    <Button
                        size="small"
                        type={editor.isActive("bold") ? "primary" : "text"}
                        icon={<BoldOutlined />}
                        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
                    />
                    <Button
                        size="small"
                        type={editor.isActive("italic") ? "primary" : "text"}
                        icon={<ItalicOutlined />}
                        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
                    />
                    <Button
                        size="small"
                        type={editor.isActive("strike") ? "primary" : "text"}
                        icon={<StrikethroughOutlined />}
                        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run(); }}
                    />
                    <Divider type="vertical" className="!my-0 !mx-0.5" />
                    <Button
                        size="small"
                        type={editor.isActive("bulletList") ? "primary" : "text"}
                        icon={<UnorderedListOutlined />}
                        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
                    />
                    <Button
                        size="small"
                        type={editor.isActive("orderedList") ? "primary" : "text"}
                        icon={<OrderedListOutlined />}
                        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
                    />
                    <Divider type="vertical" className="!my-0 !mx-0.5" />
                    <Button
                        size="small"
                        type="text"
                        icon={<UndoOutlined />}
                        disabled={!editor.can().undo()}
                        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().undo().run(); }}
                    />
                    <Button
                        size="small"
                        type="text"
                        icon={<RedoOutlined />}
                        disabled={!editor.can().redo()}
                        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().redo().run(); }}
                    />
                    <Divider type="vertical" className="!my-0 !mx-0.5" />
                    <Tooltip title="Attach file or image">
                        <Button
                            size="small"
                            type="text"
                            icon={uploading ? <Spin size="small" /> : <PaperClipOutlined />}
                            disabled={uploading}
                            onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                        />
                    </Tooltip>
                    <Tooltip title="Attach video">
                        <Button
                            size="small"
                            type="text"
                            icon={uploadingVideo ? <Spin size="small" /> : <VideoCameraOutlined />}
                            disabled={uploadingVideo}
                            onMouseDown={(e) => { e.preventDefault(); videoInputRef.current?.click(); }}
                        />
                    </Tooltip>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="!hidden"
                        onChange={handleFileChange}
                    />
                    <input
                        ref={videoInputRef}
                        type="file"
                        accept={VIDEO_TYPES.join(",")}
                        className="!hidden"
                        onChange={handleVideoChange}
                    />
                </div>
            )}
            <EditorContent
                editor={editor}
                className="px-3 py-2 min-h-[120px] prose prose-sm max-w-none focus:outline-none"
            />
        </div>
    );
}

export default memo(RichTextEditor);
