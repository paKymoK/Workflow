import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";

function VideoEmbedNodeView({ node }: ReactNodeViewProps) {
  const fileName = node.attrs.fileName as string | null;
  return (
    <NodeViewWrapper>
      <div className="flex items-center gap-2 px-3 py-2 my-1 rounded border border-gray-300 bg-gray-50 select-none text-sm text-gray-600">
        🎬 {fileName || "Video"} — ready
      </div>
    </NodeViewWrapper>
  );
}

export const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      videoId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-video-id"),
        renderHTML: (attrs) => ({ "data-video-id": attrs.videoId }),
      },
      fileName: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-file-name"),
        renderHTML: (attrs) => ({ "data-file-name": attrs.fileName }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="video-embed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-type": "video-embed" }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoEmbedNodeView);
  },
});
