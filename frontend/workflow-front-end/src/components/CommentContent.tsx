import VideoPlayer from "./VideoPlayer";

interface HtmlPart  { type: "html";  content: string }
interface VideoPart { type: "video"; videoId: string }
type Part = HtmlPart | VideoPart;

function parseContent(html: string): Part[] {
  const parts: Part[] = [];
  const regex = /<div[^>]+data-type="video-embed"[^>]*>\s*<\/div>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "html", content: html.slice(lastIndex, match.index) });
    }
    const tag = match[0];
    const videoId =
      tag.match(/data-video-id="([^"]*)"/)?.[1] ??
      tag.match(/\bvideoId="([^"]*)"/)?.[1] ??
      "";
    parts.push({ type: "video", videoId });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    parts.push({ type: "html", content: html.slice(lastIndex) });
  }

  return parts;
}

export default function CommentContent({ html }: { html: string }) {
  const parts = parseContent(html);
  return (
    <>
      {parts.map((part, i) =>
        part.type === "html" ? (
          <div
            key={i}
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: part.content }}
          />
        ) : (
          <VideoPlayer key={i} videoId={part.videoId} />
        )
      )}
    </>
  );
}
