import { Avatar } from "antd";

const PALETTE = ["#2F6FED", "#8B5CF6", "#10B981", "#F59E0B", "#F43F5E", "#6366F1"];

export default function InitialsAvatar({ name, size = 28 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const color = PALETTE[name.charCodeAt(0) % PALETTE.length];
  return (
    <Avatar size={size} style={{ backgroundColor: color, flexShrink: 0 }}>
      {initials}
    </Avatar>
  );
}
