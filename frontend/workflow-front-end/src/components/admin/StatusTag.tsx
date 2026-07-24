import { Tag } from "antd";

type TagColor = "success" | "warning" | "error" | "processing" | "default" | string;

const COLOR_MAP: Record<string, TagColor> = {
  approved: "success",
  active: "success",
  published: "success",
  normal: "success",
  pending: "warning",
  medium: "warning",
  late: "warning",
  rejected: "error",
  urgent: "error",
  absent: "error",
  draft: "default",
  inactive: "default",
  closed: "default",
  low: "default",
  Employee: "default",
  open: "processing",
  scheduled: "processing",
  adjusted: "processing",
  "in-progress": "purple",
  Skills: "purple",
  Admin: "purple",
  high: "orange",
  Onboarding: "blue",
  Manager: "geekblue",
  Safety: "red",
};

const LABEL_MAP: Record<string, string> = {
  "in-progress": "In Progress",
};

export default function StatusTag({ status }: { status: string }) {
  const color = COLOR_MAP[status] ?? "default";
  const label = LABEL_MAP[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
  return <Tag color={color}>{label}</Tag>;
}
