import { useEffect, useRef, useState } from "react";
import Hls, { type Level } from "hls.js";
import { Select } from "antd";

interface Props {
  videoId: string;
}

export default function VideoPlayer({ videoId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef   = useRef<Hls | null>(null);
  const [levels, setLevels]           = useState<Level[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const src = `${import.meta.env.VITE_API_BASE_URL}/media-service/v1/videos/${videoId}/master.m3u8`;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels);
        setCurrentLevel(-1);
      });
      return () => {
        hls.destroy();
        hlsRef.current = null;
        setLevels([]);
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }
  }, [videoId]);

  const handleQualityChange = (value: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = value;
    setCurrentLevel(value);
  };

  return (
    <div className="my-2">
      <video
        ref={videoRef}
        controls
        className="w-full rounded bg-black max-h-[400px]"
      />
      {levels.length > 1 && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500">Quality:</span>
          <Select
            size="small"
            value={currentLevel}
            onChange={handleQualityChange}
            options={[
              { label: "Auto", value: -1 },
              ...levels.map((l, i) => ({
                label: `${l.height}p`,
                value: i,
              })),
            ]}
          />
        </div>
      )}
    </div>
  );
}
