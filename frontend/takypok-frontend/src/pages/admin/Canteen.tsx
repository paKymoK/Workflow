import { useState } from "react";
import { Button, Table, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DownloadOutlined } from "@ant-design/icons";
import { canteenWeek } from "../../data/admin/mockData";

const { TextArea } = Input;

const MEALS = ["breakfast", "lunch", "dinner"] as const;
type Meal = (typeof MEALS)[number];

const MEAL_META: Record<Meal, { label: string; time: string }> = {
  breakfast: { label: "Breakfast", time: "06:30–07:30" },
  lunch: { label: "Lunch", time: "12:00–13:00" },
  dinner: { label: "Dinner", time: "18:00–19:00" },
};

interface MealRow {
  key: Meal;
  meal: Meal;
  [day: string]: string;
}

export default function Canteen() {
  const [menuData, setMenuData] = useState(canteenWeek);
  const days = Object.keys(menuData);

  const update = (day: string, meal: string, val: string) =>
    setMenuData((prev) => ({ ...prev, [day]: { ...prev[day], [meal]: val } }));

  const dataSource: MealRow[] = MEALS.map((meal) => {
    const row = { key: meal, meal } as MealRow;
    days.forEach((d) => { row[d] = menuData[d][meal]; });
    return row;
  });

  const columns: ColumnsType<MealRow> = [
    {
      title: "Meal",
      dataIndex: "meal",
      fixed: "left",
      width: 150,
      render: (meal: Meal) => (
        <div>
          <div className="text-xs font-semibold text-[var(--text)] capitalize">{MEAL_META[meal].label}</div>
          <div className="text-[11px] text-[var(--text-faint)] mt-0.5">{MEAL_META[meal].time}</div>
        </div>
      ),
    },
    ...days.map((day) => ({
      title: day,
      dataIndex: day,
      width: 240,
      render: (_: string, record: MealRow) => (
        <TextArea
          value={menuData[day][record.meal]}
          onChange={(e) => update(day, record.meal, e.target.value)}
          autoSize={{ minRows: 3, maxRows: 6 }}
          variant="borderless"
          className="!text-xs !p-1"
        />
      ),
    })),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">Weekly Canteen Menu</h1>
          <p className="text-xs text-[var(--text-faint)] mt-0.5">Week of Jul 7–11, 2025 · Click any cell to edit</p>
        </div>
        <div className="flex gap-2">
          <Button icon={<DownloadOutlined />}>Export</Button>
          <Button type="primary">Save Menu</Button>
        </div>
      </div>

      <Table<MealRow>
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        size="middle"
        scroll={{ x: "max-content" }}
      />
    </div>
  );
}
