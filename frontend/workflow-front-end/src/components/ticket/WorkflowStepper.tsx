// WorkflowStepper.tsx — drop-in replacement for the stepper in TicketDetail.tsx
//
// Matches the prototype: numbered SQUARE nodes (number → ✓ when done),
// filled + glowing CURRENT node in the status color, full-width connectors
// that turn mint once passed, and status name + group beneath each node.
//
// Place at: src/components/ticket/WorkflowStepper.tsx
// Then in TicketDetail.tsx replace the inline stepper block with:
//     {ticket.workflow && (
//       <WorkflowStepper
//         statuses={ticket.workflow.statuses}
//         currentStatusId={ticket.status.id}
//         isDone={ticket.status.group === "DONE"}
//       />
//     )}

import { Alert } from "antd";

interface StepStatus {
  id: number | string;
  name: string;
  color: string;
  group: string;
}

interface Props {
  statuses: StepStatus[];
  currentStatusId: number | string;
  isDone?: boolean;
}

export default function WorkflowStepper({ statuses, currentStatusId, isDone }: Props) {
  const currentIndex = statuses.findIndex((s) => s.id === currentStatusId);

  return (
    <div className="relative border border-[var(--line)] bg-[var(--bg-1)] px-5 py-5">
      {/* corner brackets — the brand motif */}
      <span className="content-corner content-corner-tl" />
      <span className="content-corner content-corner-tr" />
      <span className="content-corner content-corner-bl" />
      <span className="content-corner content-corner-br" />

      <p className="font-bebas text-[11px] tracking-[.2em] text-[var(--acc-1)] mb-4">// WORKFLOW</p>

      <div className="flex items-start overflow-x-auto pb-1">
        {statuses.map((s, i) => {
          const done    = i < currentIndex;
          const current = i === currentIndex;
          const nodeColor = done ? "var(--acc-3)" : current ? s.color : "var(--fg-faint)";

          return (
            <div key={s.id} className="flex items-start flex-1 min-w-[78px]">
              {/* node + labels */}
              <div className="flex flex-col items-center gap-2" style={{ width: 78, flexShrink: 0 }}>
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 26,
                    height: 26,
                    border: `2px solid ${nodeColor}`,
                    background: current ? nodeColor : "transparent",
                    boxShadow: current
                      ? `0 0 calc(12px * var(--glow)) ${s.color}`
                      : "none",
                  }}
                >
                  {done ? (
                    <span style={{ color: "var(--acc-3)", fontSize: 13, lineHeight: 1 }}>✓</span>
                  ) : (
                    <span
                      className="font-bebas"
                      style={{ fontSize: 13, color: current ? "var(--bg-0)" : nodeColor, lineHeight: 1 }}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                <span
                  className="font-mono-tech text-[10px] tracking-[.04em] text-center whitespace-nowrap"
                  style={{ color: current ? s.color : "var(--fg-dim)" }}
                >
                  {s.name}
                </span>
                <span className="font-mono-tech text-[8px] tracking-[.1em] text-[var(--fg-faint)] whitespace-nowrap">
                  {s.group}
                </span>
              </div>

              {/* connector — spans the gap, lights up once passed */}
              {i < statuses.length - 1 && (
                <div
                  className="flex-1 min-w-[18px]"
                  style={{
                    height: 2,
                    marginTop: 12,
                    background: i < currentIndex ? "var(--acc-3)" : "var(--line-strong)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {isDone && (
        <Alert
          message={<span className="font-bebas tracking-wider">TICKET RESOLVED — FINAL STATUS REACHED</span>}
          type="success"
          showIcon
          className="!mt-4"
        />
      )}
    </div>
  );
}
