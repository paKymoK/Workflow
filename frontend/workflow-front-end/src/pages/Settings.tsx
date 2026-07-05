import { useRef, useState } from "react";
import { useUrlState } from "@state";
import { useAuth, useTheme } from "@takypok/shared";
import { Avatar, Button, message as antMessage } from "antd";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import { Icon } from "../components/ui/Icon";
import type { IconName } from "../components/ui/Icon";
import WorkflowList from "../components/settings/WorkflowList";
import StatusList from "../components/settings/StatusList";
import PriorityList from "../components/settings/PriorityList";
import ProjectList from "../components/settings/ProjectList";
import IssueTypeList from "../components/settings/IssueTypeList";
import TeamOrg from "../components/settings/TeamOrg";
import { useStatuses, useProjects, usePriorities, useAllIssueTypes } from "../hooks/useTickets";
import { getFileUrl, updateMyAvatar, uploadFile } from "../api/ticketApi";
import { resizeImageForUpload } from "../utils/imageResize";

const TABS_KEYS = ["workflow", "status", "priority", "project", "issue-type", "team-org"] as const;
type TabKey = typeof TABS_KEYS[number];

interface CardDef {
  key: string;
  icon: IconName;
  label: string;
  desc: string;
}

const CARD_DEFS: CardDef[] = [
  { key: "workflow",   icon: "flow",   label: "Workflows",   desc: "Status graphs & transitions"   },
  { key: "status",     icon: "check",  label: "Statuses",    desc: "Ticket lifecycle states"       },
  { key: "priority",   icon: "bolt",   label: "Priorities",  desc: "SLA response & resolution"     },
  { key: "project",    icon: "pin",    label: "Projects",    desc: "Project codes & names"         },
  { key: "issue-type", icon: "filter", label: "Issue Types", desc: "Ticket categories"              },
  { key: "team-org",   icon: "user",   label: "Team Org",    desc: "Application support structure" },
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
  const [activeKey, setActiveKey] = useUrlState("wfTab", "workflow");
  const { isDark, toggleTheme }   = useTheme();
  const { user } = useAuth();

  const { data: statuses   = [] } = useStatuses();
  const { data: projects   = [] } = useProjects();
  const { data: priorities = [] } = usePriorities();
  const { data: issueTypes = [] } = useAllIssueTypes();

  const mySub = user?.sub as string | undefined;
  // Profile fields live under the JWT's custom "info" claim, not top-level — see
  // CustomOAuth2TokenCustomizer on the auth-service side.
  const info = user?.info as { avatar?: string | null } | undefined;
  // undefined = "use whatever the current session's token says"; once we upload, we override
  // locally since the token itself won't reflect the change until it's next refreshed.
  const [avatarOverride, setAvatarOverride] = useState<string | null | undefined>(undefined);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = avatarOverride !== undefined ? avatarOverride : (info?.avatar ?? null);

  async function handleAvatarChange(files: FileList | null) {
    const file = files?.[0];
    if (!file || !mySub) return;
    setAvatarUploading(true);
    try {
      const resized = await resizeImageForUpload(file);
      const uploaded = await uploadFile(resized);
      const url = getFileUrl(uploaded.id, uploaded.extension);
      await updateMyAvatar(mySub, url);
      setAvatarOverride(url);
      antMessage.success("Avatar updated");
    } catch {
      antMessage.error("Failed to update avatar");
    } finally {
      setAvatarUploading(false);
    }
  }

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
    <div className="flex flex-col gap-3.5">
      {/* Header */}
      <div className="text-xl font-bold text-[var(--text)]">Settings</div>

      {/* Profile */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-faint)] mb-3">Profile</p>
        <div className="flex items-center gap-4">
          <Avatar size={56} src={avatarUrl ?? undefined} icon={!avatarUrl ? <UserOutlined /> : undefined} className="!bg-[var(--purple)]" />
          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] text-[var(--text-dim)]">Avatar</span>
            <input
              ref={avatarFileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                handleAvatarChange(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              size="small"
              icon={<UploadOutlined />}
              loading={avatarUploading}
              onClick={() => avatarFileInputRef.current?.click()}
            >
              Change Avatar
            </Button>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-faint)] mb-3">Appearance</p>
        <div className="flex items-center gap-2.5">
          <span className="text-[12.5px] text-[var(--text-dim)]">Theme:</span>
          <button
            onClick={() => { if (isDark) toggleTheme(); }}
            className={`flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
              !isDark ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] text-[var(--text-dim)] bg-transparent"
            }`}
          >
            ☀ Light
          </button>
          <button
            onClick={() => { if (!isDark) toggleTheme(); }}
            className={`flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
              isDark ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] text-[var(--text-dim)] bg-transparent"
            }`}
          >
            ☾ Dark
          </button>
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
              className={`relative text-left p-[15px] rounded-xl border transition-all overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed group ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] cursor-default"
                  : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)] cursor-pointer"
              }`}
            >
              {/* Left accent bar on active */}
              {isActive && (
                <div className="absolute top-0 left-0 w-[3px] h-full bg-[var(--accent)]" />
              )}

              <div className="flex items-start justify-between">
                <Icon
                  name={card.icon}
                  size={20}
                  stroke={1.8}
                  className={`transition-colors ${isActive ? "text-[var(--accent)]" : "text-[var(--text-dim)]"}`}
                />
                {count !== null && (
                  <span className={`text-xl font-bold leading-none transition-colors ${isActive ? "text-[var(--accent)]" : "text-[var(--text-dim)]"}`}>
                    {count}
                  </span>
                )}
              </div>

              <p className="text-[13.5px] font-bold m-0 mt-2 text-[var(--text)]">
                {card.label}
              </p>
              <p className="text-[11px] text-[var(--text-faint)] m-0 mt-0.5">
                {card.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Content panel */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--hover)]">
          <span className="text-[12.5px] font-bold text-[var(--text)]">
            {activeDef.label}
          </span>
        </div>
        <div className="p-4">
          <SectionContent tabKey={activeKey} />
        </div>
      </div>
    </div>
  );
}
