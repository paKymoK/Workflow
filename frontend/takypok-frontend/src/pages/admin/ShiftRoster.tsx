import { Button, Card, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DownloadOutlined, PlusOutlined, EditOutlined, EyeOutlined, UserOutlined,
} from "@ant-design/icons";
import InitialsAvatar from "../../components/admin/InitialsAvatar";
import { shiftRoster, employees } from "../../data/admin/mockData";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

type ShiftCode = "Gen" | "Aft" | "Mor";

const SHIFT_TAG_COLOR: Record<ShiftCode, string> = {
  Gen: "default",
  Aft: "orange",
  Mor: "blue",
};

interface AssignmentRow {
  id: number;
  name: string;
  dept: string;
  shift: ShiftCode;
}

const assignmentRows: AssignmentRow[] = employees.slice(0, 10).map((e) => ({
  id: e.id,
  name: e.name,
  dept: e.dept,
  shift: e.line === "HQ" ? "Gen" : e.id % 3 === 0 ? "Aft" : "Mor",
}));

export default function ShiftRoster() {
  const columns: ColumnsType<AssignmentRow> = [
    {
      title: "Employee",
      dataIndex: "name",
      render: (name: string, record) => (
        <div className="flex items-center gap-2.5">
          <InitialsAvatar name={name} size={24} />
          <div>
            <div className="text-xs font-medium text-[var(--text)]">{name}</div>
            <div className="text-[11px] text-[var(--text-faint)]">{record.dept}</div>
          </div>
        </div>
      ),
    },
    ...DAYS.map((day) => ({
      title: day,
      key: day,
      align: "center" as const,
      render: (_: unknown, record: AssignmentRow) => (
        <Tag color={SHIFT_TAG_COLOR[record.shift]}>{record.shift}</Tag>
      ),
    })),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">Shift Roster Management</h1>
          <p className="text-xs text-[var(--text-faint)] mt-0.5">Assign employees to shifts and production lines</p>
        </div>
        <div className="flex gap-2">
          <Button icon={<DownloadOutlined />}>Export</Button>
          <Button type="primary" icon={<PlusOutlined />}>Add Shift</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {shiftRoster.map((s) => (
          <Card key={s.shift} size="small">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text)]">{s.shift}</h3>
                <p className="text-xs text-[var(--text-faint)] mt-0.5">{s.factory}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[var(--text)]">{s.count}</div>
                <div className="text-xs text-[var(--text-faint)]">employees</div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="text-xs">
                <span className="text-[var(--text-faint)] font-medium">Lines: </span>
                <span className="text-[var(--text-dim)]">{s.lines.join(", ")}</span>
              </div>
              <div className="text-xs">
                <span className="text-[var(--text-faint)] font-medium">Supervisors: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {s.supervisors.map((sup) => (
                    <span
                      key={sup}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border)] rounded text-xs"
                    >
                      <UserOutlined style={{ fontSize: 9 }} /> {sup}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
              <Button type="text" size="small" icon={<EditOutlined />}>Edit Roster</Button>
              <Button type="text" size="small" icon={<EyeOutlined />}>View Employees</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card
        size="small"
        title={<span className="text-sm font-semibold text-[var(--text)]">Assignment Matrix — Week Jul 7–11, 2025</span>}
        styles={{ body: { padding: 0 } }}
      >
        <Table<AssignmentRow>
          columns={columns}
          dataSource={assignmentRows}
          rowKey="id"
          size="middle"
          pagination={false}
        />
      </Card>
    </div>
  );
}
