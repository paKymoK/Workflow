import DOMPurify from "dompurify";

// Chat pushes content live to every participant automatically (no click needed, unlike a
// ticket comment you choose to open) — so unlike CommentContent, this sanitizes before
// rendering. Message content is HTML from RichTextEditor, but nothing stops a client from
// hitting the send-message endpoint directly with an arbitrary payload.
export default function MessageContent({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html);
  return (
    <div
      className="prose prose-sm max-w-none [&_*]:!text-inherit [&_p]:!m-0"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
