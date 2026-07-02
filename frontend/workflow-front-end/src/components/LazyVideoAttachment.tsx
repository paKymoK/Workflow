import { useState } from "react";
import { PlayCircleOutlined } from "@ant-design/icons";
import VideoPlayer from "./VideoPlayer";
import type { MessageAttachment } from "../api/types";

/**
 * A chat thread can show many video messages in one scrollback — mounting hls.js
 * (manifest + initial segment fetches) for every one on render would multiply that
 * cost for videos nobody is actually watching. Only mount VideoPlayer once clicked.
 */
export default function LazyVideoAttachment({ attachment }: { attachment: MessageAttachment }) {
  const [playing, setPlaying] = useState(false);

  if (attachment.status === "PROCESSING") {
    return (
      <div className="w-[220px] h-[120px] rounded border border-[var(--line)] bg-[var(--bg-2)] flex items-center justify-center">
        <span className="font-mono-tech text-[9px] text-[var(--fg-faint)]">
          Processing video...
        </span>
      </div>
    );
  }

  if (attachment.status === "FAILED") {
    return (
      <div className="w-[220px] h-[120px] rounded border border-[var(--line)] bg-[var(--bg-2)] flex items-center justify-center">
        <span className="font-mono-tech text-[9px] text-red-400">Video failed to process</span>
      </div>
    );
  }

  if (!playing) {
    return (
      <button
        onClick={() => setPlaying(true)}
        className="w-[220px] h-[120px] rounded border border-[var(--line)] bg-[var(--bg-2)] flex items-center justify-center cursor-pointer hover:bg-[var(--bg-0)] transition-colors"
      >
        <PlayCircleOutlined className="text-3xl text-[var(--acc-1)]" />
      </button>
    );
  }

  return <VideoPlayer videoId={attachment.mediaAssetId} />;
}
