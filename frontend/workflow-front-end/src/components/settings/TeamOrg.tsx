import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@takypok/shared";
import type { ResultMessage } from "../../api/types";
import { fetchAssigneeLoad } from "../../api/ticketApi";

// ─── Types ───────────────────────────────────────────────────────────────────

type AgentLevel  = "L1" | "L2" | "L3";
type AgentStatus = "ONLINE" | "BUSY" | "AWAY";

interface TeamUser {
  sub:        string;
  name:       string;
  email:      string;
  title:      string;
  department: string;
}

interface GroupMember {
  sub:   string;
  name:  string;
  email: string | null;
}

interface UserGroup {
  id:          string;
  name:        string;
  description: string;
  members:     GroupMember[];
}

interface Agent {
  sub:         string;
  initials:    string;
  name:        string;
  title:       string;
  level:       AgentLevel;
  status:      AgentStatus;
  openTickets: number;
  maxTickets:  number;
}

interface Stakeholder {
  sub:        string;
  initials:   string;
  name:       string;
  title:      string;
  department: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LEVEL_CFG = {
  L1: { color: "var(--accent)", label: "L1", title: "Frontline Support",   desc: "First response · triage · initial resolution", maxTickets: 8 },
  L2: { color: "var(--amber)",  label: "L2", title: "Specialist Support",  desc: "Advanced troubleshooting · complex incidents",  maxTickets: 5 },
  L3: { color: "var(--green)",  label: "L3", title: "Engineering Support", desc: "Root cause analysis · deep engineering fixes",  maxTickets: 3 },
} as const;

const STAKEHOLDER_COLOR = "var(--purple)";

const STATUS_COLOR: Record<AgentStatus, string> = {
  ONLINE: "var(--green)",
  BUSY:   "var(--red)",
  AWAY:   "var(--amber)",
};

function tint(color: string, pct: number) {
  return `color-mix(in oklab, ${color} ${pct}%, transparent)`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const GROUP_LEVEL: Record<string, AgentLevel | "STAKEHOLDER"> = {
  "grp-l1-support":      "L1",
  "grp-l2-support":      "L2",
  "grp-l3-support":      "L3",
  "grp-service-manager": "STAKEHOLDER",
};

function computeStatus(open: number, max: number): AgentStatus {
  if (open === 0)          return "AWAY";
  if (open / max >= 0.75)  return "BUSY";
  return "ONLINE";
}

function barColor(pct: number, level: AgentLevel): string {
  if (pct >= 80) return "var(--red)";
  if (pct >= 60) return "var(--amber)";
  return LEVEL_CFG[level].color;
}

function levelStats(agents: Agent[]) {
  const online = agents.filter((a) => a.status === "ONLINE").length;
  const busy   = agents.filter((a) => a.status === "BUSY").length;
  const away   = agents.filter((a) => a.status === "AWAY").length;
  const open   = agents.reduce((s, a) => s + a.openTickets, 0);
  const cap    = agents.reduce((s, a) => s + a.maxTickets,  0);
  const pct    = cap > 0 ? Math.round((open / cap) * 100) : 0;
  return { online, busy, away, open, pct };
}

// ─── Agent Card ──────────────────────────────────────────────────────────────

function AgentCard({ agent }: { agent: Agent }) {
  const cfg   = LEVEL_CFG[agent.level];
  const pct   = agent.maxTickets > 0 ? Math.round((agent.openTickets / agent.maxTickets) * 100) : 0;
  const clr   = barColor(pct, agent.level);
  const stClr = STATUS_COLOR[agent.status];

  return (
    <div className="rounded-[10px] border border-[var(--border)] p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[9px] flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: tint(cfg.color, 16), color: cfg.color }}
          >
            {agent.initials}
          </div>
          <div>
            <div className="text-[12.5px] font-semibold text-[var(--text)] leading-tight">{agent.name}</div>
            <div className="text-[10.5px] text-[var(--text-faint)]">{agent.title}</div>
          </div>
        </div>
        <span className="text-[10px] font-semibold flex items-center gap-1 shrink-0 ml-2" style={{ color: stClr }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: stClr }} />
          {agent.status}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <span className="text-[11px] text-[var(--text-faint)]">
          {agent.openTickets}/{agent.maxTickets} tickets
        </span>
        <span className="text-lg font-bold leading-none" style={{ color: clr }}>
          {pct}%
        </span>
      </div>

      <div className="h-1 rounded-full bg-[var(--hover)] mt-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%`, background: clr }}
        />
      </div>
    </div>
  );
}

// ─── Stakeholder Card ────────────────────────────────────────────────────────

function StakeholderCard({ s }: { s: Stakeholder }) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] p-3">
      <div className="flex items-start gap-2.5">
        <div
          className="relative w-8 h-8 rounded-[9px] flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: tint(STAKEHOLDER_COLOR, 16), color: STAKEHOLDER_COLOR }}
        >
          {s.initials}
          <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--green)] border border-[var(--surface)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold text-[var(--text)] truncate">{s.name}</div>
          <div className="text-[10.5px] text-[var(--text-faint)] truncate leading-tight">{s.title}</div>
          <div
            className="mt-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold"
            style={{ background: STAKEHOLDER_COLOR, color: "#fff" }}
          >
            {s.department}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Escalation Topology Cards ───────────────────────────────────────────────

function TopologyCard({ level, agents }: { level: AgentLevel; agents: Agent[] }) {
  const cfg  = LEVEL_CFG[level];
  const stat = levelStats(agents);
  const clr  = stat.pct >= 80 ? "var(--red)" : stat.pct >= 60 ? "var(--amber)" : cfg.color;

  return (
    <div className="flex-1 rounded-xl p-3.5 min-w-0 border" style={{ borderColor: cfg.color }}>
      <div className="text-[26px] font-bold leading-none" style={{ color: cfg.color }}>
        {cfg.label}
      </div>
      <div className="text-[9.5px] font-semibold text-[var(--text-faint)] tracking-[.03em] mt-1 mb-2.5">
        {cfg.title}
      </div>

      <div className="flex items-end gap-3.5 mb-2">
        <div>
          <div className="text-base font-bold text-[var(--text)]">{agents.length}</div>
          <div className="text-[8.5px] text-[var(--text-faint)]">AGENTS</div>
        </div>
        <div>
          <div className="text-base font-bold text-[var(--text)]">{stat.open}</div>
          <div className="text-[8.5px] text-[var(--text-faint)]">OPEN</div>
        </div>
        <div>
          <div className="text-base font-bold" style={{ color: clr }}>{stat.pct}%</div>
          <div className="text-[8.5px] text-[var(--text-faint)]">LOAD</div>
        </div>
      </div>

      <div className="h-1 rounded-full bg-[var(--hover)] mb-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(stat.pct, 100)}%`, background: clr }} />
      </div>

      <div className="flex flex-wrap gap-2">
        {stat.online > 0 && (
          <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: "var(--green)" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--green)]" /> {stat.online} online
          </span>
        )}
        {stat.busy > 0 && (
          <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: "var(--red)" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--red)]" /> {stat.busy} busy
          </span>
        )}
        {stat.away > 0 && (
          <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: "var(--amber)" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--amber)]" /> {stat.away} away
          </span>
        )}
      </div>
    </div>
  );
}

