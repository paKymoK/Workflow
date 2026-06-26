import { useUrlState } from "@state";
import { useTheme } from "@takypok/shared";
import type { AccentScheme } from "@takypok/shared";
import { Icon } from "../components/ui/Icon";
import type { IconName } from "../components/ui/Icon";
import WorkflowList from "../components/settings/WorkflowList";
import StatusList from "../components/settings/StatusList";
import PriorityList from "../components/settings/PriorityList";
import ProjectList from "../components/settings/ProjectList";
import IssueTypeList from "../components/settings/IssueTypeList";
import TeamOrg from "../components/settings/TeamOrg";
import { useStatuses, useProjects, usePriorities, useAllIssueTypes } from "../hooks/useTickets";

const SCHEMES: { key: AccentScheme; label: string }[] = [
  { key: "ice",      label: "ICE"      },
  { key: "amber",    label: "AMBER"    },
  { key: "phosphor", label: "PHOSPHOR" },
  { key: "magenta",  label: "MAGENTA"  },
];

const SCHEME_ACTIVE: Record<string, string> = {
  ice:      "border-[#00CFFF] text-[#00CFFF] bg-[color-mix(in_oklab,#00CFFF_10%,transparent)] shadow-[0_0_12px_color-mix(in_oklab,#00CFFF_30%,transparent)]",
  amber:    "border-[#FF9E3D] text-[#FF9E3D] bg-[color-mix(in_oklab,#FF9E3D_10%,transparent)] shadow-[0_0_12px_color-mix(in_oklab,#FF9E3D_30%,transparent)]",
  phosphor: "border-[#3DF58A] text-[#3DF58A] bg-[color-mix(in_oklab,#3DF58A_10%,transparent)] shadow-[0_0_12px_color-mix(in_oklab,#3DF58A_30%,transparent)]",
  magenta:  "border-[#FF3D9A] text-[#FF3D9A] bg-[color-mix(in_oklab,#FF3D9A_10%,transparent)] shadow-[0_0_12px_color-mix(in_oklab,#FF3D9A_30%,transparent)]",
};

const SCHEME_SWATCH: Record<string, string> = {
  ice:      "bg-[#00CFFF]",
  amber:    "bg-[#FF9E3D]",
  phosphor: "bg-[#3DF58A]",
  magenta:  "bg-[#FF3D9A]",
};

const TABS_KEYS = ["workflow", "status", "priority", "project", "issue-type", "team-org"] as const;
type TabKey = typeof TABS_KEYS[number];

interface CardDef {
  key: string;
  icon: IconName;
  label: string;
  desc: string;
}

const CARD_DEFS: CardDef[] = [
  { key: "workflow",   icon: "flow",   label: "WORKFLOWS",     desc: "Status graphs & transitions" },
  { key: "status",     icon: "check",  label: "STATUSES",      desc: "Ticket lifecycle states"     },
  { key: "priority",   icon: "bolt",   label: "PRIORITIES",    desc: "SLA response & resolution"   },
  { key: "project",    icon: "pin",    label: "PROJECTS",      desc: "Project codes & names"       },
  { key: "issue-type", icon: "filter", label: "ISSUE TYPES",   desc: "Ticket categories"           },
  { key: "team-org",   icon: "user",   label: "TEAM ORG",      desc: "Application support structure" },
];

function SectionContent({ tabKey }: { tabKey: string }) {
  switch (tabKey) {
    case "workflow":   return <WorkflowList />;
    case "status":     return <StatusList />;
    case "priority":   return <PriorityList />;
    case "project":    return <ProjectList />;
    case "issue-type": return <IssueTypeList />;
    case "team-org":   return <TeamOrg />;
    default:           return null;
  }
}

