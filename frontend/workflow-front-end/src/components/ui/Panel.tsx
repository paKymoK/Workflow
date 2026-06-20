// Panel.tsx — reusable bracketed panel matching the prototype's panels.
//
// The prototype wraps content in a panel with a header row (Bebas title +
// optional right slot) and decorative corner brackets. Your current screens use
// bare `<div className="border border-[var(--line)] bg-[var(--bg-1)] p-4">`,
// which is why panels read flatter than the mock.
//
// Place at: src/components/ui/Panel.tsx
// Use it to wrap the Description / Comments / Details / SLA blocks, e.g.:
//     <Panel title="DESCRIPTION" icon={<FileTextOutlined />}>
//       <CommentContent html={ticket.detail.description} />
//     </Panel>

import type { ReactNode } from "react";

interface PanelProps {
  title?: string;
  icon?: ReactNode;
  right?: ReactNode;
  brackets?: boolean;   // show corner brackets (default true)
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export default function Panel({
  title,
  icon,
  right,
  brackets = true,
  className = "",
  bodyClassName = "p-4",
  children,
}: PanelProps) {
  return (
    <div className={`relative border border-[var(--line)] bg-[var(--bg-1)] ${className}`}>
      {brackets && (
        <>
          <span className="content-corner content-corner-tl" />
          <span className="content-corner content-corner-tr" />
          <span className="content-corner content-corner-bl" />
          <span className="content-corner content-corner-br" />
        </>
      )}

      {title && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)]">
          <span className="flex items-center gap-2 font-bebas text-[15px] tracking-[.14em] text-[var(--acc-1)]">
            {icon}
            {title}
          </span>
          {right}
        </div>
      )}

      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