function StakeholderTopologyCard({ stakeholders }: { stakeholders: Stakeholder[] }) {
  return (
    <div className="flex-1 rounded-xl p-3.5 min-w-0 border" style={{ borderColor: STAKEHOLDER_COLOR }}>
      <div className="text-[13px] font-bold leading-tight" style={{ color: STAKEHOLDER_COLOR }}>
        Stakeholders
      </div>
      <div className="text-[26px] font-bold leading-none my-1" style={{ color: STAKEHOLDER_COLOR }}>
        {stakeholders.length}
      </div>
      <div className="text-[9.5px] text-[var(--text-faint)] mb-2.5">Contacts</div>

      <div className="flex flex-wrap gap-1.5">
        {stakeholders.map((s) => (
          <div key={s.sub} className="relative">
            <div
              className="w-8 h-8 rounded-[9px] flex items-center justify-center text-xs font-bold"
              style={{ background: tint(STAKEHOLDER_COLOR, 16), color: STAKEHOLDER_COLOR }}
            >
              {s.initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--green)] border border-[var(--surface)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EscalateArrow() {
  return (
    <div className="flex flex-col items-center justify-center w-12 shrink-0 gap-0.5">
      <div className="flex items-center w-full">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-[var(--text-faint)] leading-none text-[10px]">▶</span>
      </div>
      <span className="text-[8px] font-medium text-[var(--text-faint)]">Escalate</span>
    </div>
  );
}

// ─── Level Section ───────────────────────────────────────────────────────────

function LevelSection({ level, agents }: { level: AgentLevel; agents: Agent[] }) {
  const [expanded, setExpanded] = useState(true);
  const cfg  = LEVEL_CFG[level];
  const stat = levelStats(agents);
  const clr  = stat.pct >= 80 ? "var(--red)" : stat.pct >= 60 ? "var(--amber)" : cfg.color;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--hover)] transition-colors text-left cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />
        <span className="text-[13px] font-bold shrink-0" style={{ color: cfg.color }}>
          {level}
        </span>
        <span className="text-[13px] font-semibold text-[var(--text)] shrink-0">
          {cfg.title}
        </span>
        <span className="text-[10.5px] text-[var(--text-faint)] hidden lg:block truncate">
          · {cfg.desc}
        </span>
        <div className="ml-auto flex items-center gap-4 text-[11px] text-[var(--text-dim)] shrink-0">
          <span>{stat.online}/{agents.length} online</span>
          <span>{stat.open} open</span>
          <span style={{ color: clr }}>{stat.pct}% load</span>
          <span
            className="text-[var(--text-faint)] transition-transform duration-200 inline-block"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▼
          </span>
        </div>
      </button>

      {expanded && agents.length > 0 && (
        <div className="border-t border-[var(--border)] p-3.5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {agents.map((a) => <AgentCard key={a.sub} agent={a} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TeamOrg() {
  const { data: rawUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["team", "users"],
    queryFn: async () => {
      const { data } = await api.get<ResultMessage<{ content: TeamUser[] }>>(
        "/auth-service/v1/users",
        { params: { page: 0, size: 100 } },
      );
      return data.data?.content ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["team", "groups"],
    queryFn: async () => {
      const { data } = await api.get<ResultMessage<UserGroup[]>>("/auth-service/v1/groups");
      return data.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const subToGroupId = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of groups) {
      for (const m of g.members) {
        map.set(m.sub, g.id);
      }
    }
    return map;
  }, [groups]);

  const { data: loadData = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["team", "assignee-load"],
    queryFn: fetchAssigneeLoad,
    staleTime: 30 * 1000,
  });

  const ticketsBySub = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of loadData) {
      map.set(row.assigneeSub, row.openCount);
    }
    return map;
  }, [loadData]);

  const { agents, stakeholders } = useMemo(() => {
    const agents: Agent[]             = [];
    const stakeholders: Stakeholder[] = [];

    for (const u of rawUsers) {
      const groupId = subToGroupId.get(u.sub);
      if (!groupId) continue;

      const role     = GROUP_LEVEL[groupId];
      if (!role) continue;

      const initials = getInitials(u.name);

      if (role === "STAKEHOLDER") {
        stakeholders.push({
          sub: u.sub, initials, name: u.name, title: u.title ?? "",
          department: (u.department || "N/A").toUpperCase(),
        });
      } else {
        const max  = LEVEL_CFG[role].maxTickets;
        const open = ticketsBySub.get(u.sub) ?? 0;
        agents.push({
          sub: u.sub, initials, name: u.name, title: u.title ?? "",
          level: role, status: computeStatus(open, max),
          openTickets: open, maxTickets: max,
        });
      }
    }

    return { agents, stakeholders };
  }, [rawUsers, subToGroupId, ticketsBySub]);

  const byLevel = useMemo(() => ({
    L1: agents.filter((a) => a.level === "L1"),
    L2: agents.filter((a) => a.level === "L2"),
    L3: agents.filter((a) => a.level === "L3"),
  }), [agents]);

  const totalOnline  = agents.filter((a) => a.status !== "AWAY").length;
  const totalMembers = agents.length + stakeholders.length;

  if (usersLoading || groupsLoading || ticketsLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-xs text-[var(--text-faint)]">
        Loading team data…
      </div>
    );
  }

  if (totalMembers === 0) {
    return (
      <div className="py-8 text-center text-xs text-[var(--text-faint)]">
        No team members found
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {/* Global stats */}
      <div className="flex items-center justify-end gap-4 text-[11px]">
        <span className="font-semibold" style={{ color: "var(--green)" }}>● {totalOnline} online</span>
        <span className="text-[var(--text-dim)]">{totalMembers} total members</span>
      </div>

      {/* Escalation Topology */}
      <div className="flex items-stretch gap-2.5">
        <TopologyCard level="L1" agents={byLevel.L1} />
        <EscalateArrow />
        <TopologyCard level="L2" agents={byLevel.L2} />
        <EscalateArrow />
        <TopologyCard level="L3" agents={byLevel.L3} />
        <EscalateArrow />
        <StakeholderTopologyCard stakeholders={stakeholders} />
      </div>

      {/* Per-level agent sections */}
      {(["L1", "L2", "L3"] as AgentLevel[]).map((lvl) =>
        byLevel[lvl].length > 0 ? (
          <LevelSection key={lvl} level={lvl} agents={byLevel[lvl]} />
        ) : null,
      )}

      {/* Stakeholder section */}
      {stakeholders.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STAKEHOLDER_COLOR }} />
            <span className="text-[13px] font-bold" style={{ color: STAKEHOLDER_COLOR }}>
              Stakeholders
            </span>
            <span className="text-[10.5px] text-[var(--text-faint)]">
              Key contacts &amp; escalation
            </span>
            <span className="ml-auto text-[11px] text-[var(--text-dim)]">
              {stakeholders.length} contacts
            </span>
          </div>
          <div className="border-t border-[var(--border)] p-3.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stakeholders.map((s) => <StakeholderCard key={s.sub} s={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}
