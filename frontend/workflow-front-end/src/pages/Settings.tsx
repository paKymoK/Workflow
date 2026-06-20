import { Tabs } from "antd";
import {
  ApartmentOutlined,
  ClockCircleOutlined,
  FlagOutlined,
  ProjectOutlined,
  TagOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useUrlState } from "@state";
import { useTheme } from "@takypok/shared";
import type { AccentScheme } from "@takypok/shared";
import WorkflowList from "../components/settings/WorkflowList";
import StatusList from "../components/settings/StatusList";
import PriorityList from "../components/settings/PriorityList";
import ProjectList from "../components/settings/ProjectList";
import IssueTypeList from "../components/settings/IssueTypeList";
import { useStatuses, useProjects, usePriorities, useAllIssueTypes } from "../hooks/useTickets";

const SCHEMES: { key: AccentScheme; label: string; color: string }[] = [
  { key: "ice",      label: "ICE",      color: "#00CFFF" },
  { key: "amber",    label: "AMBER",    color: "#FF9E3D" },
  { key: "phosphor", label: "PHOSPHOR", color: "#3DF58A" },
  { key: "magenta",  label: "MAGENTA",  color: "#FF3D9A" },
];

const SCHEME_ACTIVE_CLASSES: Record<string, string> = {
  ice:      "border-[#00CFFF] text-[#00CFFF] bg-[color-mix(in_oklab,#00CFFF_10%,transparent)] shadow-[0_0_12px_color-mix(in_oklab,#00CFFF_30%,transparent)]",
  amber:    "border-[#FF9E3D] text-[#FF9E3D] bg-[color-mix(in_oklab,#FF9E3D_10%,transparent)] shadow-[0_0_12px_color-mix(in_oklab,#FF9E3D_30%,transparent)]",
  phosphor: "border-[#3DF58A] text-[#3DF58A] bg-[color-mix(in_oklab,#3DF58A_10%,transparent)] shadow-[0_0_12px_color-mix(in_oklab,#3DF58A_30%,transparent)]",
  magenta:  "border-[#FF3D9A] text-[#FF3D9A] bg-[color-mix(in_oklab,#FF3D9A_10%,transparent)] shadow-[0_0_12px_color-mix(in_oklab,#FF3D9A_30%,transparent)]",
};

const SCHEME_SWATCH_CLASSES: Record<string, string> = {
  ice:      "bg-[#00CFFF]",
  amber:    "bg-[#FF9E3D]",
  phosphor: "bg-[#3DF58A]",
  magenta:  "bg-[#FF3D9A]",
};

const TABS_KEYS = ["workflow", "status", "priority", "project", "issue-type"] as const;
type TabKey = typeof TABS_KEYS[number];

const workflowTabs = [
  { key: "workflow",   label: "Workflow",   children: <WorkflowList /> },
  { key: "status",     label: "Status",     children: <StatusList /> },
  { key: "priority",   label: "Priority",   children: <PriorityList /> },
  { key: "project",    label: "Project",    children: <ProjectList /> },
  { key: "issue-type", label: "Issue Type", children: <IssueTypeList /> },
];

export default function Settings() {
  const [wfTab, setWfTab]               = useUrlState("wfTab", "workflow");
  const { accentScheme, setAccentScheme } = useTheme();

  const { data: statuses   = [] } = useStatuses();
  const { data: projects   = [] } = useProjects();
  const { data: priorities = [] } = usePriorities();
  const { data: issueTypes = [] } = useAllIssueTypes();

  const CARDS = [
    { key: "workflow",   icon: <ApartmentOutlined />, label: "WORKFLOWS",    desc: "Status graphs & transitions",  count: null },
    { key: "status",     icon: <ClockCircleOutlined />, label: "STATUSES",   desc: "Ticket lifecycle states",      count: statuses.length },
    { key: "priority",   icon: <FlagOutlined />,      label: "PRIORITIES",  desc: "SLA response & resolution",    count: priorities.length },
    { key: "project",    icon: <ProjectOutlined />,   label: "PROJECTS",    desc: "Project codes & names",        count: projects.length },
    { key: "issue-type", icon: <TagOutlined />,       label: "ISSUE TYPES", desc: "Ticket categories",            count: issueTypes.length },
    { key: "users",      icon: <TeamOutlined />,      label: "USERS & ROLES", desc: "Managed in auth service",    count: null },
  ];

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
                title={s.label}
                onClick={() => setAccentScheme(s.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono-tech text-[10px] tracking-wider transition-all cursor-crosshair ${active ? SCHEME_ACTIVE_CLASSES[s.key] : "border-[var(--line)] text-[var(--fg-faint)] bg-transparent"}`}
              >
                <span className={`w-2 h-2 inline-block shrink-0 ${SCHEME_SWATCH_CLASSES[s.key]}`} />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Config card grid */}
      <div className="grid grid-cols-3 gap-3">
        {CARDS.map((card) => {
          const isTab = (TABS_KEYS as readonly string[]).includes(card.key);
          return (
            <button
              key={card.key}
              disabled={!isTab}
              onClick={() => { if (isTab) setWfTab(card.key as TabKey); }}
              className="text-left p-4 border border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--acc-1)] hover:bg-[var(--bg-2)] transition-all cursor-crosshair group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-[var(--acc-1)] text-lg">{card.icon}</span>
                {card.count !== null && (
                  <span className="font-bebas text-2xl text-[var(--fg-dim)] leading-none">{card.count}</span>
                )}
              </div>
              <p className="font-bebas text-sm tracking-[.1em] text-[var(--fg)] m-0">{card.label}</p>
              <p className="font-mono-tech text-[10px] text-[var(--fg-faint)] m-0 mt-0.5">{card.desc}</p>
              {isTab && (
                <p className="font-bebas text-[10px] tracking-[.15em] text-[var(--acc-1)] m-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  MANAGE →
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Management tabs */}
      <Tabs activeKey={wfTab} onChange={setWfTab} items={workflowTabs} />
    </div>
  );
}
