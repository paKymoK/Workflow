import type { ReactNode } from "react";
import dayjs from "dayjs";
import { Card, DatePicker, Select, Button, Progress } from "antd";
import {
  TeamOutlined,
  LineChartOutlined,
  CheckSquareOutlined,
  CustomerServiceOutlined,
  UserAddOutlined,
  FallOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  RiseOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  attendanceTrend,
  productionOutput,
  leaveDist,
  headcountByDept,
  headcountTrend,
  defectRate,
  dailyOutputTrend,
  leaveTrend,
  absenteeRate,
  surveyByDept,
  engagementData,
  ticketByCategory,
  ticketResolutionTrend,
  leaveRequestsInit,
  B_BLUE,
  B_CYAN,
} from "../../data/admin/mockData";
import { dynamicStyle } from "../../utils/dynamicStyle";

const { RangePicker } = DatePicker;

const GREEN = "var(--green)";
const AMBER = "var(--amber)";
const RED = "var(--red)";

interface KpiTileData {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  icon: ReactNode;
  color: string;
}

const kpi1: KpiTileData[] = [
  { label: "Total Headcount", value: "847", delta: "+12 this month", up: true, icon: <TeamOutlined />, color: "#3B82F6" },
  { label: "Attendance Rate", value: "94.8%", delta: "+0.7% vs last month", up: true, icon: <LineChartOutlined />, color: "#10B981" },
  { label: "Pending Approvals", value: "23", delta: "+5 since yesterday", up: false, icon: <CheckSquareOutlined />, color: "#F59E0B" },
  { label: "Open IT Tickets", value: "15", delta: "-3 since yesterday", up: true, icon: <CustomerServiceOutlined />, color: "#8B5CF6" },
];

const kpi2: KpiTileData[] = [
  { label: "New Hires This Month", value: "18", delta: "+6 vs last month", up: true, icon: <UserAddOutlined />, color: "#0EA5E9" },
  { label: "Turnover Rate", value: "2.4%", delta: "-0.3% vs last month", up: true, icon: <FallOutlined />, color: "#F43F5E" },
  { label: "Avg OT Hours / Employee", value: "4.2h", delta: "+0.8h vs last month", up: false, icon: <ClockCircleOutlined />, color: "#F97316" },
  { label: "Avg IT Resolution Time", value: "18.5h", delta: "-0.9h vs last month", up: true, icon: <FieldTimeOutlined />, color: "#14B8A6" },
];

const itSummary = [
  { label: "Tickets Opened", value: "47", sub: "this month", color: "text-[var(--text)]" },
  { label: "Tickets Resolved", value: "32", sub: "68% resolution rate", color: "text-[var(--green)]" },
  { label: "Avg Resolution Time", value: "18.5h", sub: "↓ 0.9h vs last month", color: "text-[var(--green)]" },
  { label: "Urgent / Unassigned", value: "3", sub: "requires immediate action", color: "text-[var(--red)]" },
  { label: "SLA Compliance", value: "91.4%", sub: "target 90%", color: "text-[var(--green)]" },
];

