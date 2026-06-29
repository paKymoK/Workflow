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
  L1: { color: "#00CFFF", label: "L 1", title: "FRONTLINE SUPPORT",   desc: "FIRST RESPONSE · TRIAGE · INITIAL RESOLUTION",   maxTickets: 8 },
  L2: { color: "#FF9E3D", label: "L 2", title: "SPECIALIST SUPPORT",  desc: "ADVANCED TROUBLESHOOTING · COMPLEX INCIDENTS",    maxTickets: 5 },
  L3: { color: "#00F5C4", label: "L 3", title: "ENGINEERING SUPPORT", desc: "ROOT CAUSE ANALYSIS · DEEP ENGINEERING FIXES",    maxTickets: 3 },
} as const;

const STAKEHOLDER_COLOR = "#FF6B35";

const STATUS_COLOR: Record<AgentStatus, string> = {
  ONLINE: "#00F5C4",
  BUSY:   "#FF3D9A",
  AWAY:   "#FF9E3D",
};

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
  if (pct >= 80) return "#FF3D9A";
  if (pct >= 60) return "#FF9E3D";
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
  const cfg    = LEVEL_CFG[agent.level];
  const pct    = agent.maxTickets > 0 ? Math.round((agent.openTickets / agent.maxTickets) * 100) : 0;
  const clr    = barColor(pct, agent.level);
  const stClr  = STATUS_COLOR[agent.status];

  return (
    <div className="relative border border-[var(--line)] bg-[var(--bg-0)] p-3">
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[var(--fg-faint)]" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[var(--fg-faint)]" />

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 flex items-center justify-center font-bebas text-sm shrink-0"
            style={{ background: cfg.color + "20", border: `1px solid ${cfg.color}`, color: cfg.color }}
          >
            {agent.initials}
          </div>
          <div>
            <div className="font-bebas text-sm text-[var(--fg)] leading-tight">{agent.name}</div>
            <div className="font-mono-tech text-[9px] text-[var(--fg-dim)]">{agent.title}</div>
          </div>
        </div>
        <span className="font-mono-tech text-[9px] flex items-center gap-1 shrink-0 ml-2" style={{ color: stClr }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: stClr }} />
          {agent.status}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <span className="font-mono-tech text-[9px] text-[var(--fg-faint)]">
          {agent.openTickets}/{agent.maxTickets} tickets
        </span>
        <span className="font-bebas text-xl leading-none" style={{ color: clr }}>
          {pct}%
        </span>
      </div>

      <div className="h-[2px] bg-[var(--bg-2)] mt-1.5 overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%`, background: clr }}
        />
      </div>
    </div>
  );
}

// ─── Stakeholder Card ────────────────────────────────────────────────────────

