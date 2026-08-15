import { useState } from "react";
import { Card, Select, Button, Table, Modal, Input, InputNumber } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  DashboardOutlined,
  AppstoreOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  FundProjectionScreenOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { productionKpiInit, kpiLineTrend30, B_BLUE } from "../../data/admin/mockData";
import { dynamicStyle } from "../../utils/dynamicStyle";

type KpiRecord = (typeof productionKpiInit)[number];

const LINES = ["All Lines", "Line A", "Line B", "Line C", "Line D", "Line E"];
const FORM_LINES = ["Line A", "Line B", "Line C", "Line D", "Line E"];

const LINE_MULTIPLIER: Record<string, number> = {
  "Line B": 0.93,
  "Line C": 0.82,
  "Line D": 0.92,
  "Line E": 0.77,
};

interface FormState {
  line: string;
  date: string;
  target: string;
  actual: string;
  defects: string;
}

const emptyForm: FormState = { line: "Line A", date: "", target: "", actual: "", defects: "" };

export default function ProductionKpi() {
  const [lineFilter, setLineFilter] = useState("Line A");
  const [records, setRecords] = useState<KpiRecord[]>(productionKpiInit);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<KpiRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const filtered = lineFilter === "All Lines" ? records : records.filter((r) => r.line === lineFilter);

  const totalOutput = records.reduce((s, r) => s + r.actual, 0);
  const avgEfficiency = (records.reduce((s, r) => s + r.efficiency, 0) / records.length).toFixed(1);
  const avgDefectRate = (records.reduce((s, r) => s + r.defectRate, 0) / records.length).toFixed(2);

  const multiplier = LINE_MULTIPLIER[lineFilter] ?? 1;
  const lineTrend =
    lineFilter === "All Lines"
      ? kpiLineTrend30
      : kpiLineTrend30.map((d) => ({ ...d, actual: Math.round(d.actual * multiplier) }));

  const kpis = [
    { label: "Overall Efficiency (July)", value: `${avgEfficiency}%`, icon: <DashboardOutlined />, color: "#3B82F6" },
    { label: "Total Output (July)", value: totalOutput.toLocaleString(), icon: <AppstoreOutlined />, color: "#10B981" },
    { label: "Avg Defect Rate (July)", value: `${avgDefectRate}%`, icon: <ExclamationCircleOutlined />, color: "#F43F5E" },
  ];

  function openAdd() {
    setEditTarget(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(r: KpiRecord) {
    setEditTarget(r);
    setForm({ line: r.line, date: r.date, target: String(r.target), actual: String(r.actual), defects: String(r.defects) });
    setShowForm(true);
  }

  function saveForm() {
    const t = Number(form.target);
    const a = Number(form.actual);
    const d = Number(form.defects) || 0;
    if (!t || !a) return;
    const defectRate = a > 0 ? parseFloat(((d / a) * 100).toFixed(1)) : 0;
    const efficiency = t > 0 ? parseFloat(((a / t) * 100).toFixed(1)) : 0;
    if (editTarget) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editTarget.id ? { ...r, line: form.line, date: form.date, target: t, actual: a, defects: d, defectRate, efficiency } : r,
        ),
      );
    } else {
      setRecords((prev) => [
        { id: Date.now(), line: form.line, date: form.date || "Jul 9", target: t, actual: a, defects: d, defectRate, efficiency },
        ...prev,
      ]);
    }
    setShowForm(false);
  }

  const columns: ColumnsType<KpiRecord> = [
    {
      title: "Line",
      dataIndex: "line",
      render: (line: string) => (
        <span className="inline-flex items-center gap-1.5">
          <FundProjectionScreenOutlined className="text-[var(--text-faint)]" />
          <span className="font-medium text-[var(--text)]">{line}</span>
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      render: (date: string) => <span className="font-mono text-xs text-[var(--text-dim)]">{date}</span>,
    },
    {
      title: "Target Output",
      dataIndex: "target",
      render: (target: number) => <span className="text-[var(--text-dim)]">{target.toLocaleString()}</span>,
    },
    {
      title: "Actual Output",
      dataIndex: "actual",
      render: (actual: number) => <span className="font-semibold text-[var(--text)]">{actual.toLocaleString()}</span>,
    },
    {
      title: "vs Target",
      key: "delta",
      render: (_, r) => {
        const delta = r.actual - r.target;
        return (
          <span className={`text-xs font-semibold ${delta >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
            {delta >= 0 ? "+" : ""}
            {delta.toLocaleString()}
          </span>
        );
      },
    },
    {
      title: "Defect Count",
      dataIndex: "defects",
      render: (defects: number) => <span className="text-[var(--text-dim)]">{defects}</span>,
    },
    {
      title: "Defect Rate",
      dataIndex: "defectRate",
      render: (rate: number) => {
        const color = rate <= 2 ? "text-[var(--green)]" : rate <= 2.8 ? "text-[var(--amber)]" : "text-[var(--red)]";
        return <span className={`font-semibold text-sm ${color}`}>{rate}%</span>;
      },
    },
    {
      title: "Efficiency",
      dataIndex: "efficiency",
      render: (efficiency: number) => {
        const barColor = efficiency >= 100 ? "var(--green)" : efficiency >= 95 ? "var(--amber)" : "var(--red)";
        const textColor = efficiency >= 100 ? "text-[var(--green)]" : efficiency >= 95 ? "text-[var(--amber)]" : "text-[var(--red)]";
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-[var(--hover)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={dynamicStyle({ width: `${Math.min(efficiency, 100)}%`, backgroundColor: barColor })}
              />
            </div>
            <span className={`font-semibold text-xs ${textColor}`}>{efficiency}%</span>
          </div>
        );
      },
    },
    {
      title: "",
      key: "actions",
      render: (_, r) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
          Edit
        </Button>
      ),
    },
  ];

  const calcEfficiency = form.actual && form.target ? ((Number(form.actual) / Number(form.target)) * 100).toFixed(1) : null;
  const calcDefectRate =
    form.defects && Number(form.actual) > 0 ? ((Number(form.defects) / Number(form.actual)) * 100).toFixed(2) : null;

  return (
    <div>
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {kpis.map((k) => (
          <Card key={k.label} size="small">
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={dynamicStyle({ backgroundColor: `${k.color}1A`, color: k.color })}
              >
                {k.icon}
              </div>
              <div>
                <div className="text-xl font-bold text-[var(--text)]">{k.value}</div>
                <div className="text-xs text-[var(--text-dim)] mt-0.5">{k.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters + actions */}
      <div className="flex items-center gap-3 mb-4">
        <Select
          defaultValue="Jul 1 – Jul 9, 2025"
          prefix={<CalendarOutlined className="text-[var(--text-faint)]" />}
          className="!w-[190px]"
          options={["Jul 1 – Jul 9, 2025", "Jun 1 – Jun 30, 2025"].map((v) => ({ value: v, label: v }))}
        />
        <Select
          value={lineFilter}
          onChange={setLineFilter}
          prefix={<FundProjectionScreenOutlined className="text-[var(--text-faint)]" />}
          className="!w-[150px]"
          options={LINES.map((l) => ({ value: l, label: l }))}
        />
        <div className="ml-auto flex items-center gap-2">
          <Button icon={<DownloadOutlined />}>Export</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            Add Entry
          </Button>
        </div>
      </div>

      {/* Output trend chart for selected line */}
      {lineFilter !== "All Lines" && (
        <Card
          className="mb-4"
          title={
            <div className="py-1">
              <div className="text-sm font-semibold text-[var(--text)]">Output Trend — {lineFilter}</div>
              <div className="text-xs font-normal text-[var(--text-faint)] mt-0.5">Daily actual output · Last 30 days</div>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={lineTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
              <YAxis
                tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={(v) => Number(v).toLocaleString()} />
              <Line type="monotone" dataKey="actual" name="Actual Output" stroke={B_BLUE} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Table */}
      <Table<KpiRecord>
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        size="middle"
        scroll={{ x: "max-content" }}
        pagination={false}
      />

      {/* Add / Edit Modal */}
      <Modal
        open={showForm}
        onCancel={() => setShowForm(false)}
        title={editTarget ? "Edit KPI Entry" : "Add Daily KPI Entry"}
        width={480}
        footer={[
          <Button key="cancel" onClick={() => setShowForm(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" disabled={!form.target || !form.actual} onClick={saveForm}>
            {editTarget ? "Save Changes" : "Add Entry"}
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-medium text-[var(--text-dim)] mb-1">Production Line</div>
              <Select
                value={form.line}
                onChange={(v) => setForm((f) => ({ ...f, line: v }))}
                className="w-full"
                options={FORM_LINES.map((l) => ({ value: l, label: l }))}
              />
            </div>
            <div>
              <div className="text-xs font-medium text-[var(--text-dim)] mb-1">Date</div>
              <Input value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} placeholder="e.g. Jul 10" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs font-medium text-[var(--text-dim)] mb-1">Target Output</div>
              <InputNumber
                className="w-full"
                value={form.target ? Number(form.target) : undefined}
                onChange={(v) => setForm((f) => ({ ...f, target: v == null ? "" : String(v) }))}
                placeholder="4500"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-[var(--text-dim)] mb-1">Actual Output</div>
              <InputNumber
                className="w-full"
                value={form.actual ? Number(form.actual) : undefined}
                onChange={(v) => setForm((f) => ({ ...f, actual: v == null ? "" : String(v) }))}
                placeholder="4480"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-[var(--text-dim)] mb-1">Defect Count</div>
              <InputNumber
                className="w-full"
                value={form.defects ? Number(form.defects) : undefined}
                onChange={(v) => setForm((f) => ({ ...f, defects: v == null ? "" : String(v) }))}
                placeholder="82"
              />
            </div>
          </div>
          {calcEfficiency && (
            <div className="bg-[var(--hover)] rounded-lg px-4 py-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-[var(--text-faint)]">Calculated Efficiency</div>
                <div className="font-bold text-[var(--text)] mt-0.5">{calcEfficiency}%</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-faint)]">Defect Rate</div>
                <div className="font-bold text-[var(--text)] mt-0.5">{calcDefectRate ?? "—"}%</div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