export default function Settings() {
  const [activeKey, setActiveKey]          = useUrlState("wfTab", "workflow");
  const { accentScheme, setAccentScheme }  = useTheme();

  const { data: statuses   = [] } = useStatuses();
  const { data: projects   = [] } = useProjects();
  const { data: priorities = [] } = usePriorities();
  const { data: issueTypes = [] } = useAllIssueTypes();

  const counts: Record<string, number | null> = {
    workflow:     null,
    status:       statuses.length,
    priority:     priorities.length,
    project:      projects.length,
    "issue-type": issueTypes.length,
    "team-org":   null,
  };

  const activeDef = CARD_DEFS.find((c) => c.key === activeKey)!;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="font-bebas text-3xl tracking-[0.15em] neon-text-acc m-0">▸ SETTINGS</h2>
        <span className="font-mono-tech text-xs text-[var(--fg-faint)] tracking-widest">// SYSTEM CONFIG</span>
      </div>

      {/* Appearance */}
      <div className="border border-[var(--line)] bg-[var(--bg-1)] p-4">
        <p className="font-bebas text-[11px] tracking-[.2em] text-[var(--acc-1)] mb-3">// APPEARANCE</p>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono-tech text-[11px] text-[var(--fg-dim)]">Accent scheme:</span>
          {SCHEMES.map((s) => {
            const active = accentScheme === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setAccentScheme(s.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono-tech text-[10px] tracking-wider transition-all cursor-crosshair ${
                  active ? SCHEME_ACTIVE[s.key] : "border-[var(--line)] text-[var(--fg-faint)] bg-transparent hover:border-[var(--line-strong)]"
                }`}
              >
                <span className={`w-2 h-2 inline-block shrink-0 ${SCHEME_SWATCH[s.key]}`} />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Config card grid */}
      <div className="grid grid-cols-3 gap-3">
        {CARD_DEFS.map((card) => {
          const isTab    = (TABS_KEYS as readonly string[]).includes(card.key);
          const isActive = card.key === activeKey;
          const count    = counts[card.key];

          return (
            <button
              key={card.key}
              disabled={!isTab}
              onClick={() => { if (isTab) setActiveKey(card.key as TabKey); }}
              className={`relative text-left p-4 border bg-[var(--bg-1)] transition-all overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed group ${
                isActive
                  ? "border-[var(--acc-1)] bg-[var(--bg-2)] cursor-default"
                  : "border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-[var(--bg-2)] cursor-crosshair"
              }`}
            >
              {/* Left accent bar on active */}
              {isActive && (
                <div className="absolute top-0 left-0 w-[3px] h-full bg-[var(--acc-1)] [box-shadow:2px_0_10px_var(--acc-1)]" />
              )}

              <div className="flex items-start justify-between mb-2">
                <Icon
                  name={card.icon}
                  size={18}
                  className={`transition-colors ${isActive ? "text-[var(--acc-1)]" : "text-[var(--fg-dim)] group-hover:text-[var(--fg)] group-disabled:group-hover:text-[var(--fg-dim)]"}`}
                />
                {count !== null && (
                  <span className={`font-bebas text-2xl leading-none transition-colors ${isActive ? "text-[var(--acc-1)]" : "text-[var(--fg-dim)]"}`}>
                    {count}
                  </span>
                )}
              </div>

              <p className={`font-bebas text-sm tracking-[.1em] m-0 transition-colors ${isActive ? "text-[var(--acc-1)]" : "text-[var(--fg)]"}`}>
                {card.label}
              </p>
              <p className="font-mono-tech text-[10px] text-[var(--fg-faint)] m-0 mt-0.5">
                {card.desc}
              </p>

              <p className={`font-bebas text-[10px] tracking-[.15em] m-0 mt-2 transition-all ${
                isActive
                  ? "text-[var(--acc-1)] opacity-50"
                  : "text-[var(--acc-1)] opacity-0 group-hover:opacity-100"
              }`}>
                {isActive ? "▌ SELECTED" : isTab ? "MANAGE →" : ""}
              </p>
            </button>
          );
        })}
      </div>

      {/* Content panel */}
      <div className="border border-[var(--acc-1)] bg-[var(--bg-1)] [border-top:2px_solid_var(--acc-1)]">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--line)] bg-[var(--bg-2)]">
          <Icon name={activeDef.icon} size={13} className="text-[var(--acc-1)]" />
          <span className="font-bebas text-[11px] tracking-[.2em] text-[var(--acc-1)]">
            // {activeDef.label}
          </span>
          <span className="font-mono-tech text-[9px] text-[var(--fg-faint)] ml-1">
            {activeDef.desc}
          </span>
        </div>
        <div className="p-4">
          <SectionContent tabKey={activeKey} />
        </div>
      </div>
    </div>
  );
}
