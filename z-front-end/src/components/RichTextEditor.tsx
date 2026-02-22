import { useRef, useState, memo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
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
} from "@ant-design/icons";
import { uploadFile, getFileUrl } from "../api/ticketApi.ts";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({ inline: false }),
            Placeholder.configure({ placeholder }),
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

    if (!editor) return null;

    return (
        <div className={`rich-text-editor border rounded ${editable ? "border-gray-300" : "border-transparent"}`}>
            {editable && (
                <div className="flex flex-wrap items-center gap-1 px-2 py-1 border-b border-gray-200 bg-gray-50 rounded-t">
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
                    <Divider type="vertical" style={{ margin: "0 2px" }} />
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
                    <Divider type="vertical" style={{ margin: "0 2px" }} />
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
                    <Divider type="vertical" style={{ margin: "0 2px" }} />
                    <Tooltip title="Attach file or image">
                        <Button
                            size="small"
                            type="text"
                            icon={uploading ? <Spin size="small" /> : <PaperClipOutlined />}
                            disabled={uploading}
                            onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                        />
                    </Tooltip>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
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
