import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Button, Divider } from "antd";
import {
    BoldOutlined,
    ItalicOutlined,
    StrikethroughOutlined,
    UnorderedListOutlined,
    OrderedListOutlined,
    UndoOutlined,
    RedoOutlined,
} from "@ant-design/icons";

interface RichTextEditorProps {
    content?: string;
    editable?: boolean;
    onChange?: (html: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({
    content = "",
    editable = true,
    onChange,
    placeholder = "Write something...",
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder }),
        ],
        content,
        editable,
        onUpdate({ editor }) {
            onChange?.(editor.getHTML());
        },
    });

    if (!editor) return null;

    return (
        <div className={`rich-text-editor border rounded ${editable ? "border-gray-300" : "border-transparent"}`}>
            {editable && (
                <>
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
                    </div>
                </>
            )}
            <EditorContent
                editor={editor}
                className="px-3 py-2 min-h-[120px] prose prose-sm max-w-none focus:outline-none"
            />
        </div>
    );
}
