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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-[18px]">
      <p className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-faint)] mb-3.5">Workflow</p>

      <div className="flex items-start overflow-x-auto pb-1">
        {statuses.map((s, i) => {
          const done    = i < currentIndex;
          const current = i === currentIndex;
          const nodeColor = done ? "var(--green)" : current ? s.color : "var(--border)";

          return (
            <div key={s.id} className="flex items-start flex-1 min-w-[78px]">
              <div className="flex flex-col items-center gap-[7px] w-[78px] shrink-0">
                <div
                  className="flex items-center justify-center flex-shrink-0 w-[26px] h-[26px] rounded-full"
                  style={dynamicStyle({
                    border: `2px solid ${nodeColor}`,
                    background: current ? s.color : "transparent",
                  })}
                >
                  {done ? (
                    <span className="text-[12px] font-bold leading-none" style={dynamicStyle({ color: "var(--green)" })}>✓</span>
                  ) : (
                    <span
                      className="text-[12px] font-bold leading-none"
                      style={dynamicStyle({ color: current ? "#fff" : nodeColor })}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                <span
                  className="text-[10.5px] font-semibold text-center whitespace-nowrap"
                  style={dynamicStyle({ color: current ? s.color : done ? "var(--text)" : "var(--text-faint)" })}
                >
                  {s.name}
                </span>
              </div>

              {i < statuses.length - 1 && (
                <div
                  className="flex-1 min-w-[16px] h-[2px] mt-[12px]"
                  style={dynamicStyle({ background: i < currentIndex ? "var(--green)" : "var(--border)" })}
                />
              )}
            </div>
          );
        })}
      </div>

      {isDone && (
        <Alert
          message="Ticket resolved — final status reached"
          type="success"
          showIcon
          className="!mt-4"
        />
      )}
    </div>
  );
}
