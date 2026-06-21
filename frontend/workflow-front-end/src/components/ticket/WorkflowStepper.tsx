import { Alert } from "antd";
import { dynamicStyle } from "../../utils/dynamicStyle";

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
              <div className="flex flex-col items-center gap-2 w-[78px] shrink-0">
                <div
                  className="flex items-center justify-center flex-shrink-0 w-[26px] h-[26px]"
                  style={dynamicStyle({
                    border: `2px solid ${nodeColor}`,
                    background: current ? nodeColor : "transparent",
                    boxShadow: current ? `0 0 calc(12px * var(--glow)) ${s.color}` : "none",
                  })}
                >
                  {done ? (
                    <span className="text-[13px] leading-none" style={dynamicStyle({ color: "var(--acc-3)" })}>✓</span>
                  ) : (
                    <span
                      className="font-bebas text-[13px] leading-none"
                      style={dynamicStyle({ color: current ? "var(--bg-0)" : nodeColor })}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                <span
                  className="font-mono-tech text-[10px] tracking-[.04em] text-center whitespace-nowrap"
                  style={dynamicStyle({ color: current ? s.color : "var(--fg-dim)" })}
                >
                  {s.name}
                </span>
                <span className="font-mono-tech text-[8px] tracking-[.1em] text-[var(--fg-faint)] whitespace-nowrap">
                  {s.group}
                </span>
              </div>

              {i < statuses.length - 1 && (
                <div
                  className="flex-1 min-w-[18px] h-[2px] mt-[12px]"
                  style={dynamicStyle({ background: i < currentIndex ? "var(--acc-3)" : "var(--line-strong)" })}
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
