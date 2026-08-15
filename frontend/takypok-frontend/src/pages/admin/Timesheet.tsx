import { useState } from "react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { Card, Select, Button, Table, Modal, TimePicker, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  InfoCircleOutlined,
  LineChartOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  ApartmentOutlined,
  DownloadOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { timesheetInit } from "../../data/admin/mockData";
import StatusTag from "../../components/admin/StatusTag";
import InitialsAvatar from "../../components/admin/InitialsAvatar";
import { dynamicStyle } from "../../utils/dynamicStyle";

type TimesheetRecord = (typeof timesheetInit)[number];

const LINES = ["All Lines", "Line A", "Line B", "Line C", "Line D", "Line E", "QC", "Logistics", "Admin", "HR"];

function parseClock(value: string): Dayjs | null {
  return value === "—" ? null : dayjs(value, "HH:mm");
}

export default function Timesheet() {
  const [lineFilter, setLineFilter] = useState("All Lines");
  const [records, setRecords] = useState<TimesheetRecord[]>(timesheetInit);
  const [adjustTarget, setAdjustTarget] = useState<TimesheetRecord | null>(null);
  const [adjustIn, setAdjustIn] = useState<Dayjs | null>(null);
  const [adjustOut, setAdjustOut] = useState<Dayjs | null>(null);
  const [adjustReason, setAdjustReason] = useState("");

  const filtered = lineFilter === "All Lines" ? records : records.filter((r) => r.dept === lineFilter);

  const totalOT = records.reduce((s, r) => s + r.ot, 0).toFixed(1);
  const lateAbsent = records.filter((r) => r.status === "late" || r.status === "absent").length;
  const attRate = ((records.filter((r) => r.status !== "absent").length / records.length) * 100).toFixed(1);

  const kpis = [
    { label: "Avg Attendance Rate (July)", value: `${attRate}%`, icon: <LineChartOutlined />, color: "#10B981" },
    { label: "Total OT Hours (July)", value: `${totalOT}h`, icon: <ClockCircleOutlined />, color: "#F59E0B" },
    { label: "Late / Absence Cases", value: String(lateAbsent), icon: <ExclamationCircleOutlined />, color: "#EF4444" },
  ];

  function openAdjust(r: TimesheetRecord) {
    setAdjustTarget(r);
    setAdjustIn(parseClock(r.clockIn));
    setAdjustOut(parseClock(r.clockOut));
    setAdjustReason("");
  }

  function applyAdjust() {
    if (!adjustTarget) return;
    const nextIn = adjustIn ? adjustIn.format("HH:mm") : "—";
    const nextOut = adjustOut ? adjustOut.format("HH:mm") : "—";
    setRecords((prev) =>
      prev.map((r) => (r.id === adjustTarget.id ? { ...r, clockIn: nextIn, clockOut: nextOut, status: "adjusted" } : r)),
    );
    setAdjustTarget(null);
  }

  const columns: ColumnsType<TimesheetRecord> = [
    {
      title: "Employee",
      dataIndex: "employee",
      render: (_, r) => (
        <div className="flex items-center gap-2">
          <InitialsAvatar name={r.employee} size={28} />
          <span className="font-medium text-[var(--text)]">{r.employee}</span>
        </div>
      ),
    },
    {
      title: "Dept / Line",
      dataIndex: "dept",
      render: (dept: string) => <span className="text-[var(--text-dim)]">{dept}</span>,
    },
    {
      title: "Date",
      dataIndex: "date",
      render: (date: string) => <span className="font-mono text-xs text-[var(--text-dim)]">{date}</span>,
    },
    {
      title: "Clock In",
      dataIndex: "clockIn",
      render: (clockIn: string) => (
        <span className={`font-mono text-xs ${clockIn === "—" ? "text-[var(--red)]" : "text-[var(--text-dim)]"}`}>{clockIn}</span>
      ),
    },
    {
      title: "Clock Out",
      dataIndex: "clockOut",
      render: (clockOut: string) => (
        <span className={`font-mono text-xs ${clockOut === "—" ? "text-[var(--red)]" : "text-[var(--text-dim)]"}`}>{clockOut}</span>
      ),
    },
    {
      title: "Total Hrs",
      dataIndex: "total",
      render: (total: number) => (
        <span className={`font-semibold ${total < 8 && total > 0 ? "text-[var(--amber)]" : "text-[var(--text)]"}`}>
          {total > 0 ? `${total}h` : "—"}
        </span>
      ),
    },
    {
      title: "OT Hrs",
      dataIndex: "ot",
      render: (ot: number) => (
        <span className={`text-xs font-medium ${ot > 0 ? "text-[var(--accent)]" : "text-[var(--text-faint)]"}`}>
          {ot > 0 ? `+${ot}h` : "—"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: "",
      key: "actions",
      render: (_, r) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openAdjust(r)}>
          Adjust
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Integration banner */}
      <div className="flex items-start gap-3 bg-[var(--accent-soft)] border border-[var(--border)] rounded-lg px-4 py-3 mb-5 text-sm text-[var(--text-dim)]">
        <InfoCircleOutlined className="mt-0.5 flex-shrink-0 text-[var(--accent)]" />
        <span>
          Attendance data is synced from the Core HRIS system. Manual adjustments are for exception handling only (e.g. system sync
          issues).
        </span>
      </div>

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

      {/* Filters */}
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
          prefix={<ApartmentOutlined className="text-[var(--text-faint)]" />}
          className="!w-[170px]"
          options={LINES.map((l) => ({ value: l, label: l }))}
        />
        <Button icon={<DownloadOutlined />} className="ml-auto">
          Export
        </Button>
      </div>

      {/* Table */}
      <Table<TimesheetRecord>
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        size="middle"
        scroll={{ x: "max-content" }}
        pagination={false}
      />

      {/* Adjust Modal */}
      <Modal
        open={!!adjustTarget}
        onCancel={() => setAdjustTarget(null)}
        title="Adjust Attendance Record"
        width={480}
        footer={[
          <Button key="cancel" onClick={() => setAdjustTarget(null)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" disabled={!adjustReason.trim()} onClick={applyAdjust}>
            Save Adjustment
          </Button>,
        ]}
      >
        {adjustTarget && (
          <div className="space-y-4">
            <div className="bg-[var(--hover)] rounded-lg px-4 py-3 text-sm">
              <div className="font-semibold text-[var(--text)]">{adjustTarget.employee}</div>
              <div className="text-[var(--text-faint)] text-xs mt-0.5">
                {adjustTarget.dept} · {adjustTarget.date}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-medium text-[var(--text-dim)] mb-1">Clock In</div>
                <TimePicker value={adjustIn} onChange={setAdjustIn} format="HH:mm" className="w-full" />
              </div>
              <div>
                <div className="text-xs font-medium text-[var(--text-dim)] mb-1">Clock Out</div>
                <TimePicker value={adjustOut} onChange={setAdjustOut} format="HH:mm" className="w-full" />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[var(--text-dim)] mb-1">Reason for Adjustment</div>
              <Input.TextArea
                rows={3}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. System failed to sync record, employee was present (verified by supervisor)"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