function KpiTile({ label, value, delta, up, icon, color }: KpiTileData) {
  return (
    <Card size="small">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[15px]"
          style={dynamicStyle({ backgroundColor: `${color}1A`, color })}
        >
          {icon}
        </div>
        <span className={`text-xs font-medium flex items-center gap-0.5 ${up ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
          {up ? <RiseOutlined style={{ fontSize: 10 }} /> : <FallOutlined style={{ fontSize: 10 }} />}
        </span>
      </div>
      <div className="text-xl font-bold text-[var(--text)] tracking-tight">{value}</div>
      <div className="text-xs font-medium text-[var(--text-dim)] mt-0.5">{label}</div>
      <div className="text-[11px] text-[var(--text-faint)] mt-0.5">{delta}</div>
    </Card>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-semibold text-[var(--text)] mt-6 mb-3 pb-2 border-b border-[var(--border)]">
      {title}
    </h2>
  );
}

function cardTitle(title: string, subtitle: string) {
  return (
    <div className="py-1">
      <div className="text-sm font-semibold text-[var(--text)]">{title}</div>
      <div className="text-xs font-normal text-[var(--text-faint)] mt-0.5">{subtitle}</div>
    </div>
  );
}

function LegendDot({ color, name }: { color: string; name: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
      <div className="w-2 h-2 rounded-full" style={dynamicStyle({ background: color })} />
      {name}
    </div>
  );
}

export default function Dashboard() {
  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5">
        <RangePicker
          defaultValue={[dayjs("2025-06-01"), dayjs("2025-07-09")]}
          format="MMM D, YYYY"
          suffixIcon={<CalendarOutlined className="text-[var(--text-faint)]" />}
        />
        <Select
          defaultValue="All Departments"
          prefix={<ApartmentOutlined className="text-[var(--text-faint)]" />}
          className="!w-[200px]"
          options={[
            "All Departments",
            "Production Line A",
            "Production Line B",
            "Quality Control",
            "Human Resources",
            "IT",
          ].map((v) => ({ value: v, label: v }))}
        />
        <Button icon={<DownloadOutlined />} className="ml-auto">
          Export Report
        </Button>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        {kpi1.map((k) => (
          <KpiTile key={k.label} {...k} />
        ))}
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-4 gap-3">
        {kpi2.map((k) => (
          <KpiTile key={k.label} {...k} />
        ))}
      </div>

      {/* ── Workforce Overview ── */}
      <SectionHead title="Workforce Overview" />
      <div className="grid grid-cols-5 gap-4 mb-4">
        <Card className="col-span-3" title={cardTitle("Headcount Trend", "Total employees · Last 12 months")}>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={headcountTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[800, 860]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Headcount" stroke={B_BLUE} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="col-span-2" title={cardTitle("Headcount by Department", "Current headcount distribution")}>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={headcountByDept} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="dept" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {headcountByDept.map((d) => (
                  <Cell key={d.dept} fill={["Line A", "Line B", "Line C", "Line D"].includes(d.dept) ? B_BLUE : B_CYAN} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Production Performance ── */}
      <SectionHead title="Production Performance" />
      <div className="grid grid-cols-5 gap-4 mb-4">
        <Card className="col-span-3" title={cardTitle("Daily Output vs Target", "Units produced · Last 30 days")}>
          <ResponsiveContainer width="100%" height={175}>
            <LineChart data={dailyOutputTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
              <YAxis
                domain={[4000, 4700]}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={(v) => Number(v).toLocaleString()} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="actual" name="Actual" stroke={B_BLUE} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="target" name="Target" stroke="var(--border)" strokeWidth={2} strokeDasharray="6 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="col-span-2" title={cardTitle("On-time Delivery Rate", "Orders fulfilled on schedule · July 2025")}>
          <div className="flex items-center gap-5">
            <Progress type="dashboard" percent={96.2} strokeColor={GREEN} size={110} />
            <div className="space-y-3 flex-1">
              <div>
                <div className="text-[11px] text-[var(--text-faint)] font-medium">vs Last Month</div>
                <div className="text-sm font-semibold text-[var(--green)] flex items-center gap-1 mt-0.5">
                  <RiseOutlined style={{ fontSize: 12 }} /> +1.4%
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[var(--text-faint)] font-medium">vs Target (95.0%)</div>
                <div className="text-sm font-semibold text-[var(--green)] flex items-center gap-1 mt-0.5">
                  <RiseOutlined style={{ fontSize: 12 }} /> +1.2 pts
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[var(--text-faint)] font-medium">Orders this month</div>
                <div className="text-sm font-bold text-[var(--text)] mt-0.5">342 / 355</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Card className="col-span-3" title={cardTitle("Production Output by Line", "Units produced vs. target · July 2025")}>
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={productionOutput} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="line" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="output" name="Actual" fill={B_BLUE} radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Target" fill={B_CYAN} fillOpacity={0.4} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="col-span-2" title={cardTitle("Defect Rate by Line", "% defective units · July 2025 · lower is better")}>
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={defectRate} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="line" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" name="Defect Rate" radius={[4, 4, 0, 0]}>
                {defectRate.map((d) => (
                  <Cell key={d.line} fill={d.rate > 2.8 ? RED : d.rate > 2.0 ? AMBER : GREEN} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-[var(--border)]">
            <LegendDot color={GREEN} name="Good ≤ 2.0%" />
            <LegendDot color={AMBER} name="Watch 2.1–2.8%" />
            <LegendDot color={RED} name="Alert ≥ 2.9%" />
          </div>
        </Card>
      </div>

      {/* ── Attendance & Leave ── */}
      <SectionHead title="Attendance & Leave" />
      <div className="grid grid-cols-5 gap-4 mb-4">
        <Card className="col-span-3" title={cardTitle("Attendance Trend", "Monthly rate · Last 6 months")}>
          <ResponsiveContainer width="100%" height={175}>
            <LineChart data={attendanceTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[88, 98]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="rate" name="Attendance" stroke={B_BLUE} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="col-span-2" title={cardTitle("Leave by Type", `This month · ${leaveRequestsInit.length} requests`)}>
          <div className="flex items-center gap-3">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={leaveDist} dataKey="value" nameKey="name" innerRadius={35} outerRadius={55} paddingAngle={2}>
                  {leaveDist.map((d) => (
                    <Cell key={d.name} fill={d.color} stroke="var(--surface)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 flex-1">
              {leaveDist.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={dynamicStyle({ backgroundColor: d.color })} />
                  <span className="text-[var(--text-dim)] flex-1">{d.name}</span>
                  <span className="text-[var(--text)] font-semibold">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Card className="col-span-3" title={cardTitle("Leave Requests Trend", "By leave type · Last 6 months")}>
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={leaveTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="annual" name="Annual" stackId="leave" fill={B_BLUE} />
              <Bar dataKey="medical" name="Medical" stackId="leave" fill={B_CYAN} />
              <Bar dataKey="emergency" name="Emergency" stackId="leave" fill="#F59E0B" />
              <Bar dataKey="maternity" name="Maternity" stackId="leave" fill="#8B5CF6" />
              <Bar dataKey="others" name="Others" stackId="leave" fill="#94A3B8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="col-span-2" title={cardTitle("Late / Absence Rate by Dept", "% of scheduled shifts missed · July")}>
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={absenteeRate} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis
                type="number"
                domain={[0, 8]}
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis type="category" dataKey="dept" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                {absenteeRate.map((d) => (
                  <Cell key={d.dept} fill={d.rate > 4.5 ? RED : d.rate > 3.0 ? AMBER : GREEN} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Engagement & Support ── */}
      <SectionHead title="Engagement & Support" />
      <div className="grid grid-cols-5 gap-4 mb-4">
        <Card className="col-span-2" title={cardTitle("Survey Completion by Dept", "% employees who completed active surveys")}>
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={surveyByDept} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="dept" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                {surveyByDept.map((d) => (
                  <Cell key={d.dept} fill={d.rate >= 80 ? GREEN : d.rate >= 60 ? B_BLUE : AMBER} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="col-span-2" title={cardTitle("Content Engagement Rates", "% read / completion rate · July 2025")}>
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={engagementData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" fill={B_BLUE} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="col-span-1" title={cardTitle("Tickets by Category", "Volume · July 2025")}>
          <div className="flex justify-center">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={ticketByCategory} dataKey="value" nameKey="name" innerRadius={35} outerRadius={55} paddingAngle={2}>
                  {ticketByCategory.map((d) => (
                    <Cell key={d.name} fill={d.color} stroke="var(--surface)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {ticketByCategory.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-[11px]">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={dynamicStyle({ backgroundColor: d.color })} />
                <span className="text-[var(--text-dim)] flex-1">{d.name}</span>
                <span className="font-semibold text-[var(--text)]">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Card className="col-span-3" title={cardTitle("IT Ticket Resolution Time Trend", "Average hours to resolve · Last 6 months")}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={ticketResolutionTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[15, 32]} tickFormatter={(v: number) => `${v}h`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `${v}h`} />
              <Line type="monotone" dataKey="hours" name="Avg Resolution" stroke={GREEN} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="col-span-2" title={cardTitle("IT Support Summary", "July 2025 snapshot")}>
          <div>
            {itSummary.map((s) => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <div>
                  <div className="text-xs font-medium text-[var(--text-dim)]">{s.label}</div>
                  <div className="text-[11px] text-[var(--text-faint)] mt-0.5">{s.sub}</div>
                </div>
                <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
