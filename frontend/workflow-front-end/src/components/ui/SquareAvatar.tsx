import { dynamicStyle } from "../../utils/dynamicStyle";

interface SquareAvatarProps {
  name: string;
  size?: number;
  /** "soft" (accent-tinted, default — table/list rows) or "filled" (solid color — profile chips) */
  variant?: "soft" | "filled";
  /** Background color for the "filled" variant. Defaults to purple. */
  color?: string;
}

export function SquareAvatar({ name, size = 26, variant = "soft", color }: SquareAvatarProps) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  const filled = variant === "filled";
  return (
    <span
      className="inline-flex items-center justify-center shrink-0 font-bold rounded-[7px]"
      style={dynamicStyle({
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: filled ? color ?? "var(--purple)" : "var(--accent-soft)",
        color: filled ? "#fff" : "var(--accent)",
      })}
    >
      {initials}
    </span>
  );
}