function StakeholderCard({ s }: { s: Stakeholder }) {
  return (
    <div className="relative border border-[var(--line)] bg-[var(--bg-0)] p-3">
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[var(--fg-faint)]" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[var(--fg-faint)]" />

      <div className="flex items-start gap-2">
        <div
          className="relative w-8 h-8 flex items-center justify-center font-bebas text-sm shrink-0"
          style={{ background: STAKEHOLDER_COLOR + "20", border: `1px solid ${STAKEHOLDER_COLOR}`, color: STAKEHOLDER_COLOR }}
        >
          {s.initials}
          <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#00F5C4]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bebas text-sm text-[var(--fg)] truncate">{s.name}</div>
          <div className="font-mono-tech text-[9px] text-[var(--fg-dim)] truncate leading-tight">{s.title}</div>
          <div
            className="mt-1.5 inline-block px-1.5 py-0.5 font-mono-tech text-[8px] font-bold"
            style={{ background: STAKEHOLDER_COLOR, color: "#020B18" }}
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
  const clr  = stat.pct >= 80 ? "#FF3D9A" : stat.pct >= 60 ? "#FF9E3D" : cfg.color;

  return (
    <div
      className="flex-1 p-4 min-w-0"
      style={{ border: `1px solid ${cfg.color}`, boxShadow: `inset 0 0 24px ${cfg.color}0a` }}
    >
      <div className="font-bebas leading-none" style={{ fontSize: 52, color: cfg.color }}>
        {cfg.label}
      </div>
      <div className="font-mono-tech text-[8px] text-[var(--fg-faint)] tracking-widest mb-3">
        {cfg.title}
      </div>

      <div className="flex items-end gap-3 mb-3">
        <div>
          <div className="font-bebas text-2xl text-[var(--fg)]">{agents.length}</div>
          <div className="font-mono-tech text-[7px] text-[var(--fg-faint)] tracking-widest">AGENTS</div>
        </div>
        <div>
          <div className="font-bebas text-2xl text-[var(--fg)]">{stat.open}</div>
          <div className="font-mono-tech text-[7px] text-[var(--fg-faint)] tracking-widest">OPEN</div>
        </div>
        <div>
          <div className="font-bebas text-2xl" style={{ color: clr }}>{stat.pct}%</div>
          <div className="font-mono-tech text-[7px] text-[var(--fg-faint)] tracking-widest">LOAD</div>
        </div>
      </div>

      <div className="h-[2px] bg-[var(--bg-0)] mb-2 overflow-hidden">
        <div className="h-full transition-all duration-500" style={{ width: `${Math.min(stat.pct, 100)}%`, background: clr }} />
      </div>

      <div className="flex flex-wrap gap-2">
        {stat.online > 0 && (
          <span className="font-mono-tech text-[8px] flex items-center gap-1" style={{ color: "#00F5C4" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00F5C4]" /> {stat.online} ONLINE
          </span>
        )}
        {stat.busy > 0 && (
          <span className="font-mono-tech text-[8px] flex items-center gap-1" style={{ color: "#FF3D9A" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF3D9A]" /> {stat.busy} BUSY
          </span>
        )}
        {stat.away > 0 && (
          <span className="font-mono-tech text-[8px] flex items-center gap-1" style={{ color: "#FF9E3D" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF9E3D]" /> {stat.away} AWAY
          </span>
        )}
      </div>
    </div>
  );
}

function StakeholderTopologyCard({ stakeholders }: { stakeholders: Stakeholder[] }) {
  return (
    <div
      className="flex-1 p-4 min-w-0"
      style={{ border: `1px solid ${STAKEHOLDER_COLOR}`, boxShadow: `inset 0 0 24px ${STAKEHOLDER_COLOR}0a` }}
    >
      <div className="font-bebas leading-tight" style={{ fontSize: 18, color: STAKEHOLDER_COLOR }}>
        STAKE-<br />HOLDERS
      </div>
      <div className="font-bebas leading-none my-1" style={{ fontSize: 52, color: STAKEHOLDER_COLOR }}>
        {stakeholders.length}
      </div>
      <div className="font-mono-tech text-[8px] text-[var(--fg-faint)] tracking-widest mb-3">CONTACTS</div>

      <div className="flex flex-wrap gap-1.5">
        {stakeholders.map((s) => (
          <div key={s.sub} className="relative">
            <div
              className="w-8 h-8 flex items-center justify-center font-bebas text-sm"
              style={{ background: STAKEHOLDER_COLOR + "20", border: `1px solid ${STAKEHOLDER_COLOR}`, color: STAKEHOLDER_COLOR }}
            >
              {s.initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#00F5C4]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EscalateArrow() {
  return (
    <div className="flex flex-col items-center justify-center w-14 shrink-0 gap-0.5">
      <div className="flex items-center w-full">
        <div className="flex-1 h-px bg-[var(--line)]" />
        <span className="text-[var(--line)] leading-none" style={{ fontSize: 10 }}>▶</span>
      </div>
      <span className="font-mono-tech tracking-wider" style={{ fontSize: 6, color: "var(--fg-faint)" }}>
        ESCALATE
      </span>
    </div>
  );
}

// ─── Level Section ───────────────────────────────────────────────────────────

function LevelSection({ level, agents }: { level: AgentLevel; agents: Agent[] }) {
  const [expanded, setExpanded] = useState(true);
  const cfg  = LEVEL_CFG[level];
  const stat = levelStats(agents);
  const clr  = stat.pct >= 80 ? "#FF3D9A" : stat.pct >= 60 ? "#FF9E3D" : cfg.color;

  return (
    <div className="border border-[var(--line)] bg-[var(--bg-1)]">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-2)] transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-2 h-2 shrink-0" style={{ background: cfg.color }} />
        <span className="font-bebas text-sm tracking-wider shrink-0" style={{ color: cfg.color }}>
          {level}
        </span>
        <span className="font-bebas text-sm text-[var(--fg)] tracking-wider shrink-0">
          {cfg.title}
        </span>
        <span className="font-mono-tech text-[8px] text-[var(--fg-faint)] hidden lg:block truncate">
          · {cfg.desc}
        </span>
        <div className="ml-auto flex items-center gap-4 font-mono-tech text-[9px] text-[var(--fg-dim)] shrink-0">
          <span>{stat.online}/{agents.length} ONLINE</span>
          <span>{stat.open} OPEN</span>
          <span style={{ color: clr }}>{stat.pct}% LOAD</span>
          <span
            className="text-[var(--fg-faint)] transition-transform duration-200 inline-block"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▼
          </span>
        </div>
      </button>

      {expanded && agents.length > 0 && (
        <div className="border-t border-[var(--line)] p-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
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
      <div className="flex items-center gap-2 py-8 font-mono-tech text-xs text-[var(--fg-faint)]">
        <span className="animate-pulse">▸</span> LOADING TEAM DATA...
      </div>
    );
  }

  if (totalMembers === 0) {
    return (
      <div className="py-8 text-center font-mono-tech text-xs text-[var(--fg-faint)]">
        NO TEAM MEMBERS FOUND
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Global stats */}
      <div className="flex items-center justify-end gap-4 font-mono-tech text-[10px]">
        <span style={{ color: "#00F5C4" }}>● {totalOnline} ONLINE</span>
        <span className="text-[var(--fg-dim)]">{totalMembers} TOTAL MEMBERS</span>
      </div>

      {/* Escalation Topology */}
      <div className="border border-[var(--line)] bg-[var(--bg-1)] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono-tech text-[9px] text-[var(--acc-1)]">▲▲</span>
            <span className="font-bebas text-sm tracking-[.15em] text-[var(--fg)]">ESCALATION TOPOLOGY</span>
          </div>
          <div className="flex items-center gap-3 font-mono-tech text-[9px] text-[var(--fg-dim)]">
            <span style={{ color: "#00F5C4" }}>{totalOnline} ONLINE</span>
            <span>{agents.length} AGENTS</span>
          </div>
        </div>

        <div className="flex items-stretch">
          <TopologyCard level="L1" agents={byLevel.L1} />
          <EscalateArrow />
          <TopologyCard level="L2" agents={byLevel.L2} />
          <EscalateArrow />
          <TopologyCard level="L3" agents={byLevel.L3} />
          <EscalateArrow />
          <StakeholderTopologyCard stakeholders={stakeholders} />
        </div>
      </div>

      {/* Per-level agent sections */}
      {(["L1", "L2", "L3"] as AgentLevel[]).map((lvl) =>
        byLevel[lvl].length > 0 ? (
          <LevelSection key={lvl} level={lvl} agents={byLevel[lvl]} />
        ) : null,
      )}

      {/* Stakeholder section */}
      {stakeholders.length > 0 && (
        <div className="border border-[var(--line)] bg-[var(--bg-1)]">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-2 h-2 shrink-0" style={{ background: STAKEHOLDER_COLOR }} />
            <span className="font-bebas text-sm tracking-wider" style={{ color: STAKEHOLDER_COLOR }}>
              STAKEHOLDERS
            </span>
            <span className="font-mono-tech text-[8px] text-[var(--fg-faint)]">
              KEY CONTACTS & ESCALATION
            </span>
            <span className="ml-auto font-mono-tech text-[9px] text-[var(--fg-dim)]">
              {stakeholders.length} CONTACTS
            </span>
          </div>
          <div className="border-t border-[var(--line)] p-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stakeholders.map((s) => <StakeholderCard key={s.sub} s={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}
