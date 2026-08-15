// Panel.tsx — reusable card matching the Workflow redesign's panels
// (surface bg, soft border, rounded corners, small uppercase title row).
//
// Place at: src/components/ui/Panel.tsx
// Use it to wrap the Description / Comments / Details / SLA blocks, e.g.:
//     <Panel title="Description" icon={<FileTextOutlined />}>
//       <CommentContent html={ticket.detail.description} />
//     </Panel>

import type { ReactNode } from "react";

interface PanelProps {
  title?: string;
  icon?: ReactNode;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export default function Panel({
  title,
  icon,
  right,
  className = "",
  bodyClassName = "p-4",
  children,
}: PanelProps) {
  return (
    <div className={`relative border border-[var(--border)] bg-[var(--surface)] rounded-xl overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-faint)]">
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
